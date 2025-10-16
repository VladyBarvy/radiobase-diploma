// const Database = require('better-sqlite3');
// const path = require('path');
// const { app } = require('electron');

// class ComponentsDatabase {
//   constructor() {
//     // Используем userData папку Electron для хранения БД
//     const userDataPath = app.getPath('userData');
//     this.dbPath = path.join(userDataPath, 'components.db');
//     this.db = new Database(this.dbPath);
    
//     // Включаем оптимизации
//     this.db.pragma('journal_mode = WAL');
//     this.db.pragma('foreign_keys = ON');
    
//     this.init();
//   }

//   init() {
//     try {
//       this.createTables();
//       this.insertInitialCategories();
//       this.migrateDatabase();
//       console.log('Database initialized at:', this.dbPath);
//     } catch (error) {
//       console.error('Database initialization error:', error);
//       throw error;
//     }
//   }


//   createTables() {
//     this.db.exec(`
//       CREATE TABLE IF NOT EXISTS categories (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL UNIQUE
//       );
  
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
//         FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
//       );
  
      
//       CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id);
//       CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
//       CREATE INDEX IF NOT EXISTS idx_components_storage ON components(storage_cell);
//     `);
//   }


//   insertInitialCategories() {
//     const categories = ["Транзисторы", "Резисторы", "Конденсаторы", "Микросхемы", "Диоды"];
    
//     const insertStmt = this.db.prepare(`
//       INSERT OR IGNORE INTO categories (name) VALUES (?)
//     `);

//     const insertMany = this.db.transaction((cats) => {
//       for (const category of cats) {
//         insertStmt.run(category);
//       }
//     });

//     insertMany(categories);
//   }

//   migrateDatabase() {
//     try {
//       // Проверяем существующие колонки в components
//       const columns = this.db.prepare("PRAGMA table_info(components)").all();
//       const columnNames = columns.map(col => col.name);
      
//       const requiredColumns = [
//         { name: 'storage_cell', type: 'TEXT' },
//         { name: 'datasheet_url', type: 'TEXT' },
//         { name: 'quantity', type: 'INTEGER' },
//         { name: 'updated_at', type: 'TEXT' },
//         { name: 'parameters', type: 'TEXT' },
//         { name: 'image_data', type: 'TEXT' },
//         { name: 'description', type: 'TEXT' }
//       ];

//       // Добавляем отсутствующие колонки
//       for (const column of requiredColumns) {
//         if (!columnNames.includes(column.name)) {
//           this.db.exec(`ALTER TABLE components ADD COLUMN ${column.name} ${column.type}`);
//           console.log(`Added column: ${column.name}`);
//         }
//       }
//     } catch (error) {
//       console.error('Migration error:', error);
//     }
//   }

//   // ===== БАЗОВЫЕ МЕТОДЫ =====

//   all(sql, params = []) {
//     try {
//       return this.db.prepare(sql).all(params);
//     } catch (error) {
//       console.error('Query error (all):', error, sql, params);
//       return [];
//     }
//   }

//   get(sql, params = []) {
//     try {
//       return this.db.prepare(sql).get(params) || null;
//     } catch (error) {
//       console.error('Query error (get):', error, sql, params);
//       return null;
//     }
//   }

//   run(sql, params = []) {
//     try {
//       const result = this.db.prepare(sql).run(params);
//       return {
//         changes: result.changes,
//         lastInsertRowid: result.lastInsertRowid
//       };
//     } catch (error) {
//       console.error('Query error (run):', error, sql, params);
//       return { changes: 0, lastInsertRowid: 0 };
//     }
//   }

//   // ===== API КАТЕГОРИЙ =====

//   getCategories() {
//     return this.all("SELECT * FROM categories ORDER BY name");
//   }

//   addCategory(name) {
//     try {
//       const result = this.run("INSERT INTO categories (name) VALUES (?)", [name]);
//       if (result.changes > 0) {
//         return { success: true, id: result.lastInsertRowid };
//       }
//       return { success: false, error: "Категория уже существует" };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   deleteCategory(id) {
//     try {
//       // Удаляем компоненты категории (благодаря CASCADE)
//       this.run("DELETE FROM components WHERE category_id = ?", [id]);
//       const result = this.run("DELETE FROM categories WHERE id = ?", [id]);
//       return { success: result.changes > 0 };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // ===== API КОМПОНЕНТОВ =====

