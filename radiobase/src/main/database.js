const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class ComponentsDatabase {
  constructor() {
    // Используем userData папку Electron для хранения БД
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'components.db');
    this.db = new Database(this.dbPath);
    
    // Включаем оптимизации
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    this.init();
  }

  init() {
    try {
      this.createTables();
      this.insertInitialCategories();
      this.migrateDatabase();
      console.log('Database initialized at:', this.dbPath);
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
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
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      );

      -- Индексы для улучшения производительности
      CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id);
      CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
      CREATE INDEX IF NOT EXISTS idx_components_storage ON components(storage_cell);
    `);
  }

  insertInitialCategories() {
    const categories = ["Транзисторы", "Резисторы", "Конденсаторы", "Микросхемы", "Диоды"];
    
    const insertStmt = this.db.prepare(`
      INSERT OR IGNORE INTO categories (name) VALUES (?)
    `);

    const insertMany = this.db.transaction((cats) => {
      for (const category of cats) {
        insertStmt.run(category);
      }
    });

    insertMany(categories);
  }

  migrateDatabase() {
    try {
      // Проверяем существующие колонки в components
      const columns = this.db.prepare("PRAGMA table_info(components)").all();
      const columnNames = columns.map(col => col.name);
      
      const requiredColumns = [
        { name: 'storage_cell', type: 'TEXT' },
        { name: 'datasheet_url', type: 'TEXT' },
        { name: 'quantity', type: 'INTEGER' },
        { name: 'updated_at', type: 'TEXT' },
        { name: 'parameters', type: 'TEXT' },
        { name: 'image_data', type: 'TEXT' }
      ];

      // Добавляем отсутствующие колонки
      for (const column of requiredColumns) {
        if (!columnNames.includes(column.name)) {
          this.db.exec(`ALTER TABLE components ADD COLUMN ${column.name} ${column.type}`);
          console.log(`Added column: ${column.name}`);
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  }

  // ===== БАЗОВЫЕ МЕТОДЫ =====

  all(sql, params = []) {
    try {
      return this.db.prepare(sql).all(params);
    } catch (error) {
      console.error('Query error (all):', error, sql, params);
      return [];
    }
  }

  get(sql, params = []) {
    try {
      return this.db.prepare(sql).get(params) || null;
    } catch (error) {
      console.error('Query error (get):', error, sql, params);
      return null;
    }
  }

  run(sql, params = []) {
    try {
      const result = this.db.prepare(sql).run(params);
      return {
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid
      };
    } catch (error) {
      console.error('Query error (run):', error, sql, params);
      return { changes: 0, lastInsertRowid: 0 };
    }
  }

  // ===== API КАТЕГОРИЙ =====

  getCategories() {
    return this.all("SELECT * FROM categories ORDER BY name");
  }

  addCategory(name) {
    try {
      const result = this.run("INSERT INTO categories (name) VALUES (?)", [name]);
      if (result.changes > 0) {
        return { success: true, id: result.lastInsertRowid };
      }
      return { success: false, error: "Категория уже существует" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  deleteCategory(id) {
    try {
      // Удаляем компоненты категории (благодаря CASCADE)
      this.run("DELETE FROM components WHERE category_id = ?", [id]);
      const result = this.run("DELETE FROM categories WHERE id = ?", [id]);
      return { success: result.changes > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ===== API КОМПОНЕНТОВ =====

  getComponents(categoryId = null) {
    if (categoryId) {
      return this.all(
        "SELECT * FROM components WHERE category_id = ? ORDER BY name", 
        [categoryId]
      );
    }
    return this.all("SELECT * FROM components ORDER BY name");
  }

  getComponent(id) {
    const component = this.get("SELECT * FROM components WHERE id = ?", [id]);
    if (component && component.parameters) {
      try {
        component.parameters = JSON.parse(component.parameters);
      } catch {
        component.parameters = {};
      }
    }
    return component;
  }

  addComponent(componentData) {
    try {
      const result = this.run(`
        INSERT INTO components 
        (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        componentData.category_id,
        componentData.name,
        componentData.storage_cell || null,
        componentData.datasheet_url || null,
        componentData.quantity || 0,
        componentData.updated_at || new Date().toISOString(),
        JSON.stringify(componentData.parameters || {}),
        componentData.image_data || null
      ]);

      if (result.changes > 0) {
        return { success: true, id: result.lastInsertRowid };
      }
      return { success: false, error: "Ошибка добавления компонента" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateComponent(componentData) {
    try {
      const result = this.run(`
        UPDATE components 
        SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, 
            quantity = ?, updated_at = ?, parameters = ?, image_data = ?
        WHERE id = ?
      `, [
        componentData.category_id,
        componentData.name,
        componentData.storage_cell || null,
        componentData.datasheet_url || null,
        componentData.quantity || 0,
        componentData.updated_at || new Date().toISOString(),
        JSON.stringify(componentData.parameters || {}),
        componentData.image_data || null,
        componentData.id
      ]);

      if (result.changes > 0) {
        return { success: true };
      }
      return { success: false, error: "Компонент не найден" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  deleteComponent(id) {
    try {
      const result = this.run("DELETE FROM components WHERE id = ?", [id]);
      return { success: result.changes > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ===== ПОИСК И ФИЛЬТРАЦИЯ =====

  searchComponents(query) {
    return this.all(`
      SELECT c.*, cat.name as category_name 
      FROM components c 
      LEFT JOIN categories cat ON c.category_id = cat.id 
      WHERE c.name LIKE ? OR c.storage_cell LIKE ? OR cat.name LIKE ?
      ORDER BY c.name
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);
  }

  getComponentsByStorage(cell) {
    return this.all(
      "SELECT * FROM components WHERE storage_cell = ? ORDER BY name",
      [cell]
    );
  }

  // ===== УТИЛИТЫ =====

  getDatabaseStats() {
    const categoryCount = this.get("SELECT COUNT(*) as count FROM categories").count;
    const componentCount = this.get("SELECT COUNT(*) as count FROM components").count;
    const totalQuantity = this.get("SELECT SUM(quantity) as total FROM components").total || 0;

    return {
      categoryCount,
      componentCount,
      totalQuantity,
      dbPath: this.dbPath
    };
  }

  checkDatabaseIntegrity() {
    try {
      const tables = this.all("SELECT name FROM sqlite_master WHERE type='table'");
      const componentCount = this.get("SELECT COUNT(*) as c FROM components").c;
      console.log("БД содержит таблицы:", tables.map(t => t.name), "Компонентов:", componentCount);
      return true;
    } catch (error) {
      console.error("Ошибка целостности:", error);
      return false;
    }
  }

  // ===== ЗАКРЫТИЕ =====

  close() {
    if (this.db) {
      this.db.close();
    }
  }

  updateCategory(id, name) {
    try {
      const result = this.run("UPDATE categories SET name = ? WHERE id = ?", [name, id]);
      if (result.changes > 0) {
        return { success: true };
      }
      return { success: false, error: "Категория не найдена" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// module.exports = ComponentsDatabase;
export default ComponentsDatabase;
