import React from 'react';
import '../styles/SearchResults.css';

const SearchResults = ({ searchResults, searchQuery, onComponentSelect, onEdit }) => {
  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="search-results">
        <div className="search-results-header">
          <h2>Результаты поиска</h2>
          <p className="search-query">По запросу: "{searchQuery}"</p>
        </div>
        <div className="no-results">
          <i className="fas fa-search fa-3x mb-3"></i>
          <h4>Ничего не найдено</h4>
          <p>Попробуйте изменить поисковый запрос</p>
        </div>
      </div>
    );
  }

  const handleComponentClick = (component) => {
    if (onComponentSelect) {
      onComponentSelect(component);
    }
  };

  const handleEditClick = (component, e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(component);
    }
  };

  return (
    <div className="search-results">
      <div className="search-results-header">
        <h2>Результаты поиска</h2>
        <p className="search-query">По запросу: "{searchQuery}"</p>
        <p className="results-count">Найдено: {searchResults.length} компонентов</p>
      </div>

      <div className="search-results-list">
        {searchResults.map((component) => (
          <div
            key={component.id}
            className="search-result-item"
            onClick={() => handleComponentClick(component)}
          >
            <div className="result-item-content">
              <div className="result-item-main">
                <h3 className="result-item-name">{component.name}</h3>
                <p className="result-item-category">{component.category_name}</p>
                {component.storage_cell && (
                  <p className="result-item-storage">Ячейка: {component.storage_cell}</p>
                )}
                {component.description && (
                  <p className="result-item-description">{component.description}</p>
                )}
              </div>
              <div className="result-item-meta">
                <span className="result-item-quantity">Количество: {component.quantity || 0}</span>
                <button
                  className="btn-edit-result"
                  onClick={(e) => handleEditClick(component, e)}
                  title="Редактировать компонент"
                >
                  <i className="fas fa-edit"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
