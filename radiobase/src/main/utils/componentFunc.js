// main/utils/componentFunc.js
import fs from 'fs';
import path from 'path';
import {
  savePdfToFile,
  removePdfFile,
  getPdfFile,
  pdfFileExists
} from './pdfFunc.js';
//import { dbUtils } from './miniUtils.js';

class ComponentFunctions {
  constructor(database) {
    this.db = database.db;
    this.dbInstance = database;
    this.datasheetsDir = database.datasheetsDir;
  }

  // ===== API КОМПОНЕНТОВ =====

  async getComponentPdfPath(componentId) {
    try {
      const component = await this.getComponent(componentId);

      if (component && component.pdf_file_path) {
        const pdfPath = path.join(this.datasheetsDir, component.pdf_file_path);

        if (pdfFileExists(pdfPath)) {
          const pdfBuffer = fs.readFileSync(pdfPath);
          const base64PDF = pdfBuffer.toString('base64');

          return {
            success: true,
            data: base64PDF,
            fileName: component.pdf_filename || path.basename(component.pdf_file_path)
          };
        } else {
          console.warn(`⚠️ PDF file not found on disk: ${pdfPath}`);
        }
      }
      return { success: false, error: 'PDF not found' };
    } catch (error) {
      console.error('Error getting PDF path:', error);
      return { success: false, error: error.message };
    }
  }

  getComponents(categoryId = null) {
    if (categoryId) {
      return this.dbInstance.all(
        "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.category_id = ? ORDER BY c.name",
        [categoryId]
      );
    }
    return this.dbInstance.all("SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id ORDER BY c.name");
  }

  getComponent(id) {
    const component = this.dbInstance.get(`
      SELECT c.*, cat.name as category_name 
      FROM components c 
      LEFT JOIN categories cat ON c.category_id = cat.id 
      WHERE c.id = ?
    `, [id]);

    if (component && component.parameters && typeof component.parameters === 'string') {
      try {
        component.parameters = JSON.parse(component.parameters);
      } catch (error) {
        console.error('❌ JSON parse error:', error);
        component.parameters = {};
      }
    } else if (component) {
      component.parameters = component.parameters || {};
    }

    if (component) {
      component.has_pdf = !!component.pdf_file_path && pdfFileExists(component.pdf_file_path);
      component.pdf_exists = component.has_pdf;
      delete component.pdf_data;

      console.log('📄 PDF file info for component', id, {
        filePath: component.pdf_file_path,
        exists: component.has_pdf,
        filename: component.pdf_filename
      });
    }

    console.log('✅ Final component object:', component);
    return component;
  }

