// const Database = require('better-sqlite3');
// const path = require('path');
// const { app } = require('electron');

// class ComponentsDatabase {
//   constructor() {
//     // Используем userData папку Electron для хранения БД
//     const userDataPath = app.getPath('userData');
//     this.dbPath = path.join(userDataPath, 'components.db');
    
//     // Создаем папку если не существует
//     const dbDir = path.dirname(this.dbPath);
//     require('fs').mkdirSync(dbDir, { recursive: true });
    
//     this.db = new Database(this.dbPath);
    
//     // Включаем оптимизации
//     this.db.pragma('journal_mode = WAL');
//     this.db.pragma('foreign_keys = ON');
//     this.db.pragma('busy_timeout = 5000');
    
//     this.init();
//   }

//   init() {
//     try {
//       this.createTables();
//       this.insertInitialCategories();
//       this.migrateDatabase();
//       console.log('✅ Database initialized at:', this.dbPath);
//     } catch (error) {
//       console.error('❌ Database initialization error:', error);
//       throw error;
//     }
//   }

//   createTables() {
//     // Создаем таблицы отдельными запросами для лучшей читаемости
//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS categories (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL UNIQUE,
//         created_at TEXT DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS components (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         category_id INTEGER NOT NULL,
//         name TEXT NOT NULL,
//         storage_cell TEXT,
//         datasheet_url TEXT,
//         quantity INTEGER DEFAULT 0,
//         updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         parameters TEXT DEFAULT '{}',
//         image_data TEXT,
//         description TEXT,
//         created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
//       )
//     `);

//     // Создаем индексы для улучшения производительности
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_name ON components(name)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_storage ON components(storage_cell)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_updated ON components(updated_at)');
//   }

//   insertInitialCategories() {
//     const categories = ["Транзисторы", "Резисторы", "Конденсаторы", "Микросхемы", "Диоды"];
    
//     const insertStmt = this.db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    
//     // Используем транзакцию для лучшей производительности
//     const insertMany = this.db.transaction((cats) => {
//       for (const category of cats) {
//         insertStmt.run(category);
//       }
//     });

//     insertMany(categories);
//   }

//   migrateDatabase() {
//     try {
//       const columns = this.db.prepare("PRAGMA table_info(components)").all();
//       const columnNames = columns.map(col => col.name);
      
//       // Все необходимые колонки в одном месте
//       const migrations = [
//         { name: 'storage_cell', type: 'TEXT', default: 'NULL' },
//         { name: 'datasheet_url', type: 'TEXT', default: 'NULL' },
//         { name: 'quantity', type: 'INTEGER', default: '0' },
//         { name: 'updated_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' },
//         { name: 'parameters', type: 'TEXT', default: "'{}'" },
//         { name: 'image_data', type: 'TEXT', default: 'NULL' },
//         { name: 'description', type: 'TEXT', default: 'NULL' },
//         { name: 'created_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' }
//       ];

//       // Выполняем миграции в транзакции
//       const migrate = this.db.transaction(() => {
//         for (const migration of migrations) {
//           if (!columnNames.includes(migration.name)) {
//             this.db.exec(`ALTER TABLE components ADD COLUMN ${migration.name} ${migration.type} DEFAULT ${migration.default}`);
//             console.log(`✅ Added column: ${migration.name}`);
//           }
//         }
//       });

//       migrate();
      
//     } catch (error) {
//       console.error('❌ Migration error:', error);
//     }
//   }

//   // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С БД =====

//   all(sql, params = []) {
//     try {
//       return this.db.prepare(sql).all(params);
//     } catch (error) {
//       console.error('❌ Query error (all):', error.message, sql, params);
//       return [];
//     }
//   }

//   get(sql, params = []) {
//     try {
//       return this.db.prepare(sql).get(params) || null;
//     } catch (error) {
//       console.error('❌ Query error (get):', error.message, sql, params);
//       return null;
//     }
//   }

//   run(sql, params = []) {
//     try {
//       const result = this.db.prepare(sql).run(params);
//       return {
//         success: true,
//         changes: result.changes,
//         lastInsertRowid: result.lastInsertRowid
//       };
//     } catch (error) {
//       console.error('❌ Query error (run):', error.message, sql, params);
//       return { 
//         success: false, 
//         changes: 0, 
//         lastInsertRowid: 0,
//         error: error.message 
//       };
//     }
//   }

//   // ===== API КАТЕГОРИЙ =====

//   getCategories() {
//     return this.all("SELECT * FROM categories ORDER BY name");
//   }

//   addCategory(name) {
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" };
//     }

//     const result = this.run("INSERT INTO categories (name) VALUES (?)", [name.trim()]);
    
//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid };
//     }
    
//     return { 
//       success: false, 
//       error: result.error?.includes('UNIQUE') 
//         ? "Категория с таким названием уже существует" 
//         : "Ошибка добавления категории" 
//     };
//   }

//   updateCategory(id, name) {
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" };
//     }

//     const result = this.run("UPDATE categories SET name = ? WHERE id = ?", [name.trim(), id]);
    
//     if (result.success && result.changes > 0) {
//       return { success: true };
//     }
    
//     return { 
//       success: false, 
//       error: result.changes === 0 ? "Категория не найдена" : "Ошибка обновления категории" 
//     };
//   }

//   deleteCategory(id) {
//     // Используем CASCADE для автоматического удаления компонентов
//     const result = this.run("DELETE FROM categories WHERE id = ?", [id]);
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Категория не найдена" : null
//     };
//   }

//   // ===== API КОМПОНЕНТОВ =====

//   getComponents(categoryId = null) {
//     if (categoryId) {
//       return this.all(
//         "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.category_id = ? ORDER BY c.name", 
//         [categoryId]
//       );
//     }
//     return this.all("SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id ORDER BY c.name");
//   }

//   getComponent(id) {
//     const component = this.get(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.id = ?
//     `, [id]);
    
//     console.log('🔍 Raw component data:', component);
//     console.log('🔍 Parameters type:', typeof component?.parameters);
//     console.log('🔍 Parameters value:', component?.parameters);
    
//     if (component) {
//       // Безопасный парсинг параметров
//       if (component.parameters && typeof component.parameters === 'string') {
//         try {
//           component.parameters = JSON.parse(component.parameters);
//           console.log('✅ Successfully parsed parameters:', component.parameters);
//         } catch (error) {
//           console.error('❌ JSON parse error:', error);
//           component.parameters = {};
//         }
//       } else {
//         component.parameters = component.parameters || {};
//       }
//     }
    
//     return component;
//   }

//   addComponent(componentData) {
//     // Валидация обязательных полей
//     if (!componentData.category_id || !componentData.name?.trim()) {
//       return { success: false, error: "Категория и название компонента обязательны" };
//     }

//     const result = this.run(`
//       INSERT INTO components 
//       (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data, description)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       componentData.category_id,
//       componentData.name.trim(),
//       componentData.storage_cell?.trim() || null,
//       componentData.datasheet_url?.trim() || null,
//       Math.max(0, parseInt(componentData.quantity) || 0),
//       componentData.updated_at || new Date().toISOString(),
//       this.serializeParameters(componentData.parameters),
//       componentData.image_data || null,
//       componentData.description?.trim() || null
//     ]);

//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid };
//     }
    
//     return { success: false, error: "Ошибка добавления компонента" };
//   }

//   updateComponent(componentData) {
//     if (!componentData.id) {
//       return { success: false, error: "ID компонента обязателен для обновления" };
//     }
  
//     const result = this.run(`
//       UPDATE components 
//       SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
//           quantity = ?, updated_at = ?, parameters = ?, image_data = ?, description = ?
//       WHERE id = ?
//     `, [
//       componentData.category_id,
//       componentData.name,
//       componentData.storage_cell,
//       componentData.datasheet_url,
//       componentData.quantity,
//       new Date().toISOString(),
//       JSON.stringify(componentData.parameters),
//       componentData.image_data,
//       componentData.description,
//       componentData.id
//     ]);
  
//     return { 
//       success: result.success, 
//       changes: result.changes,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     };
//   }
  

//   deleteComponent(id) {
//     const result = this.run("DELETE FROM components WHERE id = ?", [id]);
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     };
//   }

//   // ===== ПОИСК И ФИЛЬТРАЦИЯ =====

//   searchComponents(query) {
//     if (!query?.trim()) return [];
    
//     const searchTerm = `%${query.trim()}%`;
//     return this.all(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.name LIKE ? OR c.storage_cell LIKE ? OR cat.name LIKE ? OR c.description LIKE ?
//       ORDER BY c.name
//     `, [searchTerm, searchTerm, searchTerm, searchTerm]);
//   }

//   getComponentsByStorage(cell) {
//     if (!cell?.trim()) return [];
    
//     return this.all(
//       "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.storage_cell = ? ORDER BY c.name",
//       [cell.trim()]
//     );
//   }

//   // ===== УТИЛИТЫ =====

//   serializeParameters(parameters) {
//     if (!parameters) return '{}';
//     if (typeof parameters === 'string') {
//       try {
//         // Если это уже JSON строка, проверяем валидность
//         JSON.parse(parameters);
//         return parameters;
//       } catch {
//         return '{}';
//       }
//     }
//     return JSON.stringify(parameters);
//   }

//   getDatabaseStats() {
//     const categoryCount = this.get("SELECT COUNT(*) as count FROM categories")?.count || 0;
//     const componentCount = this.get("SELECT COUNT(*) as count FROM components")?.count || 0;
//     const totalQuantity = this.get("SELECT SUM(quantity) as total FROM components")?.total || 0;

//     return {
//       categoryCount,
//       componentCount,
//       totalQuantity,
//       dbPath: this.dbPath,
//       lastUpdated: new Date().toISOString()
//     };
//   }

//   checkDatabaseIntegrity() {
//     try {
//       const integrityCheck = this.get("PRAGMA integrity_check");
//       const tables = this.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
//       const componentCount = this.get("SELECT COUNT(*) as c FROM components")?.c || 0;
      
//       console.log("✅ Database integrity:", integrityCheck);
//       console.log("📊 Database contains tables:", tables.map(t => t.name));
//       console.log("🔧 Total components:", componentCount);
      
//       return {
//         success: true,
//         integrity: integrityCheck,
//         tables: tables.map(t => t.name),
//         componentCount
//       };
//     } catch (error) {
//       console.error("❌ Database integrity error:", error);
//       return { success: false, error: error.message };
//     }
//   }

//   // ===== ОПТИМИЗАЦИЯ И ЗАКРЫТИЕ =====

//   optimize() {
//     try {
//       this.db.exec('PRAGMA optimize');
//       this.db.exec('VACUUM');
//       console.log('✅ Database optimized');
//     } catch (error) {
//       console.error('❌ Database optimization error:', error);
//     }
//   }

//   backup() {
//     try {
//       const backupPath = this.dbPath + '.backup_' + Date.now();
//       this.db.backup(backupPath);
//       console.log('✅ Database backup created:', backupPath);
//       return backupPath;
//     } catch (error) {
//       console.error('❌ Database backup error:', error);
//       return null;
//     }
//   }

//   close() {
//     if (this.db) {
//       this.optimize();
//       this.db.close();
//       console.log('✅ Database closed');
//     }
//   }
// }

// export default ComponentsDatabase;




















































// const Database = require('better-sqlite3');
// const path = require('path');
// const { app } = require('electron');

// class ComponentsDatabase {
//   constructor() {
//     // Используем userData папку Electron для хранения БД
//     const userDataPath = app.getPath('userData');
//     this.dbPath = path.join(userDataPath, 'components.db');
//     // Создаем папку если не существует
//     const dbDir = path.dirname(this.dbPath);
//     require('fs').mkdirSync(dbDir, { recursive: true });
//     this.db = new Database(this.dbPath);


    
        

    
//     // Включаем оптимизации
//     this.db.pragma('journal_mode = WAL');
//     this.db.pragma('foreign_keys = ON');
//     this.db.pragma('busy_timeout = 5000');
    
//     this.init();
//   }

//   init() {
//     try {
//       this.createTables();
//       this.insertInitialCategories();
//       this.migrateDatabase();
//       console.log('✅ Database initialized at:', this.dbPath);
//     } catch (error) {
//       console.error('❌ Database initialization error:', error);
//       throw error;
//     }
//   }

//   createTables() {
//     // Создаем таблицы отдельными запросами для лучшей читаемости
//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS categories (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL UNIQUE,
//         created_at TEXT DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS components (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         category_id INTEGER NOT NULL,
//         name TEXT NOT NULL,
//         storage_cell TEXT,
//         datasheet_url TEXT,
//         quantity INTEGER DEFAULT 0,
//         updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         parameters TEXT DEFAULT '{}',
//         image_data TEXT,
//         description TEXT,
//         created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
//       )
//     `);

//     // Создаем индексы для улучшения производительности
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_name ON components(name)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_storage ON components(storage_cell)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_updated ON components(updated_at)');
//   }

//   insertInitialCategories() {
//     const categories = ["Транзисторы", "Резисторы", "Конденсаторы", "Микросхемы", "Диоды"];
    
//     const insertStmt = this.db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    
//     // Используем транзакцию для лучшей производительности
//     const insertMany = this.db.transaction((cats) => {
//       for (const category of cats) {
//         insertStmt.run(category);
//       }
//     });

//     insertMany(categories);
//   }

//   migrateDatabase() {
//     try {
//       const columns = this.db.prepare("PRAGMA table_info(components)").all();
//       const columnNames = columns.map(col => col.name);
      
