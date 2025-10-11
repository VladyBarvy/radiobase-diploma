import React, { useState } from 'react';
import '../styles/Sidebar.css';

// Импортируем иконку папки (предполагая, что она сохранена в папке assets)
import folderIcon from '../assets/picto-directory.jpg';
import addCategoryIcon from '../assets/picto-dir-plus.jpg';
import addComponentIcon from '../assets/picto-comp-plus.jpg';

const Sidebar = ({ selectedCategory, onCategorySelect, onComponentSelect }) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const categoriesData = {
    'Диоды': ['Диод 1N4148', 'Светодиод красный', 'Стабилитрон 5.1V', 'Диод Шоттки'],
    'Конденсаторы': ['Конденсатор 100мкФ', 'Конденсатор 10нФ', 'Электролитический 47мкФ'],
    'Микросхемы': ['ATMega328', 'ESP32', 'LM358', 'NE555', 'ULN2003'],
    'Резисторы': ['Резистор 100 Ом', 'Резистор 1 кОм', 'Резистор 10 кОм'],
    'Транзисторы': ['BC547', '2N2222', 'IRF540', 'KT315']
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleComponentSelect = (category, component) => {
    console.log(`Выбран компонент: ${component} из категории: ${category}`);
    if (onComponentSelect) {
      onComponentSelect(component);
    }
  };

  const handleAddCategory = () => {
    console.log('Добавить новую категорию');
    // Логика добавления новой категории
  };

  const handleAddComponent = () => {
    console.log('Добавить новый компонент');
    // Логика добавления нового компонента
  };

  return (
    <aside className="sidebar">
      {/* Заголовок с кнопками */}
      <div className="sidebar__header">
        <div className="sidebar__title-wrapper">
          <h2 className="sidebar__title">Каталог</h2>
          <h2 className="sidebar__title">компонентов</h2>
        </div>
        <div className="sidebar__actions">
          <button
            className="sidebar__action-btn"
            onClick={handleAddCategory}
            title="Добавить категорию"
          >
            <img src={addCategoryIcon} alt="Добавить категорию" />
          </button>
          <button
            className="sidebar__action-btn"
            onClick={handleAddComponent}
            title="Добавить компонент"
          >
            <img src={addComponentIcon} alt="Добавить компонент" />
          </button>
        </div>
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__category-list">
          {Object.keys(categoriesData).map((category) => (
            <li key={category} className="sidebar__category-item">
              <div className="sidebar__category-header">
                <button
                  className={`sidebar__category-button ${selectedCategory === category ? 'sidebar__category-button--active' : ''
                    }`}
                  onClick={() => toggleCategory(category)}
                >
                  <div className="sidebar__category-content">
                    <img
                      src={folderIcon}
                      alt="Папка"
                      className="sidebar__folder-icon"
                    />
                    <span className="sidebar__category-name">{category}</span>
                  </div>
                  <span className={`sidebar__triangle ${expandedCategories[category] ? 'sidebar__triangle--expanded' : ''
                    }`}>
                    ▼
                  </span>
                </button>
              </div>

              {expandedCategories[category] && (
                <ul className="sidebar__components-list">
                  {categoriesData[category]
                    .sort()
                    .map((component, index) => (
                      <li key={index} className="sidebar__component-item">
                        <button
                          className="sidebar__component-button"
                          onClick={() => handleComponentSelect(category, component)}
                        >
                          {component}
                        </button>
                      </li>
                    ))
                  }
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