  addComponent(componentData) {
    if (!componentData.category_id || !componentData.name?.trim()) {
      return { success: false, error: "Категория и название компонента обязательны" };
    }

    console.log('📝 Database: addComponent called with data:', {
      hasPdf: !!componentData.pdf_data,
      pdfFilename: componentData.pdf_filename,
      pdfSize: componentData.pdf_size,
      allFields: Object.keys(componentData)
    });

    const result = this.dbInstance.run(`
      INSERT INTO components 
      (category_id, name, storage_cell, datasheet_url, quantity, updated_at, 
       parameters, image_data, description, 
       pdf_filename, pdf_size, pdf_mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      componentData.category_id,
      componentData.name.trim(),
      componentData.storage_cell?.trim() || null,
      componentData.datasheet_url?.trim() || null,
      Math.max(0, parseInt(componentData.quantity) || 0),
      componentData.updated_at || new Date().toISOString(),
      this.dbInstance.serializeParameters(componentData.parameters),
      componentData.image_data || null,
      componentData.description?.trim() || null,
      componentData.pdf_filename || null,
      componentData.pdf_size || 0,
      componentData.pdf_mime_type || 'application/pdf'
    ]);

    console.log('📊 Database: addComponent result:', result);

    if (result.success && result.changes > 0 && componentData.pdf_data) {
      const lastId = result.lastInsertRowid;
      const saveResult = savePdfToFile(
        componentData.pdf_data,
        componentData.pdf_filename || `component_${lastId}.pdf`,
        lastId,
        this.datasheetsDir
      );

      if (saveResult.success) {
        this.dbInstance.run(
          "UPDATE components SET pdf_file_path = ? WHERE id = ?",
          [saveResult.filePath, lastId]
        );
        console.log('📄 PDF дополнительно сохранен в файл:', saveResult.filePath);
      }
    }

    if (result.success && result.changes > 0) {
      return { success: true, id: result.lastInsertRowid };
    }

    if (result.error) {
      console.error('❌ Database SQL error:', result.error);
    }

    return {
      success: false,
      error: result.error || "Ошибка добавления компонента"
    };
  }

  getComponentPdf(id) {
    try {
      const component = this.dbInstance.get("SELECT pdf_file_path, pdf_filename FROM components WHERE id = ?", [id]);

      if (!component || !component.pdf_file_path) {
        return { success: false, error: "PDF not found" };
      }

      if (!pdfFileExists(component.pdf_file_path)) {
        return { success: false, error: "PDF file does not exist on disk" };
      }

      const result = getPdfFile(component.pdf_file_path);
      if (result.success) {
        return {
          success: true,
          data: result.data,
          filename: component.pdf_filename,
          filePath: component.pdf_file_path
        };
      }
      return result;

    } catch (error) {
      console.error('❌ Error getting component PDF:', error);
      return { success: false, error: error.message };
    }
  }

  removeComponentPdf(id) {
    const component = this.dbInstance.get("SELECT pdf_file_path FROM components WHERE id = ?", [id]);

    if (component && component.pdf_file_path) {
      removePdfFile(component.pdf_file_path);
    }

    return this.dbInstance.run(`
      UPDATE components 
      SET pdf_filename = NULL, pdf_size = 0, pdf_file_path = NULL 
      WHERE id = ?`,
      [id]
    );
  }

  updateComponent(componentData) {
    if (!componentData.id) {
      return { success: false, error: "ID компонента обязателен для обновления" };
    }

    const currentComponent = this.getComponent(componentData.id);

    let parametersString = '{}';
    if (componentData.parameters) {
      if (typeof componentData.parameters === 'string') {
        try {
          JSON.parse(componentData.parameters);
          parametersString = componentData.parameters;
        } catch {
          parametersString = '{}';
        }
      } else if (typeof componentData.parameters === 'object') {
        parametersString = JSON.stringify(componentData.parameters);
      }
    }

    if (componentData.pdf_data && currentComponent?.pdf_file_path) {
      removePdfFile(currentComponent.pdf_file_path);
    }

    const result = this.dbInstance.run(`
      UPDATE components 
      SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
          quantity = ?, updated_at = ?, parameters = ?, image_data = ?, 
          description = ?, pdf_filename = ?, pdf_size = ?, 
          pdf_mime_type = ?
      WHERE id = ?
    `, [
      componentData.category_id,
      componentData.name,
      componentData.storage_cell,
      componentData.datasheet_url,
      componentData.quantity,
      new Date().toISOString(),
      parametersString,
      componentData.image_data,
      componentData.description,
      componentData.pdf_filename || null,
      componentData.pdf_size || 0,
      componentData.pdf_mime_type || 'application/pdf',
      componentData.id
    ]);

    if (result.success && result.changes > 0 && componentData.pdf_data) {
      const saveResult = savePdfToFile(
        componentData.pdf_data,
        componentData.pdf_filename || `component_${componentData.id}.pdf`,
        componentData.id,
        this.datasheetsDir
      );

      if (saveResult.success) {
        this.dbInstance.run(
          "UPDATE components SET pdf_file_path = ? WHERE id = ?",
          [saveResult.filePath, componentData.id]
        );
        console.log('📄 PDF обновлен в файле:', saveResult.filePath);
      }
    }

    return {
      success: result.success,
      changes: result.changes,
      error: result.success && result.changes === 0 ? "Компонент не найден" : null
    };
  }

  deleteComponent(id) {
    const component = this.dbInstance.get("SELECT pdf_file_path FROM components WHERE id = ?", [id]);

    if (component && component.pdf_file_path) {
      removePdfFile(component.pdf_file_path);
    }

    const result = this.dbInstance.run("DELETE FROM components WHERE id = ?", [id]);
    return {
      success: result.success && result.changes > 0,
      error: result.success && result.changes === 0 ? "Компонент не найден" : null
    };
  }
}

export default ComponentFunctions;