//       // Все необходимые колонки в одном месте
//       const migrations = [
//         { name: 'storage_cell', type: 'TEXT', default: 'NULL' },
//         { name: 'datasheet_url', type: 'TEXT', default: 'NULL' },
//         { name: 'quantity', type: 'INTEGER', default: '0' },
//         { name: 'updated_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' },
//         { name: 'parameters', type: 'TEXT', default: "'{}'" },
//         { name: 'image_data', type: 'TEXT', default: 'NULL' },
//         { name: 'description', type: 'TEXT', default: 'NULL' },
//         { name: 'created_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' }
//       ];

//       // Выполняем миграции в транзакции
//       const migrate = this.db.transaction(() => {
//         for (const migration of migrations) {
//           if (!columnNames.includes(migration.name)) {
//             this.db.exec(`ALTER TABLE components ADD COLUMN ${migration.name} ${migration.type} DEFAULT ${migration.default}`);
//             console.log(`✅ Added column: ${migration.name}`);
//           }
//         }
//       });

//       migrate();
      
//     } catch (error) {
//       console.error('❌ Migration error:', error);
//     }
//   }

//   // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С БД =====

//   all(sql, params = []) {
//     try {
//       return this.db.prepare(sql).all(params);
//     } catch (error) {
//       console.error('❌ Query error (all):', error.message, sql, params);
//       return [];
//     }
//   }

//   get(sql, params = []) {
//     try {
//       return this.db.prepare(sql).get(params) || null;
//     } catch (error) {
//       console.error('❌ Query error (get):', error.message, sql, params);
//       return null;
//     }
//   }

//   run(sql, params = []) {
//     try {
//       const result = this.db.prepare(sql).run(params);
//       return {
//         success: true,
//         changes: result.changes,
//         lastInsertRowid: result.lastInsertRowid
//       };
//     } catch (error) {
//       console.error('❌ Query error (run):', error.message, sql, params);
//       return { 
//         success: false, 
//         changes: 0, 
//         lastInsertRowid: 0,
//         error: error.message 
//       };
//     }
//   }

//   // ===== API КАТЕГОРИЙ =====

//   getCategories() {
//     return this.all("SELECT * FROM categories ORDER BY name");
//   }

//   addCategory(name) {
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" };
//     }

//     const result = this.run("INSERT INTO categories (name) VALUES (?)", [name.trim()]);
    
//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid };
//     }
    
//     return { 
//       success: false, 
//       error: result.error?.includes('UNIQUE') 
//         ? "Категория с таким названием уже существует" 
//         : "Ошибка добавления категории" 
//     };
//   }

//   updateCategory(id, name) {
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" };
//     }

//     const result = this.run("UPDATE categories SET name = ? WHERE id = ?", [name.trim(), id]);
    
//     if (result.success && result.changes > 0) {
//       return { success: true };
//     }
    
//     return { 
//       success: false, 
//       error: result.changes === 0 ? "Категория не найдена" : "Ошибка обновления категории" 
//     };
//   }

//   deleteCategory(id) {
//     // Используем CASCADE для автоматического удаления компонентов
//     const result = this.run("DELETE FROM categories WHERE id = ?", [id]);
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Категория не найдена" : null
//     };
//   }

//   // ===== API КОМПОНЕНТОВ =====

//   getComponents(categoryId = null) {
//     if (categoryId) {
//       return this.all(
//         "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.category_id = ? ORDER BY c.name", 
//         [categoryId]
//       );
//     }
//     return this.all("SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id ORDER BY c.name");
//   }

//   getComponent(id) {
//     const component = this.get(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.id = ?
//     `, [id]);
    
//     console.log('🔍 Raw component data:', component);
//     console.log('🔍 Parameters type:', typeof component?.parameters);
//     console.log('🔍 Parameters value:', component?.parameters);
    
//     if (component) {
//       // Безопасный парсинг параметров
//       if (component.parameters && typeof component.parameters === 'string') {
//         try {
//           component.parameters = JSON.parse(component.parameters);
//           console.log('✅ Successfully parsed parameters:', component.parameters);
//         } catch (error) {
//           console.error('❌ JSON parse error:', error);
//           component.parameters = {};
//         }
//       } else {
//         component.parameters = component.parameters || {};
//       }
//     }
    
//     return component;
//   }

//   addComponent(componentData) {
//     // Валидация обязательных полей
//     if (!componentData.category_id || !componentData.name?.trim()) {
//       return { success: false, error: "Категория и название компонента обязательны" };
//     }

//     const result = this.run(`
//       INSERT INTO components 
//       (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data, description)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       componentData.category_id,
//       componentData.name.trim(),
//       componentData.storage_cell?.trim() || null,
//       componentData.datasheet_url?.trim() || null,
//       Math.max(0, parseInt(componentData.quantity) || 0),
//       componentData.updated_at || new Date().toISOString(),
//       this.serializeParameters(componentData.parameters),
//       componentData.image_data || null,
//       componentData.description?.trim() || null
//     ]);

//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid };
//     }
    
//     return { success: false, error: "Ошибка добавления компонента" };
//   }

//   updateComponent(componentData) {
//     if (!componentData.id) {
//       return { success: false, error: "ID компонента обязателен для обновления" };
//     }
  
//     const result = this.run(`
//       UPDATE components 
//       SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
//           quantity = ?, updated_at = ?, parameters = ?, image_data = ?, description = ?
//       WHERE id = ?
//     `, [
//       componentData.category_id,
//       componentData.name,
//       componentData.storage_cell,
//       componentData.datasheet_url,
//       componentData.quantity,
//       new Date().toISOString(),
//       JSON.stringify(componentData.parameters),
//       componentData.image_data,
//       componentData.description,
//       componentData.id
//     ]);
  
//     return { 
//       success: result.success, 
//       changes: result.changes,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     };
//   }
  

//   deleteComponent(id) {
//     const result = this.run("DELETE FROM components WHERE id = ?", [id]);
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     };
//   }

//   // ===== ПОИСК И ФИЛЬТРАЦИЯ =====

//   searchComponents(query) {
//     if (!query?.trim()) return [];
    
//     const searchTerm = `%${query.trim()}%`;
//     return this.all(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.name LIKE ? OR c.storage_cell LIKE ? OR cat.name LIKE ? OR c.description LIKE ?
//       ORDER BY c.name
//     `, [searchTerm, searchTerm, searchTerm, searchTerm]);
//   }

//   getComponentsByStorage(cell) {
//     if (!cell?.trim()) return [];
    
//     return this.all(
//       "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.storage_cell = ? ORDER BY c.name",
//       [cell.trim()]
//     );
//   }

//   // ===== УТИЛИТЫ =====

//   serializeParameters(parameters) {
//     if (!parameters) return '{}';
//     if (typeof parameters === 'string') {
//       try {
//         // Если это уже JSON строка, проверяем валидность
//         JSON.parse(parameters);
//         return parameters;
//       } catch {
//         return '{}';
//       }
//     }
//     return JSON.stringify(parameters);
//   }

//   getDatabaseStats() {
//     const categoryCount = this.get("SELECT COUNT(*) as count FROM categories")?.count || 0;
//     const componentCount = this.get("SELECT COUNT(*) as count FROM components")?.count || 0;
//     const totalQuantity = this.get("SELECT SUM(quantity) as total FROM components")?.total || 0;

//     return {
//       categoryCount,
//       componentCount,
//       totalQuantity,
//       dbPath: this.dbPath,
//       lastUpdated: new Date().toISOString()
//     };
//   }

//   checkDatabaseIntegrity() {
//     try {
//       const integrityCheck = this.get("PRAGMA integrity_check");
//       const tables = this.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
//       const componentCount = this.get("SELECT COUNT(*) as c FROM components")?.c || 0;
      
//       console.log("✅ Database integrity:", integrityCheck);
//       console.log("📊 Database contains tables:", tables.map(t => t.name));
//       console.log("🔧 Total components:", componentCount);
      
//       return {
//         success: true,
//         integrity: integrityCheck,
//         tables: tables.map(t => t.name),
//         componentCount
//       };
//     } catch (error) {
//       console.error("❌ Database integrity error:", error);
//       return { success: false, error: error.message };
//     }
//   }

//   // ===== ОПТИМИЗАЦИЯ И ЗАКРЫТИЕ =====

//   optimize() {
//     try {
//       this.db.exec('PRAGMA optimize');
//       this.db.exec('VACUUM');
//       console.log('✅ Database optimized');
//     } catch (error) {
//       console.error('❌ Database optimization error:', error);
//     }
//   }

//   backup() {
//     try {
//       const backupPath = this.dbPath + '.backup_' + Date.now();
//       this.db.backup(backupPath);
//       console.log('✅ Database backup created:', backupPath);
//       return backupPath;
//     } catch (error) {
//       console.error('❌ Database backup error:', error);
//       return null;
//     }
//   }

//   close() {
//     if (this.db) {
//       this.optimize();
//       this.db.close();
//       console.log('✅ Database closed');
//     }
//   }
// }

// export default ComponentsDatabase;



















































// import { app } from 'electron'
// import path from 'path'
// import fs from 'fs'

// class ComponentsDatabase {
//   constructor() {
//     this.db = null
//     this.dbPath = null
//     this.isInitialized = false
    
//     console.log('🔧 ComponentsDatabase constructor STARTED')
//     this.initializeDatabase()
//   }

//   initializeDatabase() {
//     console.log('🔄 Starting SIMPLE database initialization...')
    
//     try {
//       // Используем userData папку
//       const userDataPath = app.getPath('userData')
//       const dbDir = path.join(userDataPath, 'RadioBase')
//       this.dbPath = path.join(dbDir, 'components.db')
      
//       console.log('📁 Database path:', this.dbPath)
      
//       // Создаем папку
//       if (!fs.existsSync(dbDir)) {
//         console.log('🔄 Creating directory...')
//         fs.mkdirSync(dbDir, { recursive: true })
//         console.log('✅ Directory created')
//       }
      
//       // Создаем файл базы данных (просто для отметки что БД создана)
//       console.log('🔄 Creating database file...')
//       if (!fs.existsSync(this.dbPath)) {
//         fs.writeFileSync(this.dbPath, 'SQLite format 3')
//         console.log('✅ Database file created')
//       } else {
//         console.log('✅ Database file already exists')
//       }
      
//       this.isInitialized = true
//       console.log('✅ Database initialized successfully!')
      
//     } catch (error) {
//       console.error('❌ SIMPLE database initialization failed:', error)
//       console.error('❌ Error stack:', error.stack)
//       throw error
//     }
//   }

//   getCategories() {
//     console.log('📁 getCategories called - returning mock data')
//     if (!this.isInitialized) {
//       console.error('❌ Database not initialized')
//       return []
//     }
    
//     // Возвращаем тестовые данные из "базы данных"
//     return [
//       { id: 1, name: 'Транзисторы', created_at: new Date().toISOString() },
//       { id: 2, name: 'Резисторы', created_at: new Date().toISOString() },
//       { id: 3, name: 'Конденсаторы', created_at: new Date().toISOString() },
//       { id: 4, name: 'Диоды', created_at: new Date().toISOString() },
//       { id: 5, name: 'Микросхемы', created_at: new Date().toISOString() },
//       { id: 6, name: 'Индуктивности', created_at: new Date().toISOString() },
//       { id: 7, name: 'Разъемы', created_at: new Date().toISOString() },
//       { id: 8, name: 'Кварцевые резонаторы', created_at: new Date().toISOString() }
//     ]
//   }

//   getComponents(categoryId = null) {
//     console.log('📁 getComponents called with categoryId:', categoryId)
//     // Возвращаем пустой массив компонентов
//     return []
//   }

//   addCategory(name) {
//     console.log('📁 addCategory called with:', name)
//     // Имитируем добавление категории
//     return { success: true, id: Date.now() }
//   }

//   getDatabaseStats() {
//     console.log('📁 getDatabaseStats called')
//     return {
//       dbPath: this.dbPath || 'Not initialized',
//       isInitialized: this.isInitialized,
//       categoryCount: 8,
//       componentCount: 0,
//       totalQuantity: 0,
//       lastUpdated: new Date().toISOString()
//     }
//   }

//   close() {
//     console.log('🔧 Database close called')
//     this.isInitialized = false
//   }
// }

// export default ComponentsDatabase



























































// 271025



// import Database from 'better-sqlite3'
// import { app } from 'electron'
// import path from 'path'
// import fs from 'fs'

// class ComponentsDatabase {
//   constructor() {
//     this.db = null
//     this.dbPath = null
//     this.isInitialized = false
    
//     console.log('🔧 ComponentsDatabase constructor STARTED')
//     this.initializeDatabase()
//   }

//   initializeDatabase() {
//     console.log('🔄 Starting database initialization with better-sqlite3...')
    
//     try {
//       // Используем userData папку
//       const userDataPath = app.getPath('userData')
//       const dbDir = path.join(userDataPath, 'RadioBase')
//       this.dbPath = path.join(dbDir, 'components.db')
      
//       console.log('📁 Database path:', this.dbPath)
      
//       // Создаем папку
//       if (!fs.existsSync(dbDir)) {
//         console.log('🔄 Creating directory...')
//         fs.mkdirSync(dbDir, { recursive: true })
//         console.log('✅ Directory created')
//       }
      
//       // Создаем/открываем базу данных с better-sqlite3
//       console.log('🔄 Opening database with better-sqlite3...')
//       this.db = new Database(this.dbPath)
//       console.log('✅ Database opened successfully')
      
