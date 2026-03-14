import fs from 'fs';

export const dbUtils = {
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
  },

  getDatabaseStats(db) {
    const categoryCount = db.get("SELECT COUNT(*) as count FROM categories")?.count || 0;
    const componentCount = db.get("SELECT COUNT(*) as count FROM components")?.count || 0;
    const totalQuantity = db.get("SELECT SUM(quantity) as total FROM components")?.total || 0;

    return {
      categoryCount,
      componentCount,
      totalQuantity,
      dbPath: db.dbPath,
      lastUpdated: new Date().toISOString()
    };
  },

  checkTableStructure(db) {
    try {
      const tableInfo = db.all("PRAGMA table_info(components)");
      console.log('📊 Table structure:', tableInfo);

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
  },

  checkDatabaseIntegrity(db) {
    try {
      const integrityCheck = db.all("PRAGMA integrity_check");
      const tables = db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
      const componentCount = db.get("SELECT COUNT(*) as c FROM components")?.c || 0;

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
  },

  optimize(db) {
    try {
      db.db.exec('PRAGMA optimize');
      db.saveToFile();
      console.log('✅ Database optimized');
    } catch (error) {
      console.error('❌ Database optimization error:', error);
    }
  },

  backup(db) {
    try {
      const backupPath = db.dbPath + '.backup_' + Date.now();
      const data = db.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(backupPath, buffer);
      console.log('✅ Database backup created:', backupPath);
      return backupPath;
    } catch (error) {
      console.error('❌ Database backup error:', error);
      return null;
    }
  },

  close(db) {
    if (db.db) {
      this.optimize(db);
      db.db.close();
      console.log('✅ Database closed');
    }
  }
};
