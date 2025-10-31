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
    
    return component;
  }

  addComponent(componentData) {
    if (!componentData.category_id || !componentData.name?.trim()) {
      return { success: false, error: "Категория и название компонента обязательны" };
    }

    const result = this.run(`
      INSERT INTO components 
      (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      componentData.category_id,
      componentData.name.trim(),
      componentData.storage_cell?.trim() || null,
      componentData.datasheet_url?.trim() || null,
      Math.max(0, parseInt(componentData.quantity) || 0),
      componentData.updated_at || new Date().toISOString(),
      this.serializeParameters(componentData.parameters),
      componentData.image_data || null,
      componentData.description?.trim() || null
    ]);

    if (result.success && result.changes > 0) {
      return { success: true, id: result.lastInsertRowid };
    }
    
    return { success: false, error: "Ошибка добавления компонента" };
  }

  updateComponent(componentData) {
    if (!componentData.id) {
      return { success: false, error: "ID компонента обязателен для обновления" };
    }
  
    const result = this.run(`
      UPDATE components 
      SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
          quantity = ?, updated_at = ?, parameters = ?, image_data = ?, description = ?
      WHERE id = ?
    `, [
      componentData.category_id,
      componentData.name,
      componentData.storage_cell,
      componentData.datasheet_url,
      componentData.quantity,
      new Date().toISOString(),
      JSON.stringify(componentData.parameters),
      componentData.image_data,
      componentData.description,
      componentData.id
    ]);
  
    return { 
      success: result.success, 
      changes: result.changes,
      error: result.success && result.changes === 0 ? "Компонент не найден" : null
    };
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