//       // Настраиваем БД
//       this.db.pragma('journal_mode = WAL')
//       this.db.pragma('foreign_keys = ON')
//       this.db.pragma('busy_timeout = 5000')
      
//       // Создаем таблицы
//       this.createTables()
      
//       // Добавляем начальные данные
//       this.insertInitialData()
      
//       this.isInitialized = true
//       console.log('✅ Database FULLY initialized successfully!')
      
//     } catch (error) {
//       console.error('❌ Database initialization failed:', error)
//       console.error('❌ Error message:', error.message)
//       console.error('❌ Error stack:', error.stack)
//       throw error
//     }
//   }

//   createTables() {
//     console.log('🔄 Creating tables...')
    
//     try {
//       // Таблица категорий
//       this.db.exec(`
//         CREATE TABLE IF NOT EXISTS categories (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           name TEXT NOT NULL UNIQUE,
//           created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//         )
//       `)
      
//       // Таблица компонентов
//       this.db.exec(`
//         CREATE TABLE IF NOT EXISTS components (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           category_id INTEGER NOT NULL,
//           name TEXT NOT NULL,
//           storage_cell TEXT,
//           datasheet_url TEXT,
//           quantity INTEGER DEFAULT 0,
//           updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//           parameters TEXT DEFAULT '{}',
//           image_data TEXT,
//           description TEXT,
//           created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//           FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
//         )
//       `)

//       // Создаем индексы для улучшения производительности
//       this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id)')
//       this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_name ON components(name)')
//       this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_storage ON components(storage_cell)')
//       this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_updated ON components(updated_at)')
      
//       console.log('✅ Tables created successfully')
//     } catch (error) {
//       console.error('❌ Table creation failed:', error)
//       throw error
//     }
//   }

//   insertInitialData() {
//     console.log('🔄 Inserting initial data...')
    
//     try {
//       const categories = [
//         'Транзисторы',
//         'Резисторы', 
//         'Конденсаторы',
//         'Диоды',
//         'Микросхемы',
//         'Индуктивности',
//         'Разъемы',
//         'Кварцевые резонаторы'
//       ]
      
//       const insertCategory = this.db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)')
      
//       // Используем transaction для быстрой вставки
//       const insertMany = this.db.transaction((cats) => {
//         for (const category of cats) {
//           console.log('📝 Inserting category:', category)
//           insertCategory.run(category)
//         }
//       })
      
//       insertMany(categories)
//       console.log('✅ Initial categories inserted')
      
//       // Проверяем сколько категорий в базе
//       const count = this.db.prepare('SELECT COUNT(*) as count FROM categories').get()
//       console.log(`📊 Total categories in database: ${count.count}`)
      
//     } catch (error) {
//       console.error('❌ Initial data insertion failed:', error)
//       throw error
//     }
//   }

//   // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С БД =====

//   all(sql, params = []) {
//     if (!this.db || !this.isInitialized) {
//       console.error('❌ Database not initialized for query:', sql)
//       return []
//     }
    
//     try {
//       return this.db.prepare(sql).all(params)
//     } catch (error) {
//       console.error('❌ Query error (all):', error.message, sql, params)
//       return []
//     }
//   }

//   get(sql, params = []) {
//     if (!this.db || !this.isInitialized) {
//       console.error('❌ Database not initialized for query:', sql)
//       return null
//     }
    
//     try {
//       return this.db.prepare(sql).get(params) || null
//     } catch (error) {
//       console.error('❌ Query error (get):', error.message, sql, params)
//       return null
//     }
//   }

//   run(sql, params = []) {
//     if (!this.db || !this.isInitialized) {
//       console.error('❌ Database not initialized for query:', sql)
//       return { 
//         success: false, 
//         changes: 0, 
//         lastInsertRowid: 0,
//         error: 'Database not initialized' 
//       }
//     }
    
//     try {
//       const result = this.db.prepare(sql).run(params)
//       return {
//         success: true,
//         changes: result.changes,
//         lastInsertRowid: result.lastInsertRowid
//       }
//     } catch (error) {
//       console.error('❌ Query error (run):', error.message, sql, params)
//       return { 
//         success: false, 
//         changes: 0, 
//         lastInsertRowid: 0,
//         error: error.message 
//       }
//     }
//   }

//   // ===== API КАТЕГОРИЙ =====

//   getCategories() {
//     console.log('📁 getCategories called - reading from SQLite database')
//     if (!this.db || !this.isInitialized) {
//       console.error('❌ Database not initialized')
//       return []
//     }
    
//     try {
//       const categories = this.all("SELECT * FROM categories ORDER BY name")
//       console.log(`✅ Retrieved ${categories.length} categories from SQLite database`)
//       return categories
//     } catch (error) {
//       console.error('❌ getCategories error:', error)
//       return []
//     }
//   }

//   addCategory(name) {
//     console.log('📁 addCategory called with:', name)
//     if (!this.db || !this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }
    
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" }
//     }

//     const result = this.run("INSERT INTO categories (name) VALUES (?)", [name.trim()])
    
//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid }
//     }
    
//     return { 
//       success: false, 
//       error: result.error?.includes('UNIQUE') 
//         ? "Категория с таким названием уже существует" 
//         : "Ошибка добавления категории" 
//     }
//   }

//   updateCategory(id, name) {
//     console.log('📁 updateCategory called with:', id, name)
//     if (!this.db || !this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }
    
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" }
//     }

//     const result = this.run("UPDATE categories SET name = ? WHERE id = ?", [name.trim(), id])
    
//     if (result.success && result.changes > 0) {
//       return { success: true }
//     }
    
//     return { 
//       success: false, 
//       error: result.changes === 0 ? "Категория не найдена" : "Ошибка обновления категории" 
//     }
//   }

//   deleteCategory(id) {
//     console.log('📁 deleteCategory called with:', id)
//     if (!this.db || !this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }
    
//     const result = this.run("DELETE FROM categories WHERE id = ?", [id])
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Категория не найдена" : null
//     }
//   }

//   // ===== API КОМПОНЕНТОВ =====

//   getComponents(categoryId = null) {
//     console.log('📁 getComponents called with categoryId:', categoryId)
//     if (!this.db || !this.isInitialized) {
//       return []
//     }
    
//     try {
//       if (categoryId) {
//         return this.all(
//           "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.category_id = ? ORDER BY c.name", 
//           [categoryId]
//         )
//       }
//       return this.all("SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id ORDER BY c.name")
//     } catch (error) {
//       console.error('❌ getComponents error:', error)
//       return []
//     }
//   }

//   getComponent(id) {
//     console.log('📁 getComponent called with id:', id)
//     if (!this.db || !this.isInitialized) {
//       return null
//     }
    
//     const component = this.get(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.id = ?
//     `, [id])
    
//     if (component) {
//       if (component.parameters && typeof component.parameters === 'string') {
//         try {
//           component.parameters = JSON.parse(component.parameters)
//         } catch (error) {
//           console.error('❌ JSON parse error:', error)
//           component.parameters = {}
//         }
//       } else {
//         component.parameters = component.parameters || {}
//       }
//     }
    
//     return component
//   }

//   addComponent(componentData) {
//     console.log('📁 addComponent called')
//     if (!this.db || !this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }
    
//     if (!componentData.category_id || !componentData.name?.trim()) {
//       return { success: false, error: "Категория и название компонента обязательны" }
//     }

//     const result = this.run(`
//       INSERT INTO components 
//       (category_id, name, storage_cell, datasheet_url, quantity, parameters, description)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `, [
//       componentData.category_id,
//       componentData.name.trim(),
//       componentData.storage_cell?.trim() || null,
//       componentData.datasheet_url?.trim() || null,
//       Math.max(0, parseInt(componentData.quantity) || 0),
//       this.serializeParameters(componentData.parameters),
//       componentData.description?.trim() || null
//     ])

//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid }
//     }
    
//     return { success: false, error: "Ошибка добавления компонента" }
//   }

//   updateComponent(componentData) {
//     console.log('📁 updateComponent called')
//     if (!this.db || !this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }
    
//     if (!componentData.id) {
//       return { success: false, error: "ID компонента обязателен для обновления" }
//     }
  
//     const result = this.run(`
//       UPDATE components 
//       SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
//           quantity = ?, parameters = ?, description = ?, updated_at = CURRENT_TIMESTAMP
//       WHERE id = ?
//     `, [
//       componentData.category_id,
//       componentData.name,
//       componentData.storage_cell,
//       componentData.datasheet_url,
//       componentData.quantity,
//       this.serializeParameters(componentData.parameters),
//       componentData.description,
//       componentData.id
//     ])
  
//     return { 
//       success: result.success, 
//       changes: result.changes,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     }
//   }

//   deleteComponent(id) {
//     console.log('📁 deleteComponent called with id:', id)
//     if (!this.db || !this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }
    
//     const result = this.run("DELETE FROM components WHERE id = ?", [id])
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     }
//   }

//   // ===== ПОИСК И ФИЛЬТРАЦИЯ =====

//   searchComponents(query) {
//     console.log('📁 searchComponents called with query:', query)
//     if (!this.db || !this.isInitialized) {
//       return []
//     }
    
//     if (!query?.trim()) return []
    
//     const searchTerm = `%${query.trim()}%`
//     return this.all(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.name LIKE ? OR c.storage_cell LIKE ? OR cat.name LIKE ? OR c.description LIKE ?
//       ORDER BY c.name
//     `, [searchTerm, searchTerm, searchTerm, searchTerm])
//   }

//   getComponentsByStorage(cell) {
//     console.log('📁 getComponentsByStorage called with cell:', cell)
//     if (!this.db || !this.isInitialized) {
//       return []
//     }
    
//     if (!cell?.trim()) return []
    
//     return this.all(
//       "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.storage_cell = ? ORDER BY c.name",
//       [cell.trim()]
//     )
//   }

//   // ===== УТИЛИТЫ =====

//   serializeParameters(parameters) {
//     if (!parameters) return '{}'
//     if (typeof parameters === 'string') {
//       try {
//         JSON.parse(parameters)
//         return parameters
//       } catch {
//         return '{}'
//       }
//     }
//     return JSON.stringify(parameters)
//   }

//   getDatabaseStats() {
//     console.log('📁 getDatabaseStats called')
//     if (!this.db || !this.isInitialized) {
//       return {
//         error: 'Database not initialized',
//         dbPath: 'Not available',
//         isInitialized: false
//       }
//     }
    
//     try {
//       const categoryCount = this.get("SELECT COUNT(*) as count FROM categories")?.count || 0
//       const componentCount = this.get("SELECT COUNT(*) as count FROM components")?.count || 0
//       const totalQuantity = this.get("SELECT SUM(quantity) as total FROM components")?.total || 0

//       return {
//         categoryCount,
//         componentCount,
//         totalQuantity,
//         dbPath: this.dbPath,
//         isInitialized: this.isInitialized,
//         lastUpdated: new Date().toISOString()
//       }
//     } catch (error) {
//       console.error('❌ getDatabaseStats error:', error)
//       return {
//         error: error.message,
//         dbPath: this.dbPath,
//         isInitialized: this.isInitialized
//       }
//     }
//   }

//   checkDatabaseIntegrity() {
//     if (!this.db || !this.isInitialized) {
//       return { success: false, error: "Database not initialized" }
//     }
    
//     try {
//       const integrityCheck = this.get("PRAGMA integrity_check")
//       const tables = this.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      
//       return {
//         success: true,
//         integrity: integrityCheck,
//         tables: tables.map(t => t.name),
//         isInitialized: this.isInitialized
//       }
//     } catch (error) {
//       console.error("❌ Database integrity error:", error)
//       return { success: false, error: error.message }
//     }
//   }

//   close() {
//     if (this.db) {
//       try {
//         this.db.close()
//         console.log('✅ Database closed')
//       } catch (error) {
//         console.error('❌ Error closing database:', error)
//       }
//       this.db = null
//       this.isInitialized = false
//     }
//   }
// }

// export default ComponentsDatabase






























// import { app } from 'electron'
// import path from 'path'
// import fs from 'fs'

// class ComponentsDatabase {
//   constructor() {
//     this.db = null
//     this.dbPath = null
//     this.isInitialized = false
    
//     console.log('🔧 ComponentsDatabase constructor STARTED')
//     this.initializeDatabase()
//   }

//   initializeDatabase() {
//     console.log('🔄 Starting SIMPLE database initialization...')
    
//     try {
//       // Используем userData папку
//       const userDataPath = app.getPath('userData')
//       const dbDir = path.join(userDataPath, 'RadioBase')
//       this.dbPath = path.join(dbDir, 'components.db')
      
//       console.log('📁 Database path:', this.dbPath)
      
//       // Создаем папку
//       if (!fs.existsSync(dbDir)) {
//         console.log('🔄 Creating directory...')
//         fs.mkdirSync(dbDir, { recursive: true })
//         console.log('✅ Directory created')
//       }
      
//       // Создаем файл базы данных (просто для отметки что БД создана)
//       console.log('🔄 Creating database file...')
//       if (!fs.existsSync(this.dbPath)) {
//         fs.writeFileSync(this.dbPath, 'SQLite format 3')
//         console.log('✅ Database file created')
//       } else {
//         console.log('✅ Database file already exists')
//       }
      
//       this.isInitialized = true
//       console.log('✅ Database initialized successfully!')
      
//     } catch (error) {
//       console.error('❌ SIMPLE database initialization failed:', error)
//       console.error('❌ Error stack:', error.stack)
//       throw error
//     }
//   }

