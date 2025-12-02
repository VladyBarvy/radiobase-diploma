// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import ModalAddCategory from './ModalAddCategory.jsx';
import ContextMenu from './ContextMenu.jsx';
import ConfirmationDialog from './ConfirmationDialog.jsx';
import ModalAddComponent from './ModalAddComponent.jsx';
import ContextMenuComponent from './ContextMenuComponent.jsx';
import SearchResults from './SearchResults.jsx';
import '../styles/Sidebar.css';

// Импортируем иконки
import folderIcon from '../assets/picto-directory.jpg';
import addCategoryIcon from '../assets/picto-dir-plus.jpg';
import addComponentIcon from '../assets/picto-comp-plus.jpg';
import pictoComponentIcon from '../assets/picto-elem.jpg';

const Sidebar = ({ selectedCategory, onCategorySelect, onComponentSelect, onComponentUpdated, onSearch }) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categories, setCategories] = useState([]);
  const [components, setComponents] = useState({});
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // Состояния для контекстного меню
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    category: null
  });

  // Состояния для диалога подтверждения
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    category: null
  });

  // Состояния для редактирования категории
  const [editModal, setEditModal] = useState({
    isOpen: false,
    category: null
  });

  // Загружаем категории при монтировании компонента
  useEffect(() => {
    loadCategories();
  }, []);

  // Загружаем категории из базы данных
  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await window.api.database.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('❌ Ошибка загрузки категорий:', error);
      alert('Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  };

  // Загружаем компоненты для конкретной категории
  const loadComponents = async (categoryId) => {
    try {
      const componentsData = await window.api.database.getComponents(categoryId);
      setComponents(prev => ({
        ...prev,
        [categoryId]: componentsData
      }));
    } catch (error) {
      console.error('❌ Ошибка загрузки компонентов:', error);
    }
  };

  const toggleCategory = async (category) => {
    const isExpanding = !expandedCategories[category.id];

    setExpandedCategories(prev => ({
      ...prev,
      [category.id]: isExpanding
    }));

    // Загружаем компоненты при первом раскрытии категории
    if (isExpanding && !components[category.id]) {
      await loadComponents(category.id);
    }
  };

  const handleComponentSelect = (component) => {
    console.log('Выбран компонент:', component);
    if (onComponentSelect) {
      onComponentSelect(component);
    }
  };

  // Обработчик правого клика на категорию
  const handleCategoryContextMenu = (e, category) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      category: category
    });
  };

  // Закрытие контекстного меню
  const handleCloseContextMenu = () => {
    setContextMenu({
      isOpen: false,
      x: 0,
      y: 0,
      category: null
    });
  };

  // Обработчик переименования категории
  const handleRenameCategory = () => {
    if (contextMenu.category) {
      setEditModal({
        isOpen: true,
        category: contextMenu.category
      });
    }
  };

  // Обработчик удаления категории
  const handleDeleteCategory = () => {
    if (contextMenu.category) {
      setConfirmationDialog({
        isOpen: true,
        category: contextMenu.category
      });
    }
  };

  // Подтверждение удаления категории
  const handleConfirmDelete = async () => {
    if (confirmationDialog.category) {
      try {
        const result = await window.api.database.deleteCategory(confirmationDialog.category.id);
        if (result.success) {
          console.log('✅ Категория удалена:', confirmationDialog.category.id);
          await loadCategories(); // Перезагружаем список категорий

          // Если удаленная категория была выбрана, сбрасываем выбор
          if (selectedCategory?.id === confirmationDialog.category.id) {
            onCategorySelect(null);
          }
        } else {
          alert(`❌ Ошибка: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ Ошибка удаления категории:', error);
        alert('Не удалось удалить категорию');
      }
    }
  };

  // Сохранение переименованной категории
  const handleSaveRenamedCategory = async (newName) => {
    if (editModal.category) {
      try {
        const result = await window.api.database.updateCategory(editModal.category.id, newName);
        if (result.success) {
          console.log('✅ Категория переименована');
          await loadCategories();
          setEditModal({ isOpen: false, category: null });
        } else {
          alert(`❌ Ошибка: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ Ошибка переименования категории:', error);
        alert('Не удалось переименовать категорию');
      }
    }
  };

  // Функции для добавления категории (существующие)
  const handleAddCategory = () => {
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (categoryName) => {
    try {
      const result = await window.api.database.addCategory(categoryName.trim());
      if (result.success) {
        console.log('✅ Категория добавлена:', result.id);
        await loadCategories();
        setIsModalOpen(false);
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Ошибка добавления категории:', error);
      alert('Не удалось добавить категорию');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };




  const handleAddComponent = () => {
    setIsComponentModalOpen(true);
  };


  const handleSaveComponent = async (componentData) => {
    try {
      const result = await window.api.database.addComponent(componentData);
      if (result.success) {
        console.log('✅ Компонент добавлен:', result.id);

        // Безопасная проверка: перезагружаем компоненты только если категория выбрана и совпадает
        if (selectedCategory?.id === componentData.category_id) {
          await loadComponents(componentData.category_id);
        }

        // Всегда перезагружаем категории для обновления счетчиков
        await loadCategories();

        // ВЫЗОВ НОВОГО ПРОПСА - УВЕДОМЛЕНИЕ О СОЗДАНИИ НОВОГО КОМПОНЕНТА
        if (onComponentUpdated && result.id) {
          const newComponent = await window.api.database.getComponent(result.id);
          onComponentUpdated(newComponent);
        }

      } else {
        alert(`❌ Ошибка: ${result.error}`);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Ошибка добавления компонента:', error);
      throw error;
    }
  };


  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const [componentContextMenu, setComponentContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    component: null
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    component: null
  });

  const [editComponentModal, setEditComponentModal] = useState({
    isOpen: false,
    component: null
  });

  // Функции для работы с контекстным меню компонентов
  const handleComponentContextMenu = (e, component) => {
    e.preventDefault();
    e.stopPropagation();

    setComponentContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      component: component
    });
  };

  const handleCloseComponentContextMenu = () => {
    setComponentContextMenu({
      isOpen: false,
      x: 0,
      y: 0,
      component: null
    });
  };

  const handleEditComponent = () => {
    if (componentContextMenu.component) {
      setEditComponentModal({
        isOpen: true,
        component: componentContextMenu.component
      });
    }
  };

  const handleDeleteComponent = () => {
    if (componentContextMenu.component) {
      setDeleteConfirmation({
        isOpen: true,
        component: componentContextMenu.component
      });
    }
  };


  const handleConfirmDeleteComponent = async () => {
    if (deleteConfirmation.component) {
      try {
        const result = await window.api.database.deleteComponent(deleteConfirmation.component.id);
        if (result.success) {
          console.log('✅ Компонент удален:', deleteConfirmation.component.id);

          // Перезагружаем компоненты текущей категории
          if (selectedCategory) {
            await loadComponents(selectedCategory.id);
          }

          // Сбрасываем выбор компонента через onComponentSelect
          if (onComponentSelect) {
            onComponentSelect(null);
          }

          // ВЫЗОВ НОВОГО ПРОПСА - УВЕДОМЛЕНИЕ ОБ УДАЛЕНИИ
          if (onComponentUpdated) {
            onComponentUpdated(null); // Передаем null, так как компонент удален
          }
        } else {
          alert(`❌ Ошибка: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ Ошибка удаления компонента:', error);
        alert('Не удалось удалить компонент');
      }
    }

    setDeleteConfirmation({ isOpen: false, component: null });
  };


  // const handleUpdateComponent = async (componentData) => {
  //   try {
  //     console.log('🔄 Updating component:', componentData);

  //     const result = await window.api.database.updateComponent(componentData);
  //     if (result.success) {
  //       console.log('✅ Компонент обновлен:', componentData.id);

  //       // Перезагружаем компоненты текущей категории
  //       if (selectedCategory) {
  //         await loadComponents(selectedCategory.id);
  //       }

  //       // Обновляем выбранный компонент
  //       if (onComponentSelect) {
  //         const updatedComponent = await window.api.database.getComponent(componentData.id);
  //         onComponentSelect(updatedComponent);
  //       }

  //       // Уведомляем родительский компонент об обновлении
  //       if (onComponentUpdated) {
  //         const updatedComponent = await window.api.database.getComponent(componentData.id);
  //         onComponentUpdated(updatedComponent);
  //       }

  //       return { success: true };
  //     } else {
  //       alert(`❌ Ошибка: ${result.error}`);
  //       throw new Error(result.error);
  //     }
  //   } catch (error) {
  //     console.error('❌ Ошибка обновления компонента:', error);
  //     throw error;
  //   }
  // };



  const handleUpdateComponent = async (componentData) => {
  try {
    const result = await window.api.database.updateComponent(componentData);
    if (result.success) {
      console.log('✅ Component updated');
      
      // ТОЛЬКО ОДИН вызов для обновления
      if (onComponentUpdated) {
        // Просто уведомляем, что компонент обновлен
        onComponentUpdated({ id: componentData.id });
      }
      
      // Не вызываем onComponentSelect - пусть App сам решает
      return { success: true };
    }
  } catch (error) {
    console.error('❌ Error updating component:', error);
    throw error;
  }
};





  // Функция для выполнения поиска
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (onSearch) {
      await onSearch(searchQuery);
    }
  };

  // Обработчик нажатия Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Функция для сброса поиска (если нужна кнопка очистки)
  const handleClearSearch = () => {
    setSearchQuery('');
    // Если нужен сброс результатов в App, можно вызвать onSearch('')
    if (onSearch) {
      onSearch('');
    }
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
            disabled={loading}
          >
            <img src={addCategoryIcon} alt="Добавить категорию" />
          </button>
          <button
            className="sidebar__action-btn"
            onClick={handleAddComponent}
            title="Добавить компонент"
          // disabled={!selectedCategory || loading}
          >
            <img src={addComponentIcon} alt="Добавить компонент" />
          </button>
        </div>
      </div>



      {/* Форма поиска */}
      <div className="sidebar__search">
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск компонентов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <div className="search-buttons-container">
            <button
              className="search-btn"
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
            >
              <span>Поиск</span>
            </button>
            <button
              className="clear-search-btn"
              onClick={handleClearSearch}
              disabled={!searchQuery}
            >
              <span>Сброс</span>
            </button>
          </div>
        </div>
      </div>




      {/* Модальное окно добавления категории */}
      <ModalAddCategory
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
      />

      {/* Модальное окно редактирования категории */}
      <ModalAddCategory
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, category: null })}
        onSave={handleSaveRenamedCategory}
        editMode={true}
        initialName={editModal.category?.name || ''}
      />

      <ModalAddComponent
        isOpen={isComponentModalOpen}
        onClose={() => setIsComponentModalOpen(false)}
        onSave={handleSaveComponent}
        categories={categories}
        selectedCategory={selectedCategory}
      />

      {/* Контекстное меню */}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={handleCloseContextMenu}
        onRename={handleRenameCategory}
        onDelete={handleDeleteCategory}
      />

      {/* Диалог подтверждения удаления */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ isOpen: false, category: null })}
        onConfirm={handleConfirmDelete}
        title="Удалить категорию"
        message={`Вы уверены, что хотите удалить категорию "${confirmationDialog.category?.name}"? Все компоненты в этой категории также будут удалены.`}
      />

      {/* Контекстное меню для компонентов */}
      <ContextMenuComponent
        x={componentContextMenu.x}
        y={componentContextMenu.y}
        isOpen={componentContextMenu.isOpen}
        onClose={handleCloseComponentContextMenu}
        onEdit={handleEditComponent}
        onDelete={handleDeleteComponent}
      />

      {/* Диалог подтверждения удаления компонента */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, component: null })}
        onConfirm={handleConfirmDeleteComponent}
        title="Удалить компонент"
        message={`Вы уверены, что хотите удалить компонент "${deleteConfirmation.component?.name}"?`}
      />

      {/* Модальное окно редактирования компонента */}
      <ModalAddComponent
        isOpen={editComponentModal.isOpen}
        onClose={() => setEditComponentModal({ isOpen: false, component: null })}
        onSave={handleUpdateComponent}
        categories={categories} // Передаем актуальный список категорий
        selectedCategory={selectedCategory}
        editMode={true}
        componentData={editComponentModal.component}
      />

      <nav className="sidebar__nav">
        {loading ? (
          <div className="sidebar__loading">Загрузка...</div>
        ) : (
          <ul className="sidebar__category-list">
            {categories.map((category) => (
              <li key={category.id} className="sidebar__category-item">
                <div className="sidebar__category-header">
                  <button
                    className={`sidebar__category-button ${selectedCategory?.id === category.id ? 'sidebar__category-button--active' : ''
                      }`}
                    onClick={() => {
                      toggleCategory(category);
                      handleCategoryClick(category);
                    }}
                    onContextMenu={(e) => handleCategoryContextMenu(e, category)}
                  >
                    <div className="sidebar__category-content">
                      <img
                        src={folderIcon}
                        alt="Папка"
                        className="sidebar__folder-icon"
                      />
                      <span className="sidebar__category-name">{category.name}</span>
                    </div>
                    <span className={`sidebar__triangle ${expandedCategories[category.id] ? 'sidebar__triangle--expanded' : ''
                      }`}>
                      ▼
                    </span>
                  </button>
                </div>

                {expandedCategories[category.id] && components[category.id] && (
                  <ul className="sidebar__components-list">






                    {components[category.id]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((component) => (
                        <li key={component.id} className="sidebar__component-item">
                          <div className="sidebar__component-wrapper">
                            <button
                              className="sidebar__component-button"
                              onClick={() => handleComponentSelect(component)}
                              title={`Количество: ${component.quantity || 0}`}
                            >

                              <img
                                src={pictoComponentIcon}
                                alt="Компонент"
                                className="sidebar__component-icon"
                              />
                              <span className="sidebar__component-name">{component.name}</span>
                            </button>
                            <button
                              className="sidebar__component-menu-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComponentContextMenu(e, component);
                              }}
                              title="Действия с компонентом"
                            >
                              ⋮
                            </button>
                          </div>
                        </li>
                      ))
                    }




                    {components[category.id]?.length === 0 && (
                      <li className="sidebar__component-item">
                        <div className="sidebar__component-empty">
                          Нет компонентов
                        </div>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}

        {!loading && categories.length === 0 && (
          <div className="sidebar__empty">
            Категории не найдены
          </div>
        )}
      </nav>



    </aside>
  );
};

export default Sidebar;
