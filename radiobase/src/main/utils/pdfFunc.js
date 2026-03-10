const fs = require('fs');
const path = require('path');

/**
 * Сохраняет PDF файл в папку datasheets и возвращает путь к файлу
 * @param {Buffer|Uint8Array} pdfData - Бинарные данные PDF
 * @param {string} filename - Оригинальное имя файла
 * @param {number} componentId - ID компонента (для уникальности)
 * @param {string} datasheetsDir - Путь к папке для сохранения PDF
 * @returns {Object} Результат сохранения
 */
export function savePdfToFile(pdfData, filename, componentId, datasheetsDir) {
  try {
    if (!pdfData || !filename || !componentId || !datasheetsDir) {
      return { success: false, error: "Missing required parameters" };
    }

    // Валидация componentId
    const numericId = Number(componentId);
    if (!Number.isInteger(numericId) || numericId < 0) {
      return { success: false, error: "Invalid component ID: must be a positive integer" };
    }

    // Создаем безопасное имя файла
    const safeName = filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
    const filePath = path.join(datasheetsDir, `${componentId}_${safeName}`);

    // Сохраняем файл
    fs.writeFileSync(filePath, Buffer.from(pdfData));

    console.log('💾 PDF saved to file:', filePath);

    return {
      success: true,
      filePath: filePath, // Полный путь
      relativePath: path.relative(path.dirname(datasheetsDir), filePath) // Относительный путь
    };
  } catch (error) {
    console.error('❌ Error saving PDF file:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Удаляет файл PDF из папки datasheets
 * @param {string} filePath - Полный путь к файлу
 * @returns {Object} Результат удаления
 */
export function removePdfFile(filePath) {
  try {
    if (!filePath) return { success: false, error: "No file path provided" };

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

/**
 * Читает PDF файл и возвращает его как Buffer
 * @param {string} filePath - Полный путь к файлу
 * @returns {Object} Результат чтения
 */
export function getPdfFile(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: "File not found" };
    }

    const data = fs.readFileSync(filePath);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error reading PDF file:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Проверяет существование PDF файла
 * @param {string} filePath - Полный путь к файлу
 * @returns {boolean} - Существует ли файл
 */
export function pdfFileExists(filePath) {
  return !!(filePath && fs.existsSync(filePath));
}