//   getCategories() {
//     console.log('📁 getCategories called - returning mock data')
//     if (!this.isInitialized) {
//       console.error('❌ Database not initialized')
//       return []
//     }
    
//     // Возвращаем тестовые данные из "базы данных"
//     return [
//       { id: 1, name: 'Транзисторы', created_at: new Date().toISOString() },
//       { id: 2, name: 'Резисторы', created_at: new Date().toISOString() },
//       { id: 3, name: 'Конденсаторы', created_at: new Date().toISOString() },
//       { id: 4, name: 'Диоды', created_at: new Date().toISOString() },
//       { id: 5, name: 'Микросхемы', created_at: new Date().toISOString() },
//       { id: 6, name: 'Индуктивности', created_at: new Date().toISOString() },
//       { id: 7, name: 'Разъемы', created_at: new Date().toISOString() },
//       { id: 8, name: 'Кварцевые резонаторы', created_at: new Date().toISOString() }
//     ]
//   }

//   getComponents(categoryId = null) {
//     console.log('📁 getComponents called with categoryId:', categoryId)
//     // Возвращаем пустой массив компонентов
//     return []
//   }

//   addCategory(name) {
//     console.log('📁 addCategory called with:', name)
//     // Имитируем добавление категории
//     return { success: true, id: Date.now() }
//   }

//   updateCategory(id, name) {
//     console.log('📁 updateCategory called with:', id, name)
//     return { success: true }
//   }

//   deleteCategory(id) {
//     console.log('📁 deleteCategory called with:', id)
//     return { success: true }
//   }

//   getComponent(id) {
//     console.log('📁 getComponent called with id:', id)
//     return null
//   }

//   addComponent(componentData) {
//     console.log('📁 addComponent called')
//     return { success: true, id: Date.now() }
//   }

//   updateComponent(componentData) {
//     console.log('📁 updateComponent called')
//     return { success: true }
//   }

//   deleteComponent(id) {
//     console.log('📁 deleteComponent called with id:', id)
//     return { success: true }
//   }

//   searchComponents(query) {
//     console.log('📁 searchComponents called with query:', query)
//     return []
//   }

//   getComponentsByStorage(cell) {
//     console.log('📁 getComponentsByStorage called with cell:', cell)
//     return []
//   }

//   getDatabaseStats() {
//     console.log('📁 getDatabaseStats called')
//     return {
//       dbPath: this.dbPath || 'Not initialized',
//       isInitialized: this.isInitialized,
//       categoryCount: 8,
//       componentCount: 0,
//       totalQuantity: 0,
//       lastUpdated: new Date().toISOString()
//     }
//   }

//   checkDatabaseIntegrity() {
//     return {
//       success: true,
//       integrity: 'ok',
//       tables: ['categories', 'components'],
//       isInitialized: this.isInitialized
//     }
//   }

//   close() {
//     console.log('🔧 Database close called')
//     this.isInitialized = false
//   }
// }

// export default ComponentsDatabase







































// import { app } from 'electron'
// import path from 'path'
// import fs from 'fs'
// import os from 'os'

// class ComponentsDatabase {
//   constructor() {
//     this.db = null
//     this.dbPath = null
//     this.isInitialized = false
    
//     console.log('🔧 ComponentsDatabase constructor STARTED')
//     this.initializeDatabase()
//   }

//   getTrueExecutablePath() {
//     // Для portable версий находим настоящий .exe файл
//     if (process.platform === 'win32') {
//       // Пробуем несколько способов найти настоящий путь
//       const possiblePaths = [
//         process.execPath, // текущий исполняемый файл
//         path.join(process.cwd(), path.basename(process.execPath)), // текущая рабочая директория
//       ]
      
//       for (const possiblePath of possiblePaths) {
//         if (possiblePath && fs.existsSync(possiblePath) && possiblePath.endsWith('.exe')) {
//           console.log('📁 Found executable at:', possiblePath)
//           return possiblePath
//         }
//       }
//     }
    
//     // Если ничего не нашли, используем process.execPath
//     console.log('📁 Using process.execPath:', process.execPath)
//     return process.execPath
//   }

//   getDatabaseDirectory() {
//     if (app.isPackaged) {
//       // В production - используем папку где находится НАСТОЯЩИЙ .exe файл
//       const exePath = this.getTrueExecutablePath()
//       const exeDir = path.dirname(exePath)
//       const dbDir = path.join(exeDir, 'Database')
      
//       console.log('📁 Production setup:')
//       console.log('📁   Executable path:', exePath)
//       console.log('📁   Executable dir:', exeDir)
//       console.log('📁   Database dir:', dbDir)
      
//       return dbDir
//     } else {
//       // Development - используем папку проекта
//       const devDir = path.join(app.getAppPath(), 'Database')
//       console.log('📁 Development database directory:', devDir)
//       return devDir
//     }
//   }

//   initializeDatabase() {
//     console.log('🔄 Starting PORTABLE database initialization...')
    
//     try {
//       // Получаем папку для базы данных (рядом с .exe)
//       const dbDir = this.getDatabaseDirectory()
//       this.dbPath = path.join(dbDir, 'radiobase.db')
      
//       console.log('📁 Final database path:', this.dbPath)
//       console.log('📁 Database directory exists?', fs.existsSync(dbDir))
      
//       // Создаем папку Database если её нет
//       if (!fs.existsSync(dbDir)) {
//         console.log('🔄 Creating database directory...')
//         fs.mkdirSync(dbDir, { recursive: true })
//         console.log('✅ Database directory created')
//       }
      
//       // Проверяем права на запись
//       this.testWritePermissions(dbDir)
      
//       // Создаем файл базы данных
//       console.log('🔄 Creating database file...')
//       if (!fs.existsSync(this.dbPath)) {
//         this.createNewDatabase()
//       } else {
//         console.log('✅ Database file already exists, using existing database')
//         // Можно добавить логику для проверки/обновления существующей БД
//       }
      
//       this.isInitialized = true
//       console.log('✅ Portable database initialized successfully!')
      
//     } catch (error) {
//       console.error('❌ Portable database initialization failed:', error)
      
//       // Fallback: используем userData если основная папка недоступна
//       console.log('🔄 Trying fallback to userData...')
//       this.useFallbackLocation()
//     }
//   }

//   testWritePermissions(dir) {
//     console.log('🔄 Testing write permissions in:', dir)
//     try {
//       const testFile = path.join(dir, 'write_test.tmp')
//       fs.writeFileSync(testFile, 'test')
//       fs.unlinkSync(testFile)
//       console.log('✅ Write permissions: OK')
//     } catch (error) {
//       console.error('❌ Write permissions: FAILED', error.message)
//       throw new Error(`No write permissions in directory: ${dir}`)
//     }
//   }

//   useFallbackLocation() {
//     try {
//       console.log('📁 Using fallback location (userData)...')
//       const userDataPath = app.getPath('userData')
//       const fallbackDir = path.join(userDataPath, 'RadioBase')
//       this.dbPath = path.join(fallbackDir, 'radiobase.db')
      
//       console.log('📁 Fallback database path:', this.dbPath)
      
//       if (!fs.existsSync(fallbackDir)) {
//         fs.mkdirSync(fallbackDir, { recursive: true })
//       }
      
//       if (!fs.existsSync(this.dbPath)) {
//         this.createNewDatabase()
//       }
      
//       this.isInitialized = true
//       console.log('✅ Fallback database initialized')
      
//     } catch (fallbackError) {
//       console.error('❌ Fallback database also failed:', fallbackError)
//       throw fallbackError
//     }
//   }

//   createNewDatabase() {
//     console.log('🔄 Creating new database file...')
    
//     // Создаем простой файл с меткой
//     const dbInfo = {
//       version: '1.0.0',
//       created: new Date().toISOString(),
//       description: 'RadioBase Components Database',
//       portable: true
//     }
    
//     fs.writeFileSync(this.dbPath, JSON.stringify(dbInfo, null, 2))
//     console.log('✅ New database file created with info:', dbInfo)
    
//     // Здесь в будущем можно добавить создание SQLite базы
//     // когда решим проблему с better-sqlite3
//   }

//   // ===== МЕТОДЫ ДЛЯ РАБОТЫ С ДАННЫМИ =====

//   getCategories() {
//     console.log('📁 getCategories called - reading from portable database')
//     if (!this.isInitialized) {
//       console.error('❌ Database not initialized')
//       return []
//     }
    
//     try {
//       // Читаем информацию о базе данных
//       if (fs.existsSync(this.dbPath)) {
//         const dbInfo = fs.readFileSync(this.dbPath, 'utf8')
//         console.log('📁 Database info:', JSON.parse(dbInfo))
//       }
      
//       // Возвращаем тестовые данные (в будущем - из SQLite)
//       return [
//         { id: 1, name: 'Транзисторы', created_at: new Date().toISOString() },
//         { id: 2, name: 'Резисторы', created_at: new Date().toISOString() },
//         { id: 3, name: 'Конденсаторы', created_at: new Date().toISOString() },
//         { id: 4, name: 'Диоды', created_at: new Date().toISOString() },
//         { id: 5, name: 'Микросхемы', created_at: new Date().toISOString() },
//         { id: 6, name: 'Индуктивности', created_at: new Date().toISOString() },
//         { id: 7, name: 'Разъемы', created_at: new Date().toISOString() },
//         { id: 8, name: 'Кварцевые резонаторы', created_at: new Date().toISOString() }
//       ]
//     } catch (error) {
//       console.error('❌ getCategories error:', error)
//       return []
//     }
//   }

//   getDatabaseStats() {
//     console.log('📁 getDatabaseStats called')
    
//     let dbInfo = {}
//     try {
//       if (fs.existsSync(this.dbPath)) {
//         const infoStr = fs.readFileSync(this.dbPath, 'utf8')
//         dbInfo = JSON.parse(infoStr)
//       }
//     } catch (error) {
//       console.error('❌ Error reading database info:', error)
//     }
    
//     return {
//       dbPath: this.dbPath || 'Not initialized',
//       isInitialized: this.isInitialized,
//       categoryCount: 8,
//       componentCount: 0,
//       totalQuantity: 0,
//       lastUpdated: new Date().toISOString(),
//       portable: true,
//       dbInfo: dbInfo
//     }
//   }

//   // ===== МЕТОДЫ ДЛЯ ЭКСПОРТА/ИМПОРТА =====

//   exportDatabase(destinationPath) {
//     console.log('📁 Exporting database to:', destinationPath)
    
//     try {
//       if (!this.isInitialized || !fs.existsSync(this.dbPath)) {
//         return { success: false, error: 'Database not available for export' }
//       }
      
//       // Копируем файл базы данных
//       fs.copyFileSync(this.dbPath, destinationPath)
//       console.log('✅ Database exported successfully')
      
//       return { success: true, path: destinationPath }
//     } catch (error) {
//       console.error('❌ Export failed:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   importDatabase(sourcePath) {
//     console.log('📁 Importing database from:', sourcePath)
    
//     try {
//       if (!fs.existsSync(sourcePath)) {
//         return { success: false, error: 'Source file not found' }
//       }
      
//       // Создаем бэкап текущей базы
//       const backupPath = this.dbPath + '.backup'
//       if (fs.existsSync(this.dbPath)) {
//         fs.copyFileSync(this.dbPath, backupPath)
//       }
      
//       // Копируем новую базу
//       fs.copyFileSync(sourcePath, this.dbPath)
//       console.log('✅ Database imported successfully')
      
//       return { 
//         success: true, 
//         message: 'Database imported successfully. Previous database backed up.',
//         backupPath: fs.existsSync(backupPath) ? backupPath : null
//       }
//     } catch (error) {
//       console.error('❌ Import failed:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   getDatabaseInfo() {
//     try {
//       if (fs.existsSync(this.dbPath)) {
//         const infoStr = fs.readFileSync(this.dbPath, 'utf8')
//         return JSON.parse(infoStr)
//       }
//       return { error: 'Database file not found' }
//     } catch (error) {
//       return { error: error.message }
//     }
//   }

//   // Остальные методы остаются такими же...
//   getComponents(categoryId = null) {
//     console.log('📁 getComponents called with categoryId:', categoryId)
//     return []
//   }

//   addCategory(name) {
//     console.log('📁 addCategory called with:', name)
//     return { success: true, id: Date.now() }
//   }

//   updateCategory(id, name) {
//     console.log('📁 updateCategory called with:', id, name)
//     return { success: true }
//   }

//   deleteCategory(id) {
//     console.log('📁 deleteCategory called with:', id)
//     return { success: true }
//   }

//   close() {
//     console.log('🔧 Database close called')
//     this.isInitialized = false
//   }
// }

// export default ComponentsDatabase






















































// import { app } from 'electron'
// import path from 'path'
// import fs from 'fs'

// class ComponentsDatabase {
//   constructor() {
//     this.db = null
//     this.dbPath = null
//     this.isInitialized = false
    
//     console.log('🔧 ComponentsDatabase constructor STARTED')
//     this.initializeDatabase()
//   }

//   getTrueExecutablePath() {
//     // Для portable версий находим настоящий .exe файл
//     if (process.platform === 'win32') {
//       const possiblePaths = [
//         process.execPath,
//         path.join(process.cwd(), path.basename(process.execPath)),
//       ]
      
//       for (const possiblePath of possiblePaths) {
//         if (possiblePath && fs.existsSync(possiblePath) && possiblePath.endsWith('.exe')) {
//           console.log('📁 Found executable at:', possiblePath)
//           return possiblePath
//         }
//       }
//     }
    
