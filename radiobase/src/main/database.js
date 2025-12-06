const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ComponentsDatabase {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.initPromise = this.initialize();
  }

  async initialize() {
    try {
      // Для portable приложения определяем путь относительно оригинального .exe файла
      let basePath;

      if (app.isPackaged) {
        // В portable версии process.execPath указывает на временную папку
        // Нужно получить путь к оригинальному .exe файлу
        const originalExecPath = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
        basePath = path.dirname(originalExecPath);
        console.log('📁 Original executable path:', originalExecPath);
        console.log('📁 Base directory for database:', basePath);
      } else {
        // В режиме разработки - папка проекта
        basePath = app.getAppPath();
      }

      const dbDir = path.join(basePath, 'Database');

      console.log('📁 Database directory:', dbDir);

      // Создаем папку Database если не существует
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('✅ Created database directory');
      }


      // Создаем папку для хранения файлов PDF
      this.datasheetsDir = path.join(dbDir, 'datasheets');
      if (!fs.existsSync(this.datasheetsDir)) {
        fs.mkdirSync(this.datasheetsDir, { recursive: true });
        console.log('📁 Created datasheets directory:', this.datasheetsDir);
      }





      this.dbPath = path.join(dbDir, 'radiodata.db');
      console.log('📁 Final database path:', this.dbPath);

      // Инициализируем SQL.js
      const SQL = await initSqlJs();

      // Проверяем существование файла БД
      if (fs.existsSync(this.dbPath)) {
        console.log('✅ Loading existing database');
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
      } else {
        console.log('🆕 Creating new database');
        this.db = new SQL.Database();
        this.createTables();
        this.insertInitialCategories();
        this.saveToFile();
      }


      this.checkTableStructure();

      console.log('✅ Database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    }
  }




  // Сохраняем БД в файл
  saveToFile() {
    if (this.db && this.dbPath) {
      try {
        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
        console.log('💾 Database saved to file:', this.dbPath);

        // Проверяем что файл действительно создался
        const exists = fs.existsSync(this.dbPath);
        console.log('🔍 Database file exists after save:', exists);
        if (exists) {
          const stats = fs.statSync(this.dbPath);
          console.log('📊 Database file size:', stats.size, 'bytes');
        }
      } catch (error) {
        console.error('❌ Error saving database:', error);
      }
    }
  }

  createTables() {
    const sql = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS components (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        storage_cell TEXT,
        datasheet_url TEXT,
        quantity INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        parameters TEXT DEFAULT '{}',
        image_data TEXT,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        pdf_data BLOB, -- Для хранения PDF как бинарных данных
        pdf_filename TEXT, -- Оригинальное имя файла
        pdf_size INTEGER, -- Размер файла в байтах
        pdf_mime_type TEXT DEFAULT 'application/pdf',
        pdf_file_path TEXT, -- ===== путь к файлу на диске =====
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id);
      CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
      CREATE INDEX IF NOT EXISTS idx_components_storage ON components(storage_cell);
      CREATE INDEX IF NOT EXISTS idx_components_updated ON components(updated_at);
    `;

    this.db.exec(sql);
  }

  insertInitialCategories() {
    const categories = ["Транзисторы", "Резисторы", "Конденсаторы", "Микросхемы", "Диоды"];

    const stmt = this.db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');

    categories.forEach(category => {
      stmt.run([category]);
    });

    stmt.free();
    this.saveToFile();
  }

  // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ =====

  all(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (error) {
      console.error('❌ Query error (all):', error.message, sql, params);
      return [];
    }
  }

  get(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const result = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return result;
    } catch (error) {
      console.error('❌ Query error (get):', error.message, sql, params);
      return null;
    }
  }

  run(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      const changes = this.db.getRowsModified();
      stmt.free();

      // Получаем lastInsertRowid отдельным запросом
      const lastIdResult = this.get("SELECT last_insert_rowid() as id");

      this.saveToFile(); // Сохраняем изменения в файл

      return {
        success: true,
        changes: changes,
        lastInsertRowid: lastIdResult ? lastIdResult.id : 0
      };
    } catch (error) {
      console.error('❌ Query error (run):', error.message, sql, params);
      return {
        success: false,
        changes: 0,
        lastInsertRowid: 0,
        error: error.message
      };
    }
  }

  // ===== API КАТЕГОРИЙ =====

  getCategories() {
    return this.all("SELECT * FROM categories ORDER BY name");
  }

  addCategory(name) {
    if (!name || !name.trim()) {
      return { success: false, error: "Название категории не может быть пустым" };
    }

    const result = this.run("INSERT INTO categories (name) VALUES (?)", [name.trim()]);

    if (result.success && result.changes > 0) {
      return { success: true, id: result.lastInsertRowid };
    }

    return {
      success: false,
      error: result.error?.includes('UNIQUE')
        ? "Категория с таким названием уже существует"
        : "Ошибка добавления категории"
    };
  }

  updateCategory(id, name) {
    if (!name || !name.trim()) {
      return { success: false, error: "Название категории не может быть пустым" };
    }

    const result = this.run("UPDATE categories SET name = ? WHERE id = ?", [name.trim(), id]);

    if (result.success && result.changes > 0) {
      return { success: true };
    }

    return {
      success: false,
      error: result.changes === 0 ? "Категория не найдена" : "Ошибка обновления категории"
    };
  }

  deleteCategory(id) {
    const result = this.run("DELETE FROM categories WHERE id = ?", [id]);
    return {
      success: result.success && result.changes > 0,
      error: result.success && result.changes === 0 ? "Категория не найдена" : null
    };
  }

  // ===== API КОМПОНЕНТОВ =====

  getComponents(categoryId = null) {
    if (categoryId) {
      return this.all(
        "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.category_id = ? ORDER BY c.name",
        [categoryId]
      );
    }
    return this.all("SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id ORDER BY c.name");
  }












  getComponent(id) {
    const component = this.get(`
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

    // Добавляем флаг наличия PDF
    if (component) {
      component.has_pdf = !!component.pdf_data;
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

    const result = this.run(`
    INSERT INTO components 
    (category_id, name, storage_cell, datasheet_url, quantity, updated_at, 
     parameters, image_data, description, 
     pdf_data, pdf_filename, pdf_size, pdf_mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
      componentData.category_id,
      componentData.name.trim(),
      componentData.storage_cell?.trim() || null,
      componentData.datasheet_url?.trim() || null,
      Math.max(0, parseInt(componentData.quantity) || 0),
      componentData.updated_at || new Date().toISOString(),
      this.serializeParameters(componentData.parameters),
      componentData.image_data || null,
      componentData.description?.trim() || null,
      // PDF fields
      componentData.pdf_data || null,
      componentData.pdf_filename || null,
      componentData.pdf_size || 0,
      componentData.pdf_mime_type || 'application/pdf'
    ]);

    console.log('📊 Database: addComponent result:', result);





  // Если есть PDF данные и компонент успешно добавлен - сохраняем файл
  if (result.success && result.changes > 0 && componentData.pdf_data) {
    const lastId = result.lastInsertRowid;
    const saveResult = this.savePdfToFile(
      componentData.pdf_data,
      componentData.pdf_filename || `component_${lastId}.pdf`,
      lastId
    );
    
    if (saveResult.success) {
      // Опционально: сохраняем путь к файлу в БД (добавляем новое поле в UPDATE)
      this.run(
        "UPDATE components SET pdf_file_path = ? WHERE id = ?",
        [saveResult.filePath, lastId]
      );
      console.log('📄 PDF дополнительно сохранен в файл:', saveResult.filePath);
    }
  }





    if (result.success && result.changes > 0) {
      return { success: true, id: result.lastInsertRowid };
    }

    // Логируем SQL ошибку если есть
    if (result.error) {
      console.error('❌ Database SQL error:', result.error);
    }

    return {
      success: false,
      error: result.error || "Ошибка добавления компонента"
    };
  }








  updateComponent(componentData) {
    if (!componentData.id) {
      return { success: false, error: "ID компонента обязателен для обновления" };
    }

    // Убедитесь, что parameters - это объект перед сериализацией
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

    const result = this.run(`
    UPDATE components 
    SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
        quantity = ?, updated_at = ?, parameters = ?, image_data = ?, 
        description = ?, pdf_data = ?, pdf_filename = ?, pdf_size = ?, 
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
      componentData.pdf_data,          // Новое поле
      componentData.pdf_filename,      // Новое поле
      componentData.pdf_size || 0,     // Новое поле
      componentData.pdf_mime_type || 'application/pdf', // Новое поле
      componentData.id
    ]);




     // Если в обновлении есть новые PDF данные - сохраняем файл
  if (result.success && result.changes > 0 && componentData.pdf_data) {
    const saveResult = this.savePdfToFile(
      componentData.pdf_data,
      componentData.pdf_filename || `component_${componentData.id}.pdf`,
      componentData.id
    );
    
    if (saveResult.success) {
      this.run(
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














  /**
 * Сохраняет PDF файл в папку datasheets и возвращает путь к файлу
 * @param {Buffer|Uint8Array} pdfData - Бинарные данные PDF
 * @param {string} filename - Оригинальное имя файла
 * @param {number} componentId - ID компонента (для уникальности)
 * @returns {Object} Результат сохранения
 */
  savePdfToFile(pdfData, filename, componentId) {
    try {
      if (!pdfData || !filename || !componentId) {
        return { success: false, error: "Missing required parameters" };
      }

      // Создаем безопасное имя файла
      const safeName = filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
      const filePath = path.join(this.datasheetsDir, `${componentId}_${safeName}`);

      // Сохраняем файл
      fs.writeFileSync(filePath, pdfData);

      console.log('💾 PDF saved to file:', filePath);

      return {
        success: true,
        filePath: path.relative(path.dirname(this.dbPath), filePath), // Относительный путь
        fullPath: filePath
      };
    } catch (error) {
      console.error('❌ Error saving PDF file:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Удаляет файл PDF из папки datasheets
   */
  removePdfFile(componentId, filename) {
    try {
      if (!componentId || !filename) return { success: false };

      const safeName = filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
      const filePath = path.join(this.datasheetsDir, `${componentId}_${safeName}`);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ PDF file removed:', filePath);
        return { success: true };
      }
      return { success: false, error: "File not found" };
    } catch (error) {
      console.error('❌ Error removing PDF file:', error);
      return { success: false, error: error.message };
    }
  }











  // Метод для удаления PDF
  removeComponentPdf(id) {

      // Сначала получаем информацию о файле для удаления из папки
  const component = this.getComponent(id);
  if (component && component.pdf_filename) {
    this.removePdfFile(id, component.pdf_filename);
  }


    return this.run(`
    UPDATE components 
    SET pdf_data = NULL, pdf_filename = NULL, pdf_size = 0 
    WHERE id = ?`,
      [id]
    );
  }




  deleteComponent(id) {
    const result = this.run("DELETE FROM components WHERE id = ?", [id]);
    return {
      success: result.success && result.changes > 0,
      error: result.success && result.changes === 0 ? "Компонент не найден" : null
    };
  }

  // ===== ПОИСК И ФИЛЬТРАЦИЯ =====

  searchComponents(query) {
    if (!query?.trim()) return [];

    const searchTerm = `%${query.trim()}%`;
    return this.all(`
      SELECT c.*, cat.name as category_name 
      FROM components c 
      LEFT JOIN categories cat ON c.category_id = cat.id 
      WHERE c.name LIKE ? OR c.storage_cell LIKE ? OR cat.name LIKE ? OR c.description LIKE ?
      ORDER BY c.name
    `, [searchTerm, searchTerm, searchTerm, searchTerm]);
  }

  // ===== УТИЛИТЫ =====

  serializeParameters(parameters) {
    if (!parameters) return '{}';
    if (typeof parameters === 'string') {
      try {
        JSON.parse(parameters);
        return parameters;
      } catch {
        return '{}';
      }
    }
    return JSON.stringify(parameters);
  }

  getDatabaseStats() {
    const categoryCount = this.get("SELECT COUNT(*) as count FROM categories")?.count || 0;
    const componentCount = this.get("SELECT COUNT(*) as count FROM components")?.count || 0;
    const totalQuantity = this.get("SELECT SUM(quantity) as total FROM components")?.total || 0;

    return {
      categoryCount,
      componentCount,
      totalQuantity,
      dbPath: this.dbPath,
      lastUpdated: new Date().toISOString()
    };
  }














  checkTableStructure() {
    try {
      const tableInfo = this.all("PRAGMA table_info(components)");
      console.log('📊 Table structure:', tableInfo);

      // Проверяем наличие PDF полей
      const hasPdfData = tableInfo.some(col => col.name === 'pdf_data');
      const hasPdfFilename = tableInfo.some(col => col.name === 'pdf_filename');
      const hasPdfSize = tableInfo.some(col => col.name === 'pdf_size');

      console.log('🔍 PDF columns check:', {
        hasPdfData,
        hasPdfFilename,
        hasPdfSize,
        allColumns: tableInfo.map(col => col.name)
      });

      return { hasPdfData, hasPdfFilename, hasPdfSize };
    } catch (error) {
      console.error('❌ Error checking table structure:', error);
      return { error: error.message };
    }
  }











  checkDatabaseIntegrity() {
    try {
      const integrityCheck = this.all("PRAGMA integrity_check");
      const tables = this.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
      const componentCount = this.get("SELECT COUNT(*) as c FROM components")?.c || 0;

      console.log("✅ Database integrity:", integrityCheck);
      console.log("📊 Database contains tables:", tables.map(t => t.name));
      console.log("🔧 Total components:", componentCount);

      return {
        success: true,
        integrity: integrityCheck,
        tables: tables.map(t => t.name),
        componentCount
      };
    } catch (error) {
      console.error("❌ Database integrity error:", error);
      return { success: false, error: error.message };
    }
  }

  // ===== ОПТИМИЗАЦИЯ И ЗАКРЫТИЕ =====

  optimize() {
    try {
      this.db.exec('PRAGMA optimize');
      this.saveToFile();
      console.log('✅ Database optimized');
    } catch (error) {
      console.error('❌ Database optimization error:', error);
    }
  }

  backup() {
    try {
      const backupPath = this.dbPath + '.backup_' + Date.now();
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(backupPath, buffer);
      console.log('✅ Database backup created:', backupPath);
      return backupPath;
    } catch (error) {
      console.error('❌ Database backup error:', error);
      return null;
    }
  }

  close() {
    if (this.db) {
      this.optimize();
      this.db.close();
      console.log('✅ Database closed');
    }
  }
}

export default ComponentsDatabase;
