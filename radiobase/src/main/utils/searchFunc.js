// Экранировка спецсимволов для LIKE запроса
function escapeLike(str) {
  return str.replace(/[%_\\]/g, '\\$&');
}

// Фильтр компонентов по параметрам
function filterByParameters(components, searchTermLower) {
  return components.filter(component => {
    if (!component.parameters) return false;

    try {
      const parameters = typeof component.parameters === 'string'
        ? JSON.parse(component.parameters)
        : component.parameters;

      return Object.entries(parameters).some(([key, value]) => {
        const keyMatch = key.toLowerCase().includes(searchTermLower);
        const valueMatch = String(value).toLowerCase().includes(searchTermLower);
        return keyMatch || valueMatch;
      });
    } catch (error) {
      console.error('❌ Error parsing parameters for search:', error);
      return false;
    }
  });
}

/**
 * Поиск компонентов по тексту
 */
export function searchComponents(db, query) {
  if (!query?.trim()) return [];

  const searchTerm = query.trim();
  const searchTermLower = searchTerm.toLowerCase();

  console.log(`🔍 Searching for: "${searchTerm}"`);

  const likeTerm = `%${escapeLike(searchTerm)}%`;

  // ШАГ 1: SQL поиск по основным полям
  const sqlResults = db.all(`
    SELECT 
      c.*, 
      cat.name as category_name 
    FROM components c 
    LEFT JOIN categories cat ON c.category_id = cat.id 
    WHERE 
      c.name LIKE ? ESCAPE '\\' OR
      c.storage_cell LIKE ? ESCAPE '\\' OR
      c.description LIKE ? ESCAPE '\\' OR
      cat.name LIKE ? ESCAPE '\\'
    ORDER BY 
      CASE 
        WHEN c.name LIKE ? ESCAPE '\\' THEN 1
        WHEN cat.name LIKE ? ESCAPE '\\' THEN 2
        ELSE 3
      END,
      c.name
  `, [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm]);

  // Если ничего не найдено - проверяем все компоненты по параметрам
  if (sqlResults.length === 0) {
    const allComponents = db.all(`
      SELECT 
        c.*, 
        cat.name as category_name 
      FROM components c 
      LEFT JOIN categories cat ON c.category_id = cat.id 
      ORDER BY c.name
    `);

    const paramResults = filterByParameters(allComponents, searchTermLower);
    console.log(`🔍 Found ${paramResults.length} results (all from parameters)`);
    return paramResults;
  }

  // ШАГ 2: Проверяем остальные компоненты по параметрам
  const placeholders = sqlResults.map(() => '?').join(',');
  const additionalComponents = db.all(`
    SELECT 
      c.*, 
      cat.name as category_name 
    FROM components c 
    LEFT JOIN categories cat ON c.category_id = cat.id 
    WHERE c.id NOT IN (${placeholders})
    ORDER BY c.name
  `, sqlResults.map(c => c.id));

  const paramMatchedComponents = filterByParameters(additionalComponents, searchTermLower);
  const finalResults = [...sqlResults, ...paramMatchedComponents];

  console.log(`🔍 Found ${finalResults.length} results (${sqlResults.length} from SQL, ${paramMatchedComponents.length} from parameters)`);

  return finalResults;
}
