const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
import { insertDemoComponent } from './utils/demoData.js';
import { searchComponents } from './utils/searchFunc.js';
import { dbUtils } from './utils/miniUtils.js';
import ComponentFunctions from './utils/componentFunc.js';
import CategoryFunctions from './utils/categoryFunc.js';

class ComponentsDatabase {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.components = null;
    this.categories = null;
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
        await insertDemoComponent(this.db, this); // this.insertDemoComponent();
        this.saveToFile();
      }


      this.checkTableStructure();

      // Инициализируем методы работы с категориями
      this.categories = new CategoryFunctions(this);

      // Инициализируем методы работы с компонентами
      this.components = new ComponentFunctions(this);

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


  // ===== МЕТОДЫ ДЛЯ КАТЕГОРИЙ =====
  getCategories() {
    return this.categories.getCategories();
  }

  addCategory(name) {
    return this.categories.addCategory(name);
  }

  updateCategory(id, name) {
    return this.categories.updateCategory(id, name);
  }

  deleteCategory(id) {
    return this.categories.deleteCategory(id);
  }


  // ===== МЕТОДЫ ДЛЯ КОМПОНЕНТОВ =====
  getComponentPdfPath(componentId) {
    return this.components.getComponentPdfPath(componentId);
  }

  getComponents(categoryId = null) {
    return this.components.getComponents(categoryId);
  }

  getComponent(id) {
    return this.components.getComponent(id);
  }

  addComponent(componentData) {
    return this.components.addComponent(componentData);
  }

  getComponentPdf(id) {
    return this.components.getComponentPdf(id);
  }

  removeComponentPdf(id) {
    return this.components.removeComponentPdf(id);
  }

  updateComponent(componentData) {
    return this.components.updateComponent(componentData);
  }

  deleteComponent(id) {
    return this.components.deleteComponent(id);
  }


  // ===== ПОИСК =====
  searchComponents(query) {
    return searchComponents(this, query);
  }


  // ===== УТИЛИТЫ =====
  serializeParameters(parameters) {
    return dbUtils.serializeParameters(parameters);
  }

  getDatabaseStats() {
    return dbUtils.getDatabaseStats(this);
  }

  checkTableStructure() {
    return dbUtils.checkTableStructure(this);
  }

  checkDatabaseIntegrity() {
    return dbUtils.checkDatabaseIntegrity(this);
  }

  optimize() {
    dbUtils.optimize(this);
  }

  backup() {
    return dbUtils.backup(this);
  }

  close() {
    dbUtils.close(this);
  }


}

export default ComponentsDatabase;