//   getComponents(categoryId = null) {
//     if (categoryId) {
//       return this.all(
//         "SELECT * FROM components WHERE category_id = ? ORDER BY name", 
//         [categoryId]
//       );
//     }
//     return this.all("SELECT * FROM components ORDER BY name");
//   }

//   getComponent(id) {
//     const component = this.get("SELECT * FROM components WHERE id = ?", [id]);
//     if (component && component.parameters) {
//       try {
//         component.parameters = JSON.parse(component.parameters);
//       } catch {
//         component.parameters = {};
//       }
//     }
//     return component;
//   }

//   // addComponent(componentData) {
//   //   try {
//   //     const result = this.run(`
//   //       INSERT INTO components 
//   //       (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data)
//   //       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//   //     `, [
//   //       componentData.category_id,
//   //       componentData.name,
//   //       componentData.storage_cell || null,
//   //       componentData.datasheet_url || null,
//   //       componentData.quantity || 0,
//   //       componentData.updated_at || new Date().toISOString(),
//   //       JSON.stringify(componentData.parameters || {}),
//   //       componentData.image_data || null,
//   //       componentData.description || null
//   //     ]);

//   //     if (result.changes > 0) {
//   //       return { success: true, id: result.lastInsertRowid };
//   //     }
//   //     return { success: false, error: "Ошибка добавления компонента" };
//   //   } catch (error) {
//   //     return { success: false, error: error.message };
//   //   }
//   // }

//   addComponent(componentData) {
//     try {
//       const result = this.run(`
//         INSERT INTO components 
//         (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data, description)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `, [
//         componentData.category_id,
//         componentData.name,
//         componentData.storage_cell || null,
//         componentData.datasheet_url || null,
//         componentData.quantity || 0,
//         componentData.updated_at || new Date().toISOString(),
//         JSON.stringify(componentData.parameters || {}),
//         componentData.image_data || null,
//         componentData.description || null  // description добавлен в конец
//       ]);
  
//       if (result.changes > 0) {
//         return { success: true, id: result.lastInsertRowid };
//       }
//       return { success: false, error: "Ошибка добавления компонента" };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // updateComponent(componentData) {
//   //   try {
//   //     const result = this.run(`
//   //       UPDATE components 
//   //       SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
//   //           quantity = ?, updated_at = ?, parameters = ?, image_data = ?
//   //       WHERE id = ?
//   //     `, [
//   //       componentData.category_id,
//   //       componentData.name,
//   //       componentData.storage_cell || null,
//   //       componentData.datasheet_url || null,
//   //       componentData.quantity || 0,
//   //       componentData.updated_at || new Date().toISOString(),
//   //       JSON.stringify(componentData.parameters || {}),
//   //       componentData.image_data || null,
//   //       componentData.description || null,
//   //       componentData.id
//   //     ]);

//   //     if (result.changes > 0) {
//   //       return { success: true };
//   //     }
//   //     return { success: false, error: "Компонент не найден" };
//   //   } catch (error) {
//   //     return { success: false, error: error.message };
//   //   }
//   // }

//   updateComponent(componentData) {
//     try {
//       const result = this.run(`
//         UPDATE components 
//         SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
//             quantity = ?, updated_at = ?, parameters = ?, image_data = ?, description = ?
//         WHERE id = ?
//       `, [
//         componentData.category_id,
//         componentData.name,
//         componentData.storage_cell || null,
//         componentData.datasheet_url || null,
//         componentData.quantity || 0,
//         componentData.updated_at || new Date().toISOString(),
//         JSON.stringify(componentData.parameters || {}),
//         componentData.image_data || null,
//         componentData.description || null,  // description добавлен перед id
//         componentData.id
//       ]);
  
//       if (result.changes > 0) {
//         return { success: true };
//       }
//       return { success: false, error: "Компонент не найден" };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   deleteComponent(id) {
//     try {
//       const result = this.run("DELETE FROM components WHERE id = ?", [id]);
//       return { success: result.changes > 0 };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }

//   // ===== ПОИСК И ФИЛЬТРАЦИЯ =====