//     console.log('📁 Using process.execPath:', process.execPath)
//     return process.execPath
//   }

//   getDatabaseDirectory() {
//     if (app.isPackaged) {
//       // В production - используем папку где находится НАСТОЯЩИЙ .exe файл
//       const exePath = this.getTrueExecutablePath()
//       const exeDir = path.dirname(exePath)
//       const dbDir = path.join(exeDir, 'Database')
      
//       console.log('📁 Production setup:')
//       console.log('📁   Executable path:', exePath)
//       console.log('📁   Executable dir:', exeDir)
//       console.log('📁   Database dir:', dbDir)
      
//       return dbDir
//     } else {
//       // Development - используем папку проекта
//       const devDir = path.join(app.getAppPath(), 'Database')
//       console.log('📁 Development database directory:', devDir)
//       return devDir
//     }
//   }

//   initializeDatabase() {
//     console.log('🔄 Starting PORTABLE database initialization...')
    
//     try {
//       // Получаем папку для базы данных (рядом с .exe)
//       const dbDir = this.getDatabaseDirectory()
//       this.dbPath = path.join(dbDir, 'radiobase.db')
      
//       console.log('📁 Final database path:', this.dbPath)
//       console.log('📁 Database directory exists?', fs.existsSync(dbDir))
      
//       // Создаем папку Database если её нет
//       if (!fs.existsSync(dbDir)) {
//         console.log('🔄 Creating database directory...')
//         fs.mkdirSync(dbDir, { recursive: true })
//         console.log('✅ Database directory created')
//       }
      
//       // Проверяем права на запись
//       this.testWritePermissions(dbDir)
      
//       // Создаем файл базы данных
//       console.log('🔄 Creating database file...')
//       if (!fs.existsSync(this.dbPath)) {
//         this.createNewDatabase()
//       } else {
//         console.log('✅ Database file already exists, using existing database')
//       }
      
//       this.isInitialized = true
//       console.log('✅ Portable database initialized successfully!')
      
//     } catch (error) {
//       console.error('❌ Portable database initialization failed:', error)
      
//       // Fallback: используем userData если основная папка недоступна
//       console.log('🔄 Trying fallback to userData...')
//       this.useFallbackLocation()
//     }
//   }

//   testWritePermissions(dir) {
//     console.log('🔄 Testing write permissions in:', dir)
//     try {
//       const testFile = path.join(dir, 'write_test.tmp')
//       fs.writeFileSync(testFile, 'test')
//       fs.unlinkSync(testFile)
//       console.log('✅ Write permissions: OK')
//     } catch (error) {
//       console.error('❌ Write permissions: FAILED', error.message)
//       throw new Error(`No write permissions in directory: ${dir}`)
//     }
//   }

//   useFallbackLocation() {
//     try {
//       console.log('📁 Using fallback location (userData)...')
//       const userDataPath = app.getPath('userData')
//       const fallbackDir = path.join(userDataPath, 'RadioBase')
//       this.dbPath = path.join(fallbackDir, 'radiobase.db')
      
//       console.log('📁 Fallback database path:', this.dbPath)
      
//       if (!fs.existsSync(fallbackDir)) {
//         fs.mkdirSync(fallbackDir, { recursive: true })
//       }
      
//       if (!fs.existsSync(this.dbPath)) {
//         this.createNewDatabase()
//       }
      
//       this.isInitialized = true
//       console.log('✅ Fallback database initialized')
      
//     } catch (fallbackError) {
//       console.error('❌ Fallback database also failed:', fallbackError)
//       throw fallbackError
//     }
//   }

//   createNewDatabase() {
//     console.log('🔄 Creating new database file...')
    
//     // Создаем простой файл с меткой
//     const dbInfo = {
//       version: '1.0.0',
//       created: new Date().toISOString(),
//       description: 'RadioBase Components Database',
//       portable: true,
//       categories: [
//         { id: 1, name: 'Транзисторы', created_at: new Date().toISOString() },
//         { id: 2, name: 'Резисторы', created_at: new Date().toISOString() },
//         { id: 3, name: 'Конденсаторы', created_at: new Date().toISOString() },
//         { id: 4, name: 'Диоды', created_at: new Date().toISOString() },
//         { id: 5, name: 'Микросхемы', created_at: new Date().toISOString() },
//         { id: 6, name: 'Индуктивности', created_at: new Date().toISOString() },
//         { id: 7, name: 'Разъемы', created_at: new Date().toISOString() },
//         { id: 8, name: 'Кварцевые резонаторы', created_at: new Date().toISOString() }
//       ],
//       components: []
//     }
    
//     fs.writeFileSync(this.dbPath, JSON.stringify(dbInfo, null, 2))
//     console.log('✅ New database file created with initial data')
//   }

//   // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ =====

//   loadDatabase() {
//     try {
//       if (fs.existsSync(this.dbPath)) {
//         const data = fs.readFileSync(this.dbPath, 'utf8')
//         return JSON.parse(data)
//       }
//       return null
//     } catch (error) {
//       console.error('❌ Error loading database:', error)
//       return null
//     }
//   }

//   saveDatabase(data) {
//     try {
//       fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2))
//       return true
//     } catch (error) {
//       console.error('❌ Error saving database:', error)
//       return false
//     }
//   }

//   // ===== API КАТЕГОРИЙ =====

//   getCategories() {
//     console.log('📁 getCategories called - reading from portable database')
//     if (!this.isInitialized) {
//       console.error('❌ Database not initialized')
//       return []
//     }
    
//     try {
//       const dbData = this.loadDatabase()
//       if (dbData && dbData.categories) {
//         console.log(`✅ Retrieved ${dbData.categories.length} categories from database`)
//         return dbData.categories
//       }
//       return []
//     } catch (error) {
//       console.error('❌ getCategories error:', error)
//       return []
//     }
//   }

//   addCategory(name) {
//     console.log('📁 addCategory called with:', name)
//     if (!this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }
    
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" }
//     }

//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData) {
//         return { success: false, error: "Database corrupted" }
//       }

//       // Проверяем уникальность
//       const existingCategory = dbData.categories.find(cat => 
//         cat.name.toLowerCase() === name.trim().toLowerCase()
//       )
      
//       if (existingCategory) {
//         return { success: false, error: "Категория с таким названием уже существует" }
//       }

//       // Добавляем новую категорию
//       const newCategory = {
//         id: Date.now(),
//         name: name.trim(),
//         created_at: new Date().toISOString()
//       }
      
//       dbData.categories.push(newCategory)
      
//       if (this.saveDatabase(dbData)) {
//         return { success: true, id: newCategory.id }
//       } else {
//         return { success: false, error: "Ошибка сохранения категории" }
//       }
//     } catch (error) {
//       console.error('❌ addCategory error:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   updateCategory(id, name) {
//     console.log('📁 updateCategory called with:', id, name)
//     if (!this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }
    
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" }
//     }

//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData) {
//         return { success: false, error: "Database corrupted" }
//       }

//       const categoryIndex = dbData.categories.findIndex(cat => cat.id === id)
//       if (categoryIndex === -1) {
//         return { success: false, error: "Категория не найдена" }
//       }

//       // Обновляем категорию
//       dbData.categories[categoryIndex].name = name.trim()
      
//       if (this.saveDatabase(dbData)) {
//         return { success: true }
//       } else {
//         return { success: false, error: "Ошибка обновления категории" }
//       }
//     } catch (error) {
//       console.error('❌ updateCategory error:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   deleteCategory(id) {
//     console.log('📁 deleteCategory called with:', id)
//     if (!this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }

//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData) {
//         return { success: false, error: "Database corrupted" }
//       }

//       const categoryIndex = dbData.categories.findIndex(cat => cat.id === id)
//       if (categoryIndex === -1) {
//         return { success: false, error: "Категория не найдена" }
//       }

//       // Удаляем категорию и все связанные компоненты
//       dbData.categories.splice(categoryIndex, 1)
//       dbData.components = dbData.components.filter(comp => comp.category_id !== id)
      
//       if (this.saveDatabase(dbData)) {
//         return { success: true }
//       } else {
//         return { success: false, error: "Ошибка удаления категории" }
//       }
//     } catch (error) {
//       console.error('❌ deleteCategory error:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   // ===== API КОМПОНЕНТОВ =====

//   getComponents(categoryId = null) {
//     console.log('📁 getComponents called with categoryId:', categoryId)
//     if (!this.isInitialized) {
//       return []
//     }
    
//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData || !dbData.components) {
//         return []
//       }

//       let components = dbData.components
      
//       // Фильтруем по категории если указана
//       if (categoryId) {
//         components = components.filter(comp => comp.category_id === categoryId)
//       }

//       // Добавляем названия категорий
//       const categories = dbData.categories || []
//       components = components.map(comp => {
//         const category = categories.find(cat => cat.id === comp.category_id)
//         return {
//           ...comp,
//           category_name: category ? category.name : 'Неизвестно'
//         }
//       })

//       console.log(`✅ Retrieved ${components.length} components`)
//       return components
//     } catch (error) {
//       console.error('❌ getComponents error:', error)
//       return []
//     }
//   }

//   getComponent(id) {
//     console.log('📁 getComponent called with id:', id)
//     if (!this.isInitialized) {
//       return null
//     }
    
//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData || !dbData.components) {
//         return null
//       }

//       const component = dbData.components.find(comp => comp.id === id)
//       if (component) {
//         // Добавляем название категории
//         const categories = dbData.categories || []
//         const category = categories.find(cat => cat.id === component.category_id)
//         return {
//           ...component,
//           category_name: category ? category.name : 'Неизвестно'
//         }
//       }
      
//       return null
//     } catch (error) {
//       console.error('❌ getComponent error:', error)
//       return null
//     }
//   }

//   addComponent(componentData) {
//     console.log('📁 addComponent called with data:', componentData)
//     if (!this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }
    
//     // Валидация обязательных полей
//     if (!componentData.category_id || !componentData.name?.trim()) {
//       return { success: false, error: "Категория и название компонента обязательны" }
//     }

//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData) {
//         return { success: false, error: "Database corrupted" }
//       }

//       // Проверяем существование категории
//       const categoryExists = dbData.categories.some(cat => cat.id === componentData.category_id)
//       if (!categoryExists) {
//         return { success: false, error: "Указанная категория не существует" }
//       }

//       // Создаем новый компонент
//       const newComponent = {
//         id: Date.now(),
//         category_id: componentData.category_id,
//         name: componentData.name.trim(),
//         storage_cell: componentData.storage_cell?.trim() || null,
//         datasheet_url: componentData.datasheet_url?.trim() || null,
//         quantity: Math.max(0, parseInt(componentData.quantity) || 0),
//         parameters: componentData.parameters || {},
//         description: componentData.description?.trim() || null,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       }

//       // Инициализируем массив компонентов если его нет
//       if (!dbData.components) {
//         dbData.components = []
//       }

//       dbData.components.push(newComponent)
      
//       if (this.saveDatabase(dbData)) {
//         console.log('✅ Component added successfully')
//         return { success: true, id: newComponent.id }
//       } else {
//         return { success: false, error: "Ошибка сохранения компонента" }
//       }
//     } catch (error) {
//       console.error('❌ addComponent error:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   updateComponent(componentData) {
//     console.log('📁 updateComponent called with data:', componentData)
//     if (!this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }
    
//     if (!componentData.id) {
//       return { success: false, error: "ID компонента обязателен для обновления" }
//     }

//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData || !dbData.components) {
//         return { success: false, error: "Database corrupted or no components" }
//       }

//       const componentIndex = dbData.components.findIndex(comp => comp.id === componentData.id)
//       if (componentIndex === -1) {
//         return { success: false, error: "Компонент не найден" }
//       }

//       // Обновляем компонент
//       dbData.components[componentIndex] = {
//         ...dbData.components[componentIndex],
//         category_id: componentData.category_id,
//         name: componentData.name,
//         storage_cell: componentData.storage_cell,
//         datasheet_url: componentData.datasheet_url,
//         quantity: componentData.quantity,
//         parameters: componentData.parameters,
//         description: componentData.description,
//         updated_at: new Date().toISOString()
//       }
      
//       if (this.saveDatabase(dbData)) {
//         console.log('✅ Component updated successfully')
//         return { success: true }
//       } else {
//         return { success: false, error: "Ошибка обновления компонента" }
//       }
//     } catch (error) {
//       console.error('❌ updateComponent error:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   deleteComponent(id) {
//     console.log('📁 deleteComponent called with id:', id)
//     if (!this.isInitialized) {
//       return { success: false, error: 'Database not initialized' }
//     }

//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData || !dbData.components) {
//         return { success: false, error: "Database corrupted or no components" }
//       }

//       const componentIndex = dbData.components.findIndex(comp => comp.id === id)
//       if (componentIndex === -1) {
//         return { success: false, error: "Компонент не найден" }
//       }

//       dbData.components.splice(componentIndex, 1)
      
//       if (this.saveDatabase(dbData)) {
//         console.log('✅ Component deleted successfully')
//         return { success: true }
//       } else {
//         return { success: false, error: "Ошибка удаления компонента" }
//       }
//     } catch (error) {
//       console.error('❌ deleteComponent error:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   // ===== ПОИСК И ФИЛЬТРАЦИЯ =====

//   searchComponents(query) {
//     console.log('📁 searchComponents called with query:', query)
//     if (!this.isInitialized) {
//       return []
//     }
    
