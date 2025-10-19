import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ComponentList from './components/ComponentList';
import ModalAddComponent from './components/ModalAddComponent'; // Импортируем модальное окно
import './styles/App.css';
import chipIcon from './assets/picto-chip.png';

function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);

  const handleComponentSelect = (component) => {
    setSelectedComponent(component);
  };

  const handleEditComponent = (component) => {
    console.log('Редактирование компонента:', component);
    setEditingComponent(component);
    setIsEditModalOpen(true);
  };

  const handleSaveComponent = async (componentData) => {
    try {
      console.log('💾 Saving component:', componentData);
      
      // Вызываем API для сохранения компонента
      const result = await window.api.database.updateComponent(componentData);
      
      if (result.success) {
        console.log('✅ Component updated successfully');
        
        // ОБНОВЛЯЕМ ВЫБРАННЫЙ КОМПОНЕНТ
        if (selectedComponent && selectedComponent.id === componentData.id) {
          setSelectedComponent(componentData);
        }
        
        return { success: true };
      } else {
        console.error('❌ Failed to update component:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error saving component:', error);
      throw error;
    }
  };
  

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingComponent(null);
  };

  // Функция для получения категорий (заглушка - нужно заменить на реальные данные)
  const getCategories = () => {
    // TODO: Заменить на реальное получение категорий из базы данных
    return [
      { id: 1, name: 'Транзисторы' },
      { id: 2, name: 'Резисторы' },
      { id: 3, name: 'Конденсаторы' },
      { id: 4, name: 'Микросхемы' },
      { id: 5, name: 'Диоды' }
    ];
  };

  return (
    <div className="app">
      <Sidebar
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        onComponentSelect={handleComponentSelect}
        onComponentUpdated={(updatedComponent) => {
          // Обновляем выбранный компонент, если он был отредактирован
          if (selectedComponent && selectedComponent.id === updatedComponent.id) {
            setSelectedComponent(updatedComponent);
          }
        }}
      />

      <main className="main-content">
        <div className="content-wrapper">
          {selectedComponent ? (
            <ComponentList
              category={selectedCategory}
              component={selectedComponent}
              onEdit={handleEditComponent}
            />
          ) : selectedCategory ? (
            <div className="welcome-message">
              <img src={chipIcon} alt="Микросхема" className="welcome-icon" />
              <h1>Выберите компонент из категории "{selectedCategory.name}"</h1>
              <p>или создайте новый компонент</p>
              <div className="divider"></div>
            </div>
          ) : (
            <div className="welcome-message">
              <img src={chipIcon} alt="Микросхема" className="welcome-icon" />
              <h1>Выберите компонент для просмотра</h1>
              <p>или создайте новый компонент</p>
              <div className="divider"></div>
            </div>
          )}
        </div>
      </main>

      {/* Модальное окно редактирования компонента */}
      <ModalAddComponent
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveComponent}
        categories={getCategories()}
        editMode={true}
        componentData={editingComponent}
      />
    </div>
  );
}

export default App;