//   searchComponents(query) {
//     return this.all(`
//       SELECT c.*, cat.name as category_name 
//       FROM components c 
//       LEFT JOIN categories cat ON c.category_id = cat.id 
//       WHERE c.name LIKE ? OR c.storage_cell LIKE ? OR cat.name LIKE ?
//       ORDER BY c.name
//     `, [`%${query}%`, `%${query}%`, `%${query}%`]);
//   }

//   getComponentsByStorage(cell) {
//     return this.all(
//       "SELECT * FROM components WHERE storage_cell = ? ORDER BY name",
//       [cell]
//     );
//   }

//   // ===== УТИЛИТЫ =====

//   getDatabaseStats() {
//     const categoryCount = this.get("SELECT COUNT(*) as count FROM categories").count;
//     const componentCount = this.get("SELECT COUNT(*) as count FROM components").count;
//     const totalQuantity = this.get("SELECT SUM(quantity) as total FROM components").total || 0;

//     return {
//       categoryCount,
//       componentCount,
//       totalQuantity,
//       dbPath: this.dbPath
//     };
//   }

//   checkDatabaseIntegrity() {
//     try {
//       const tables = this.all("SELECT name FROM sqlite_master WHERE type='table'");
//       const componentCount = this.get("SELECT COUNT(*) as c FROM components").c;
//       console.log("БД содержит таблицы:", tables.map(t => t.name), "Компонентов:", componentCount);
//       return true;
//     } catch (error) {
//       console.error("Ошибка целостности:", error);
//       return false;
//     }
//   }

//   // ===== ЗАКРЫТИЕ =====

//   close() {
//     if (this.db) {
//       this.db.close();
//     }
//   }

//   updateCategory(id, name) {
//     try {
//       const result = this.run("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
//       if (result.changes > 0) {
//         return { success: true };
//       }
//       return { success: false, error: "Категория не найдена" };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }
// }

// // module.exports = ComponentsDatabase;
// export default ComponentsDatabase;





































































