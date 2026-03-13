// main/utils/categoryFunc.js

class CategoryFunctions {
  constructor(database) {
    this.dbInstance = database;
  }

  // ===== API КАТЕГОРИЙ =====

  getCategories() {
    return this.dbInstance.all("SELECT * FROM categories ORDER BY name");
  }

  addCategory(name) {
    if (!name || !name.trim()) {
      return { success: false, error: "Название категории не может быть пустым" };
    }

    const result = this.dbInstance.run("INSERT INTO categories (name) VALUES (?)", [name.trim()]);

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

    const result = this.dbInstance.run("UPDATE categories SET name = ? WHERE id = ?", [name.trim(), id]);

    if (result.success && result.changes > 0) {
      return { success: true };
    }

    return {
      success: false,
      error: result.changes === 0 ? "Категория не найдена" : "Ошибка обновления категории"
    };
  }

  deleteCategory(id) {
    const result = this.dbInstance.run("DELETE FROM categories WHERE id = ?", [id]);
    return {
      success: result.success && result.changes > 0,
      error: result.success && result.changes === 0 ? "Категория не найдена" : null
    };
  }
}

export default CategoryFunctions;