//     if (!query?.trim()) {
//       return []
//     }

//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData || !dbData.components) {
//         return []
//       }

//       const searchTerm = query.trim().toLowerCase()
//       const categories = dbData.categories || []

//       const results = dbData.components.filter(comp => {
//         const compName = comp.name?.toLowerCase() || ''
//         const storageCell = comp.storage_cell?.toLowerCase() || ''
//         const description = comp.description?.toLowerCase() || ''
        
//         const category = categories.find(cat => cat.id === comp.category_id)
//         const categoryName = category?.name?.toLowerCase() || ''

//         return compName.includes(searchTerm) ||
//                storageCell.includes(searchTerm) ||
//                categoryName.includes(searchTerm) ||
//                description.includes(searchTerm)
//       })

//       // Добавляем названия категорий
//       const resultsWithCategories = results.map(comp => {
//         const category = categories.find(cat => cat.id === comp.category_id)
//         return {
//           ...comp,
//           category_name: category ? category.name : 'Неизвестно'
//         }
//       })

//       console.log(`✅ Search found ${resultsWithCategories.length} results`)
//       return resultsWithCategories
//     } catch (error) {
//       console.error('❌ searchComponents error:', error)
//       return []
//     }
//   }

//   getComponentsByStorage(cell) {
//     console.log('📁 getComponentsByStorage called with cell:', cell)
//     if (!this.isInitialized) {
//       return []
//     }
    
//     if (!cell?.trim()) {
//       return []
//     }

//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData || !dbData.components) {
//         return []
//       }

//       const searchCell = cell.trim().toLowerCase()
//       const categories = dbData.categories || []

//       const results = dbData.components.filter(comp => {
//         const storageCell = comp.storage_cell?.toLowerCase() || ''
//         return storageCell === searchCell
//       })

//       // Добавляем названия категорий
//       const resultsWithCategories = results.map(comp => {
//         const category = categories.find(cat => cat.id === comp.category_id)
//         return {
//           ...comp,
//           category_name: category ? category.name : 'Неизвестно'
//         }
//       })

//       console.log(`✅ Found ${resultsWithCategories.length} components in storage cell`)
//       return resultsWithCategories
//     } catch (error) {
//       console.error('❌ getComponentsByStorage error:', error)
//       return []
//     }
//   }

//   // ===== УТИЛИТЫ =====

//   getDatabaseStats() {
//     console.log('📁 getDatabaseStats called')
//     if (!this.isInitialized) {
//       return {
//         error: 'Database not initialized',
//         dbPath: 'Not available',
//         isInitialized: false
//       }
//     }
    
//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData) {
//         return {
//           error: 'Database corrupted',
//           dbPath: this.dbPath,
//           isInitialized: this.isInitialized
//         }
//       }

//       const categoryCount = dbData.categories ? dbData.categories.length : 0
//       const componentCount = dbData.components ? dbData.components.length : 0
//       const totalQuantity = dbData.components ? 
//         dbData.components.reduce((sum, comp) => sum + (comp.quantity || 0), 0) : 0

//       return {
//         categoryCount,
//         componentCount,
//         totalQuantity,
//         dbPath: this.dbPath,
//         isInitialized: this.isInitialized,
//         lastUpdated: new Date().toISOString()
//       }
//     } catch (error) {
//       console.error('❌ getDatabaseStats error:', error)
//       return {
//         error: error.message,
//         dbPath: this.dbPath,
//         isInitialized: this.isInitialized
//       }
//     }
//   }

//   checkDatabaseIntegrity() {
//     if (!this.isInitialized) {
//       return { success: false, error: "Database not initialized" }
//     }
    
//     try {
//       const dbData = this.loadDatabase()
//       if (!dbData) {
//         return { success: false, error: "Database file corrupted or missing" }
//       }

//       const tables = []
//       if (dbData.categories) tables.push('categories')
//       if (dbData.components) tables.push('components')

//       return {
//         success: true,
//         integrity: 'ok',
//         tables: tables,
//         componentCount: dbData.components ? dbData.components.length : 0,
//         isInitialized: this.isInitialized
//       }
//     } catch (error) {
//       console.error("❌ Database integrity error:", error)
//       return { success: false, error: error.message }
//     }
//   }

//   // ===== ЭКСПОРТ/ИМПОРТ =====

//   exportDatabase(destinationPath) {
//     console.log('📁 Exporting database to:', destinationPath)
    
//     try {
//       if (!this.isInitialized || !fs.existsSync(this.dbPath)) {
//         return { success: false, error: 'Database not available for export' }
//       }
      
//       // Копируем файл базы данных
//       fs.copyFileSync(this.dbPath, destinationPath)
//       console.log('✅ Database exported successfully')
      
//       return { success: true, path: destinationPath }
//     } catch (error) {
//       console.error('❌ Export failed:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   importDatabase(sourcePath) {
//     console.log('📁 Importing database from:', sourcePath)
    
//     try {
//       if (!fs.existsSync(sourcePath)) {
//         return { success: false, error: 'Source file not found' }
//       }
      
//       // Создаем бэкап текущей базы
//       const backupPath = this.dbPath + '.backup'
//       if (fs.existsSync(this.dbPath)) {
//         fs.copyFileSync(this.dbPath, backupPath)
//       }
      
//       // Копируем новую базу
//       fs.copyFileSync(sourcePath, this.dbPath)
//       console.log('✅ Database imported successfully')
      
//       return { 
//         success: true, 
//         message: 'Database imported successfully. Previous database backed up.',
//         backupPath: fs.existsSync(backupPath) ? backupPath : null
//       }
//     } catch (error) {
//       console.error('❌ Import failed:', error)
//       return { success: false, error: error.message }
//     }
//   }

//   getDatabaseInfo() {
//     try {
//       if (fs.existsSync(this.dbPath)) {
//         const infoStr = fs.readFileSync(this.dbPath, 'utf8')
//         const dbData = JSON.parse(infoStr)
//         return {
//           version: dbData.version || '1.0.0',
//           created: dbData.created || new Date().toISOString(),
//           description: dbData.description || 'RadioBase Components Database',
//           portable: dbData.portable !== undefined ? dbData.portable : true
//         }
//       }
//       return { error: 'Database file not found' }
//     } catch (error) {
//       return { error: error.message }
//     }
//   }

//   close() {
//     console.log('🔧 Database close called')
//     this.isInitialized = false
//   }
// }

// export default ComponentsDatabase


















































































































// const Database = require('better-sqlite3');
// const path = require('path');
// const { app } = require('electron');

// class ComponentsDatabase {
//   constructor() {
//     // Используем userData папку Electron для хранения БД
//     const userDataPath = app.getPath('userData');
//     this.dbPath = path.join(userDataPath, 'components.db');
    
//     // Создаем папку если не существует
//     const dbDir = path.dirname(this.dbPath);
//     require('fs').mkdirSync(dbDir, { recursive: true });
    
//     this.db = new Database(this.dbPath);
    
//     // Включаем оптимизации
//     this.db.pragma('journal_mode = WAL');
//     this.db.pragma('foreign_keys = ON');
//     this.db.pragma('busy_timeout = 5000');
    
//     this.init();
//   }

//   init() {
//     try {
//       this.createTables();
//       this.insertInitialCategories();
//       this.migrateDatabase();
//       console.log('✅ Database initialized at:', this.dbPath);
//     } catch (error) {
//       console.error('❌ Database initialization error:', error);
//       throw error;
//     }
//   }

//   createTables() {
//     // Создаем таблицы отдельными запросами для лучшей читаемости
//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS categories (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL UNIQUE,
//         created_at TEXT DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS components (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         category_id INTEGER NOT NULL,
//         name TEXT NOT NULL,
//         storage_cell TEXT,
//         datasheet_url TEXT,
//         quantity INTEGER DEFAULT 0,
//         updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         parameters TEXT DEFAULT '{}',
//         image_data TEXT,
//         description TEXT,
//         created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
//       )
//     `);

//     // Создаем индексы для улучшения производительности
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_name ON components(name)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_storage ON components(storage_cell)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_updated ON components(updated_at)');
//   }

//   insertInitialCategories() {
//     const categories = ["Транзисторы", "Резисторы", "Конденсаторы", "Микросхемы", "Диоды"];
    
//     const insertStmt = this.db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    
//     // Используем транзакцию для лучшей производительности
//     const insertMany = this.db.transaction((cats) => {
//       for (const category of cats) {
//         insertStmt.run(category);
//       }
//     });

//     insertMany(categories);
//   }

//   migrateDatabase() {
//     try {
//       const columns = this.db.prepare("PRAGMA table_info(components)").all();
//       const columnNames = columns.map(col => col.name);
      
//       // Все необходимые колонки в одном месте
//       const migrations = [
//         { name: 'storage_cell', type: 'TEXT', default: 'NULL' },
//         { name: 'datasheet_url', type: 'TEXT', default: 'NULL' },
//         { name: 'quantity', type: 'INTEGER', default: '0' },
//         { name: 'updated_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' },
//         { name: 'parameters', type: 'TEXT', default: "'{}'" },
//         { name: 'image_data', type: 'TEXT', default: 'NULL' },
//         { name: 'description', type: 'TEXT', default: 'NULL' },
//         { name: 'created_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' }
//       ];

//       // Выполняем миграции в транзакции
//       const migrate = this.db.transaction(() => {
//         for (const migration of migrations) {
//           if (!columnNames.includes(migration.name)) {
//             this.db.exec(`ALTER TABLE components ADD COLUMN ${migration.name} ${migration.type} DEFAULT ${migration.default}`);
//             console.log(`✅ Added column: ${migration.name}`);
//           }
//         }
//       });

//       migrate();
      
//     } catch (error) {
//       console.error('❌ Migration error:', error);
//     }
//   }

//   // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С БД =====

//   all(sql, params = []) {
//     try {
//       return this.db.prepare(sql).all(params);
//     } catch (error) {
//       console.error('❌ Query error (all):', error.message, sql, params);
//       return [];
//     }
//   }

//   get(sql, params = []) {
//     try {
//       return this.db.prepare(sql).get(params) || null;
//     } catch (error) {
//       console.error('❌ Query error (get):', error.message, sql, params);
//       return null;
//     }
//   }

//   run(sql, params = []) {
//     try {
//       const result = this.db.prepare(sql).run(params);
//       return {
//         success: true,
//         changes: result.changes,
//         lastInsertRowid: result.lastInsertRowid
//       };
//     } catch (error) {
//       console.error('❌ Query error (run):', error.message, sql, params);
//       return { 
//         success: false, 
//         changes: 0, 
//         lastInsertRowid: 0,
//         error: error.message 
//       };
//     }
//   }

//   // ===== API КАТЕГОРИЙ =====

//   getCategories() {
//     return this.all("SELECT * FROM categories ORDER BY name");
//   }

//   addCategory(name) {
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" };
//     }

//     const result = this.run("INSERT INTO categories (name) VALUES (?)", [name.trim()]);
    
//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid };
//     }
    
//     return { 
//       success: false, 
//       error: result.error?.includes('UNIQUE') 
//         ? "Категория с таким названием уже существует" 
//         : "Ошибка добавления категории" 
//     };
//   }

//   updateCategory(id, name) {
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" };
//     }

//     const result = this.run("UPDATE categories SET name = ? WHERE id = ?", [name.trim(), id]);
    
//     if (result.success && result.changes > 0) {
//       return { success: true };
//     }
    
//     return { 
//       success: false, 
//       error: result.changes === 0 ? "Категория не найдена" : "Ошибка обновления категории" 
//     };
//   }

//   deleteCategory(id) {
//     // Используем CASCADE для автоматического удаления компонентов
//     const result = this.run("DELETE FROM categories WHERE id = ?", [id]);
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Категория не найдена" : null
//     };
//   }

//   // ===== API КОМПОНЕНТОВ =====

//   getComponents(categoryId = null) {
//     if (categoryId) {
//       return this.all(
//         "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.category_id = ? ORDER BY c.name", 
//         [categoryId]
//       );
//     }
//     return this.all("SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id ORDER BY c.name");
//   }

//   getComponent(id) {
//     const component = this.get(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.id = ?
//     `, [id]);
    
//     console.log('🔍 Raw component data:', component);
//     console.log('🔍 Parameters type:', typeof component?.parameters);
//     console.log('🔍 Parameters value:', component?.parameters);
    
//     if (component) {
//       // Безопасный парсинг параметров
//       if (component.parameters && typeof component.parameters === 'string') {
//         try {
//           component.parameters = JSON.parse(component.parameters);
//           console.log('✅ Successfully parsed parameters:', component.parameters);
//         } catch (error) {
//           console.error('❌ JSON parse error:', error);
//           component.parameters = {};
//         }
//       } else {
//         component.parameters = component.parameters || {};
//       }
//     }
    
//     return component;
//   }

//   addComponent(componentData) {
//     // Валидация обязательных полей
//     if (!componentData.category_id || !componentData.name?.trim()) {
//       return { success: false, error: "Категория и название компонента обязательны" };
//     }

//     const result = this.run(`
//       INSERT INTO components 
//       (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data, description)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       componentData.category_id,
//       componentData.name.trim(),
//       componentData.storage_cell?.trim() || null,
//       componentData.datasheet_url?.trim() || null,
//       Math.max(0, parseInt(componentData.quantity) || 0),
//       componentData.updated_at || new Date().toISOString(),
//       this.serializeParameters(componentData.parameters),
//       componentData.image_data || null,
//       componentData.description?.trim() || null
//     ]);