const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class ComponentsDatabase {
  constructor() {
    // Используем userData папку Electron для хранения БД
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'components.db');
    
    // Создаем папку если не существует
    const dbDir = path.dirname(this.dbPath);
    require('fs').mkdirSync(dbDir, { recursive: true });
    
    this.db = new Database(this.dbPath);
    
    // Включаем оптимизации
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');
    
    this.init();
  }

  init() {
    try {
      this.createTables();
      this.insertInitialCategories();
      this.migrateDatabase();
      console.log('✅ Database initialized at:', this.dbPath);
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    }
  }

  createTables() {
    // Создаем таблицы отдельными запросами для лучшей читаемости
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
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
      )
    `);

    // Создаем индексы для улучшения производительности
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_name ON components(name)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_storage ON components(storage_cell)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_components_updated ON components(updated_at)');
  }

  insertInitialCategories() {
    const categories = ["Транзисторы", "Резисторы", "Конденсаторы", "Микросхемы", "Диоды"];
    
    const insertStmt = this.db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    
    // Используем транзакцию для лучшей производительности
    const insertMany = this.db.transaction((cats) => {
      for (const category of cats) {
        insertStmt.run(category);
      }
    });

    insertMany(categories);
  }

  migrateDatabase() {
    try {
      const columns = this.db.prepare("PRAGMA table_info(components)").all();
      const columnNames = columns.map(col => col.name);
      
      // Все необходимые колонки в одном месте
      const migrations = [
        { name: 'storage_cell', type: 'TEXT', default: 'NULL' },
        { name: 'datasheet_url', type: 'TEXT', default: 'NULL' },
        { name: 'quantity', type: 'INTEGER', default: '0' },
        { name: 'updated_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' },
        { name: 'parameters', type: 'TEXT', default: "'{}'" },
        { name: 'image_data', type: 'TEXT', default: 'NULL' },
        { name: 'description', type: 'TEXT', default: 'NULL' },
        { name: 'created_at', type: 'TEXT', default: 'CURRENT_TIMESTAMP' }
      ];

      // Выполняем миграции в транзакции
      const migrate = this.db.transaction(() => {
        for (const migration of migrations) {
          if (!columnNames.includes(migration.name)) {
            this.db.exec(`ALTER TABLE components ADD COLUMN ${migration.name} ${migration.type} DEFAULT ${migration.default}`);
            console.log(`✅ Added column: ${migration.name}`);
          }
        }
      });

      migrate();
      
    } catch (error) {
      console.error('❌ Migration error:', error);
    }
  }

  // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С БД =====

  all(sql, params = []) {
    try {
      return this.db.prepare(sql).all(params);
    } catch (error) {
      console.error('❌ Query error (all):', error.message, sql, params);
      return [];
    }
  }

  get(sql, params = []) {
    try {
      return this.db.prepare(sql).get(params) || null;
    } catch (error) {
      console.error('❌ Query error (get):', error.message, sql, params);
      return null;
    }
  }

  run(sql, params = []) {
    try {
      const result = this.db.prepare(sql).run(params);
      return {
        success: true,
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid
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
    // Используем CASCADE для автоматического удаления компонентов
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

  // getComponent(id) {
  //   const component = this.get(`
  //     SELECT c.*, cat.name as category_name 
  //     FROM components c 
  //     LEFT JOIN categories cat ON c.category_id = cat.id 
  //     WHERE c.id = ?
  //   `, [id]);
    
  //   if (component) {
  //     // Безопасный парсинг параметров
  //     if (component.parameters && typeof component.parameters === 'string') {
  //       try {
  //         component.parameters = JSON.parse(component.parameters);
  //       } catch {
  //         component.parameters = {};
  //       }
  //     } else {
  //       component.parameters = component.parameters || {};
  //     }
  //   }
    
  //   return component;
  // }



  getComponent(id) {
    const component = this.get(`
      SELECT c.*, cat.name as category_name 
      FROM components c 
      LEFT JOIN categories cat ON c.category_id = cat.id 
      WHERE c.id = ?
    `, [id]);
    
    console.log('🔍 Raw component data:', component);
    console.log('🔍 Parameters type:', typeof component?.parameters);
    console.log('🔍 Parameters value:', component?.parameters);
    
    if (component) {
      // Безопасный парсинг параметров
      if (component.parameters && typeof component.parameters === 'string') {
        try {
          component.parameters = JSON.parse(component.parameters);
          console.log('✅ Successfully parsed parameters:', component.parameters);
        } catch (error) {
          console.error('❌ JSON parse error:', error);
          component.parameters = {};
        }
      } else {
        component.parameters = component.parameters || {};
      }
    }
    
    return component;
  }

  addComponent(componentData) {
    // Валидация обязательных полей
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

  // updateComponent(componentData) {
  //   if (!componentData.id || !componentData.category_id || !componentData.name?.trim()) {
  //     return { success: false, error: "ID, категория и название компонента обязательны" };
  //   }

  //   const result = this.run(`
  //     UPDATE components 
  //     SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
  //         quantity = ?, updated_at = ?, parameters = ?, image_data = ?, description = ?
  //     WHERE id = ?
  //   `, [
  //     componentData.category_id,
  //     componentData.name.trim(),
  //     componentData.storage_cell?.trim() || null,
  //     componentData.datasheet_url?.trim() || null,
  //     Math.max(0, parseInt(componentData.quantity) || 0),
  //     componentData.updated_at || new Date().toISOString(),
  //     this.serializeParameters(componentData.parameters),
  //     componentData.image_data || null,
  //     componentData.description?.trim() || null,
  //     componentData.id
  //   ]);

  //   if (result.success && result.changes > 0) {
  //     return { success: true };
  //   }
    
  //   return { 
  //     success: false, 
  //     error: result.changes === 0 ? "Компонент не найден" : "Ошибка обновления компонента" 
  //   };
  // }


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

  getComponentsByStorage(cell) {
    if (!cell?.trim()) return [];
    
    return this.all(
      "SELECT c.*, cat.name as category_name FROM components c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.storage_cell = ? ORDER BY c.name",
      [cell.trim()]
    );
  }

  // ===== УТИЛИТЫ =====

  serializeParameters(parameters) {
    if (!parameters) return '{}';
    if (typeof parameters === 'string') {
      try {
        // Если это уже JSON строка, проверяем валидность
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
      const integrityCheck = this.get("PRAGMA integrity_check");
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
      this.db.exec('VACUUM');
      console.log('✅ Database optimized');
    } catch (error) {
      console.error('❌ Database optimization error:', error);
    }
  }

  backup() {
    try {
      const backupPath = this.dbPath + '.backup_' + Date.now();
      this.db.backup(backupPath);
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