//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid };
//     }
    
//     return { success: false, error: "Ошибка добавления компонента" };
//   }

//   updateComponent(componentData) {
//     if (!componentData.id) {
//       return { success: false, error: "ID компонента обязателен для обновления" };
//     }
  
//     const result = this.run(`
//       UPDATE components 
//       SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
//           quantity = ?, updated_at = ?, parameters = ?, image_data = ?, description = ?
//       WHERE id = ?
//     `, [
//       componentData.category_id,
//       componentData.name,
//       componentData.storage_cell,
//       componentData.datasheet_url,
//       componentData.quantity,
//       new Date().toISOString(),
//       JSON.stringify(componentData.parameters),
//       componentData.image_data,
//       componentData.description,
//       componentData.id
//     ]);
  
//     return { 
//       success: result.success, 
//       changes: result.changes,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     };
//   }
  

//   deleteComponent(id) {
//     const result = this.run("DELETE FROM components WHERE id = ?", [id]);
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     };
//   }

//   // ===== ПОИСК И ФИЛЬТРАЦИЯ =====

//   searchComponents(query) {
//     if (!query?.trim()) return [];
    
//     const searchTerm = `%${query.trim()}%`;
//     return this.all(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.name LIKE ? OR c.storage_cell LIKE ? OR cat.name LIKE ? OR c.description LIKE ?
//       ORDER BY c.name
//     `, [searchTerm, searchTerm, searchTerm, searchTerm]);
//   }

//   getComponentsByStorage(cell) {
//     if (!cell?.trim()) return [];
    
//     return this.all(
//       "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.storage_cell = ? ORDER BY c.name",
//       [cell.trim()]
//     );
//   }

//   // ===== УТИЛИТЫ =====

//   serializeParameters(parameters) {
//     if (!parameters) return '{}';
//     if (typeof parameters === 'string') {
//       try {
//         // Если это уже JSON строка, проверяем валидность
//         JSON.parse(parameters);
//         return parameters;
//       } catch {
//         return '{}';
//       }
//     }
//     return JSON.stringify(parameters);
//   }

//   getDatabaseStats() {
//     const categoryCount = this.get("SELECT COUNT(*) as count FROM categories")?.count || 0;
//     const componentCount = this.get("SELECT COUNT(*) as count FROM components")?.count || 0;
//     const totalQuantity = this.get("SELECT SUM(quantity) as total FROM components")?.total || 0;

//     return {
//       categoryCount,
//       componentCount,
//       totalQuantity,
//       dbPath: this.dbPath,
//       lastUpdated: new Date().toISOString()
//     };
//   }

//   checkDatabaseIntegrity() {
//     try {
//       const integrityCheck = this.get("PRAGMA integrity_check");
//       const tables = this.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
//       const componentCount = this.get("SELECT COUNT(*) as c FROM components")?.c || 0;
      
//       console.log("✅ Database integrity:", integrityCheck);
//       console.log("📊 Database contains tables:", tables.map(t => t.name));
//       console.log("🔧 Total components:", componentCount);
      
//       return {
//         success: true,
//         integrity: integrityCheck,
//         tables: tables.map(t => t.name),
//         componentCount
//       };
//     } catch (error) {
//       console.error("❌ Database integrity error:", error);
//       return { success: false, error: error.message };
//     }
//   }

//   // ===== ОПТИМИЗАЦИЯ И ЗАКРЫТИЕ =====

//   optimize() {
//     try {
//       this.db.exec('PRAGMA optimize');
//       this.db.exec('VACUUM');
//       console.log('✅ Database optimized');
//     } catch (error) {
//       console.error('❌ Database optimization error:', error);
//     }
//   }

//   backup() {
//     try {
//       const backupPath = this.dbPath + '.backup_' + Date.now();
//       this.db.backup(backupPath);
//       console.log('✅ Database backup created:', backupPath);
//       return backupPath;
//     } catch (error) {
//       console.error('❌ Database backup error:', error);
//       return null;
//     }
//   }

//   close() {
//     if (this.db) {
//       this.optimize();
//       this.db.close();
//       console.log('✅ Database closed');
//     }
//   }
// }

// export default ComponentsDatabase;



































































// const Database = require('better-sqlite3');
// const path = require('path');
// const { app } = require('electron');

// class ComponentsDatabase {
//   constructor() {
//     // Используем userData папку Electron для хранения БД
//     const userDataPath = app.getPath('userData');
//     this.dbPath = path.join(userDataPath, 'components.db');
    
//     // Создаем папку если не существует
//     const dbDir = path.dirname(this.dbPath);
//     require('fs').mkdirSync(dbDir, { recursive: true });
    
//     this.db = new Database(this.dbPath);
    
//     // Включаем оптимизации
//     this.db.pragma('journal_mode = WAL');
//     this.db.pragma('foreign_keys = ON');
//     this.db.pragma('busy_timeout = 5000');
    
//     this.init();
//   }

//   init() {
//     try {
//       this.createTables();
//       this.insertInitialCategories();
//       this.migrateDatabase();
//       console.log('✅ Database initialized at:', this.dbPath);
//     } catch (error) {
//       console.error('❌ Database initialization error:', error);
//       throw error;
//     }
//   }

//   createTables() {
//     // Создаем таблицы отдельными запросами для лучшей читаемости
//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS categories (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL UNIQUE,
//         created_at TEXT DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS components (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         category_id INTEGER NOT NULL,
//         name TEXT NOT NULL,
//         storage_cell TEXT,
//         datasheet_url TEXT,
//         quantity INTEGER DEFAULT 0,
//         updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         parameters TEXT DEFAULT '{}',
//         image_data TEXT,
//         description TEXT,
//         created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
//       )
//     `);

//     // Создаем индексы для улучшения производительности
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_name ON components(name)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_storage ON components(storage_cell)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_updated ON components(updated_at)');
//   }

//   insertInitialCategories() {
//     const categories = ["Транзисторы", "Резисторы", "Конденсаторы", "Микросхемы", "Диоды"];
    
//     const insertStmt = this.db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    
//     // Используем транзакцию для лучшей производительности
//     const insertMany = this.db.transaction((cats) => {
//       for (const category of cats) {
//         insertStmt.run(category);
//       }
//     });

//     insertMany(categories);
//   }

//   migrateDatabase() {
//     try {
//       const columns = this.db.prepare("PRAGMA table_info(components)").all();
//       const columnNames = columns.map(col => col.name);
      
//       // Все необходимые колонки в одном месте
//       const migrations = [
//         { name: 'storage_cell', type: 'TEXT', default: 'NULL' },
//         { name: 'datasheet_url', type: 'TEXT', default: 'NULL' },
//         { name: 'quantity', type: 'INTEGER', default: '0' },
//         { name: 'updated_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' },
//         { name: 'parameters', type: 'TEXT', default: "'{}'" },
//         { name: 'image_data', type: 'TEXT', default: 'NULL' },
//         { name: 'description', type: 'TEXT', default: 'NULL' },
//         { name: 'created_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' }
//       ];

//       // Выполняем миграции в транзакции
//       const migrate = this.db.transaction(() => {
//         for (const migration of migrations) {
//           if (!columnNames.includes(migration.name)) {
//             this.db.exec(`ALTER TABLE components ADD COLUMN ${migration.name} ${migration.type} DEFAULT ${migration.default}`);
//             console.log(`✅ Added column: ${migration.name}`);
//           }
//         }
//       });

//       migrate();
      
//     } catch (error) {
//       console.error('❌ Migration error:', error);
//     }
//   }

//   // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С БД =====

//   all(sql, params = []) {
//     try {
//       return this.db.prepare(sql).all(params);
//     } catch (error) {
//       console.error('❌ Query error (all):', error.message, sql, params);
//       return [];
//     }
//   }

//   get(sql, params = []) {
//     try {
//       return this.db.prepare(sql).get(params) || null;
//     } catch (error) {
//       console.error('❌ Query error (get):', error.message, sql, params);
//       return null;
//     }
//   }

//   run(sql, params = []) {
//     try {
//       const result = this.db.prepare(sql).run(params);
//       return {
//         success: true,
//         changes: result.changes,
//         lastInsertRowid: result.lastInsertRowid
//       };
//     } catch (error) {
//       console.error('❌ Query error (run):', error.message, sql, params);
//       return { 
//         success: false, 
//         changes: 0, 
//         lastInsertRowid: 0,
//         error: error.message 
//       };
//     }
//   }

//   // ===== API КАТЕГОРИЙ =====

//   getCategories() {
//     return this.all("SELECT * FROM categories ORDER BY name");
//   }

//   addCategory(name) {
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" };
//     }

//     const result = this.run("INSERT INTO categories (name) VALUES (?)", [name.trim()]);
    
//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid };
//     }
    
//     return { 
//       success: false, 
//       error: result.error?.includes('UNIQUE') 
//         ? "Категория с таким названием уже существует" 
//         : "Ошибка добавления категории" 
//     };
//   }

//   updateCategory(id, name) {
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" };
//     }

//     const result = this.run("UPDATE categories SET name = ? WHERE id = ?", [name.trim(), id]);
    
//     if (result.success && result.changes > 0) {
//       return { success: true };
//     }
    
//     return { 
//       success: false, 
//       error: result.changes === 0 ? "Категория не найдена" : "Ошибка обновления категории" 
//     };
//   }

//   deleteCategory(id) {
//     // Используем CASCADE для автоматического удаления компонентов
//     const result = this.run("DELETE FROM categories WHERE id = ?", [id]);
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Категория не найдена" : null
//     };
//   }

//   // ===== API КОМПОНЕНТОВ =====

//   getComponents(categoryId = null) {
//     if (categoryId) {
//       return this.all(
//         "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.category_id = ? ORDER BY c.name", 
//         [categoryId]
//       );
//     }
//     return this.all("SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id ORDER BY c.name");
//   }

//   getComponent(id) {
//     const component = this.get(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.id = ?
//     `, [id]);
    
//     console.log('🔍 Raw component data:', component);
//     console.log('🔍 Parameters type:', typeof component?.parameters);
//     console.log('🔍 Parameters value:', component?.parameters);
    
//     if (component) {
//       // Безопасный парсинг параметров
//       if (component.parameters && typeof component.parameters === 'string') {
//         try {
//           component.parameters = JSON.parse(component.parameters);
//           console.log('✅ Successfully parsed parameters:', component.parameters);
//         } catch (error) {
//           console.error('❌ JSON parse error:', error);
//           component.parameters = {};
//         }
//       } else {
//         component.parameters = component.parameters || {};
//       }
//     }
    
//     return component;
//   }

//   addComponent(componentData) {
//     // Валидация обязательных полей
//     if (!componentData.category_id || !componentData.name?.trim()) {
//       return { success: false, error: "Категория и название компонента обязательны" };
//     }

//     const result = this.run(`
//       INSERT INTO components 
//       (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data, description)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       componentData.category_id,
//       componentData.name.trim(),
//       componentData.storage_cell?.trim() || null,
//       componentData.datasheet_url?.trim() || null,
//       Math.max(0, parseInt(componentData.quantity) || 0),
//       componentData.updated_at || new Date().toISOString(),
//       this.serializeParameters(componentData.parameters),
//       componentData.image_data || null,
//       componentData.description?.trim() || null
//     ]);

//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid };
//     }
    
//     return { success: false, error: "Ошибка добавления компонента" };
//   }

//   updateComponent(componentData) {
//     if (!componentData.id) {
//       return { success: false, error: "ID компонента обязателен для обновления" };
//     }
  
//     const result = this.run(`
//       UPDATE components 
//       SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
//           quantity = ?, updated_at = ?, parameters = ?, image_data = ?, description = ?
//       WHERE id = ?
//     `, [
//       componentData.category_id,
//       componentData.name,
//       componentData.storage_cell,
//       componentData.datasheet_url,
//       componentData.quantity,
//       new Date().toISOString(),
//       JSON.stringify(componentData.parameters),
//       componentData.image_data,
//       componentData.description,
//       componentData.id
//     ]);
  
//     return { 
//       success: result.success, 
//       changes: result.changes,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     };
//   }
  

//   deleteComponent(id) {
//     const result = this.run("DELETE FROM components WHERE id = ?", [id]);
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     };
//   }

//   // ===== ПОИСК И ФИЛЬТРАЦИЯ =====

//   searchComponents(query) {
//     if (!query?.trim()) return [];
    
//     const searchTerm = `%${query.trim()}%`;
//     return this.all(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.name LIKE ? OR c.storage_cell LIKE ? OR cat.name LIKE ? OR c.description LIKE ?
//       ORDER BY c.name
//     `, [searchTerm, searchTerm, searchTerm, searchTerm]);
//   }

//   getComponentsByStorage(cell) {
//     if (!cell?.trim()) return [];
    
//     return this.all(
//       "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.storage_cell = ? ORDER BY c.name",
//       [cell.trim()]
//     );
//   }

//   // ===== УТИЛИТЫ =====

//   serializeParameters(parameters) {
//     if (!parameters) return '{}';
//     if (typeof parameters === 'string') {
//       try {
//         // Если это уже JSON строка, проверяем валидность
//         JSON.parse(parameters);
//         return parameters;
//       } catch {
//         return '{}';
//       }
//     }
//     return JSON.stringify(parameters);
//   }

//   getDatabaseStats() {
//     const categoryCount = this.get("SELECT COUNT(*) as count FROM categories")?.count || 0;
//     const componentCount = this.get("SELECT COUNT(*) as count FROM components")?.count || 0;
//     const totalQuantity = this.get("SELECT SUM(quantity) as total FROM components")?.total || 0;

//     return {
//       categoryCount,
//       componentCount,
//       totalQuantity,
//       dbPath: this.dbPath,
//       lastUpdated: new Date().toISOString()
//     };
//   }

//   checkDatabaseIntegrity() {
//     try {
//       const integrityCheck = this.get("PRAGMA integrity_check");
//       const tables = this.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
//       const componentCount = this.get("SELECT COUNT(*) as c FROM components")?.c || 0;
      
//       console.log("✅ Database integrity:", integrityCheck);
//       console.log("📊 Database contains tables:", tables.map(t => t.name));
//       console.log("🔧 Total components:", componentCount);
      
//       return {
//         success: true,
//         integrity: integrityCheck,
//         tables: tables.map(t => t.name),
//         componentCount
//       };
//     } catch (error) {
//       console.error("❌ Database integrity error:", error);
//       return { success: false, error: error.message };
//     }
//   }

//   // ===== ОПТИМИЗАЦИЯ И ЗАКРЫТИЕ =====

//   optimize() {
//     try {
//       this.db.exec('PRAGMA optimize');
//       this.db.exec('VACUUM');
//       console.log('✅ Database optimized');
//     } catch (error) {
//       console.error('❌ Database optimization error:', error);
//     }
//   }

//   backup() {
//     try {
//       const backupPath = this.dbPath + '.backup_' + Date.now();
//       this.db.backup(backupPath);
//       console.log('✅ Database backup created:', backupPath);
//       return backupPath;
//     } catch (error) {
//       console.error('❌ Database backup error:', error);
//       return null;
//     }
//   }

//   close() {
//     if (this.db) {
//       this.optimize();
//       this.db.close();
//       console.log('✅ Database closed');
//     }
//   }
// }

// export default ComponentsDatabase;









































// const Database = require('better-sqlite3');
// const path = require('path');
// const { app } = require('electron');

// class ComponentsDatabase {
//   constructor() {
//     // Используем userData папку Electron для хранения БД
//     const userDataPath = app.getPath('userData');
//     this.dbPath = path.join(userDataPath, 'components.db');
    
//     // Создаем папку если не существует
//     const dbDir = path.dirname(this.dbPath);
//     require('fs').mkdirSync(dbDir, { recursive: true });
    
//     this.db = new Database(this.dbPath);
    
//     // Включаем оптимизации
//     this.db.pragma('journal_mode = WAL');
//     this.db.pragma('foreign_keys = ON');
//     this.db.pragma('busy_timeout = 5000');
    
//     this.init();
//   }

//   init() {
//     try {
//       this.createTables();
//       this.insertInitialCategories();
//       this.migrateDatabase();
//       console.log('✅ Database initialized at:', this.dbPath);
//     } catch (error) {
//       console.error('❌ Database initialization error:', error);
//       throw error;
//     }
//   }

//   createTables() {
//     // Создаем таблицы отдельными запросами для лучшей читаемости
//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS categories (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL UNIQUE,
//         created_at TEXT DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS components (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         category_id INTEGER NOT NULL,
//         name TEXT NOT NULL,
//         storage_cell TEXT,
//         datasheet_url TEXT,
//         quantity INTEGER DEFAULT 0,
//         updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         parameters TEXT DEFAULT '{}',
//         image_data TEXT,
//         description TEXT,
//         created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
//       )
//     `);

//     // Создаем индексы для улучшения производительности
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_name ON components(name)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_storage ON components(storage_cell)');
//     this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_updated ON components(updated_at)');
//   }

//   insertInitialCategories() {
//     const categories = ["Транзисторы", "Резисторы", "Конденсаторы", "Микросхемы", "Диоды"];
    
//     const insertStmt = this.db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    
//     // Используем транзакцию для лучшей производительности
//     const insertMany = this.db.transaction((cats) => {
//       for (const category of cats) {
//         insertStmt.run(category);
//       }
//     });

//     insertMany(categories);
//   }

//   migrateDatabase() {
//     try {
//       const columns = this.db.prepare("PRAGMA table_info(components)").all();
//       const columnNames = columns.map(col => col.name);
      
//       // Все необходимые колонки в одном месте
//       const migrations = [
//         { name: 'storage_cell', type: 'TEXT', default: 'NULL' },
//         { name: 'datasheet_url', type: 'TEXT', default: 'NULL' },
//         { name: 'quantity', type: 'INTEGER', default: '0' },
//         { name: 'updated_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' },
//         { name: 'parameters', type: 'TEXT', default: "'{}'" },
//         { name: 'image_data', type: 'TEXT', default: 'NULL' },
//         { name: 'description', type: 'TEXT', default: 'NULL' },
//         { name: 'created_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' }
//       ];

//       // Выполняем миграции в транзакции
//       const migrate = this.db.transaction(() => {
//         for (const migration of migrations) {
//           if (!columnNames.includes(migration.name)) {
//             this.db.exec(`ALTER TABLE components ADD COLUMN ${migration.name} ${migration.type} DEFAULT ${migration.default}`);
//             console.log(`✅ Added column: ${migration.name}`);
//           }
//         }
//       });

//       migrate();
      
//     } catch (error) {
//       console.error('❌ Migration error:', error);
//     }
//   }

//   // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С БД =====

//   all(sql, params = []) {
//     try {
//       return this.db.prepare(sql).all(params);
//     } catch (error) {
//       console.error('❌ Query error (all):', error.message, sql, params);
//       return [];
//     }
//   }

//   get(sql, params = []) {
//     try {
//       return this.db.prepare(sql).get(params) || null;
//     } catch (error) {
//       console.error('❌ Query error (get):', error.message, sql, params);
//       return null;
//     }
//   }

//   run(sql, params = []) {
//     try {
//       const result = this.db.prepare(sql).run(params);
//       return {
//         success: true,
//         changes: result.changes,
//         lastInsertRowid: result.lastInsertRowid
//       };
//     } catch (error) {
//       console.error('❌ Query error (run):', error.message, sql, params);
//       return { 
//         success: false, 
//         changes: 0, 
//         lastInsertRowid: 0,
//         error: error.message 
//       };
//     }
//   }

//   // ===== API КАТЕГОРИЙ =====

//   getCategories() {
//     return this.all("SELECT * FROM categories ORDER BY name");
//   }

//   addCategory(name) {
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" };
//     }

//     const result = this.run("INSERT INTO categories (name) VALUES (?)", [name.trim()]);
    
//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid };
//     }
    
//     return { 
//       success: false, 
//       error: result.error?.includes('UNIQUE') 
//         ? "Категория с таким названием уже существует" 
//         : "Ошибка добавления категории" 
//     };
//   }

//   updateCategory(id, name) {
//     if (!name || !name.trim()) {
//       return { success: false, error: "Название категории не может быть пустым" };
//     }

//     const result = this.run("UPDATE categories SET name = ? WHERE id = ?", [name.trim(), id]);
    
//     if (result.success && result.changes > 0) {
//       return { success: true };
//     }
    
//     return { 
//       success: false, 
//       error: result.changes === 0 ? "Категория не найдена" : "Ошибка обновления категории" 
//     };
//   }

//   deleteCategory(id) {
//     // Используем CASCADE для автоматического удаления компонентов
//     const result = this.run("DELETE FROM categories WHERE id = ?", [id]);
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Категория не найдена" : null
//     };
//   }

//   // ===== API КОМПОНЕНТОВ =====

//   getComponents(categoryId = null) {
//     if (categoryId) {
//       return this.all(
//         "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.category_id = ? ORDER BY c.name", 
//         [categoryId]
//       );
//     }
//     return this.all("SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id ORDER BY c.name");
//   }

//   getComponent(id) {
//     const component = this.get(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.id = ?
//     `, [id]);
    
//     console.log('🔍 Raw component data:', component);
//     console.log('🔍 Parameters type:', typeof component?.parameters);
//     console.log('🔍 Parameters value:', component?.parameters);
    
//     if (component) {
//       // Безопасный парсинг параметров
//       if (component.parameters && typeof component.parameters === 'string') {
//         try {
//           component.parameters = JSON.parse(component.parameters);
//           console.log('✅ Successfully parsed parameters:', component.parameters);
//         } catch (error) {
//           console.error('❌ JSON parse error:', error);
//           component.parameters = {};
//         }
//       } else {
//         component.parameters = component.parameters || {};
//       }
//     }
    
//     return component;
//   }

//   addComponent(componentData) {
//     // Валидация обязательных полей
//     if (!componentData.category_id || !componentData.name?.trim()) {
//       return { success: false, error: "Категория и название компонента обязательны" };
//     }

//     const result = this.run(`
//       INSERT INTO components 
//       (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data, description)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       componentData.category_id,
//       componentData.name.trim(),
//       componentData.storage_cell?.trim() || null,
//       componentData.datasheet_url?.trim() || null,
//       Math.max(0, parseInt(componentData.quantity) || 0),
//       componentData.updated_at || new Date().toISOString(),
//       this.serializeParameters(componentData.parameters),
//       componentData.image_data || null,
//       componentData.description?.trim() || null
//     ]);

//     if (result.success && result.changes > 0) {
//       return { success: true, id: result.lastInsertRowid };
//     }
    
//     return { success: false, error: "Ошибка добавления компонента" };
//   }

//   updateComponent(componentData) {
//     if (!componentData.id) {
//       return { success: false, error: "ID компонента обязателен для обновления" };
//     }
  
//     const result = this.run(`
//       UPDATE components 
//       SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
//           quantity = ?, updated_at = ?, parameters = ?, image_data = ?, description = ?
//       WHERE id = ?
//     `, [
//       componentData.category_id,
//       componentData.name,
//       componentData.storage_cell,
//       componentData.datasheet_url,
//       componentData.quantity,
//       new Date().toISOString(),
//       JSON.stringify(componentData.parameters),
//       componentData.image_data,
//       componentData.description,
//       componentData.id
//     ]);
  
//     return { 
//       success: result.success, 
//       changes: result.changes,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     };
//   }
  

//   deleteComponent(id) {
//     const result = this.run("DELETE FROM components WHERE id = ?", [id]);
//     return { 
//       success: result.success && result.changes > 0,
//       error: result.success && result.changes === 0 ? "Компонент не найден" : null
//     };
//   }

//   // ===== ПОИСК И ФИЛЬТРАЦИЯ =====

//   searchComponents(query) {
//     if (!query?.trim()) return [];
    
//     const searchTerm = `%${query.trim()}%`;
//     return this.all(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.name LIKE ? OR c.storage_cell LIKE ? OR cat.name LIKE ? OR c.description LIKE ?
//       ORDER BY c.name
//     `, [searchTerm, searchTerm, searchTerm, searchTerm]);
//   }

//   getComponentsByStorage(cell) {
//     if (!cell?.trim()) return [];
    
//     return this.all(
//       "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.storage_cell = ? ORDER BY c.name",
//       [cell.trim()]
//     );
//   }

//   // ===== УТИЛИТЫ =====

//   serializeParameters(parameters) {
//     if (!parameters) return '{}';
//     if (typeof parameters === 'string') {
//       try {
//         // Если это уже JSON строка, проверяем валидность
//         JSON.parse(parameters);
//         return parameters;
//       } catch {
//         return '{}';
//       }
//     }
//     return JSON.stringify(parameters);
//   }

//   getDatabaseStats() {
//     const categoryCount = this.get("SELECT COUNT(*) as count FROM categories")?.count || 0;
//     const componentCount = this.get("SELECT COUNT(*) as count FROM components")?.count || 0;
//     const totalQuantity = this.get("SELECT SUM(quantity) as total FROM components")?.total || 0;

//     return {
//       categoryCount,
//       componentCount,
//       totalQuantity,
//       dbPath: this.dbPath,
//       lastUpdated: new Date().toISOString()
//     };
//   }

//   checkDatabaseIntegrity() {
//     try {
//       const integrityCheck = this.get("PRAGMA integrity_check");
//       const tables = this.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
//       const componentCount = this.get("SELECT COUNT(*) as c FROM components")?.c || 0;
      
//       console.log("✅ Database integrity:", integrityCheck);
//       console.log("📊 Database contains tables:", tables.map(t => t.name));
//       console.log("🔧 Total components:", componentCount);
      
//       return {
//         success: true,
//         integrity: integrityCheck,
//         tables: tables.map(t => t.name),
//         componentCount
//       };
//     } catch (error) {
//       console.error("❌ Database integrity error:", error);
//       return { success: false, error: error.message };
//     }
//   }

//   // ===== ОПТИМИЗАЦИЯ И ЗАКРЫТИЕ =====

//   optimize() {
//     try {
//       this.db.exec('PRAGMA optimize');
//       this.db.exec('VACUUM');
//       console.log('✅ Database optimized');
//     } catch (error) {
//       console.error('❌ Database optimization error:', error);
//     }
//   }

//   backup() {
//     try {
//       const backupPath = this.dbPath + '.backup_' + Date.now();
//       this.db.backup(backupPath);
//       console.log('✅ Database backup created:', backupPath);
//       return backupPath;
//     } catch (error) {
//       console.error('❌ Database backup error:', error);
//       return null;
//     }
//   }

//   close() {
//     if (this.db) {
//       this.optimize();
//       this.db.close();
//       console.log('✅ Database closed');
//     }
//   }
// }

// export default ComponentsDatabase;






























































































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
