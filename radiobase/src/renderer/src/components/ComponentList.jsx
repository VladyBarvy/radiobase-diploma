// import React from 'react';
// import '../styles/ComponentList.css';

// const ComponentList = ({ category, component }) => {
//   return (
//     <div className="component-list">
//       <div className="component-list__header">
//         <h1 className="component-list__title">Компонент: {component}</h1>
//         <p className="component-list__category-path">Категория: {category}</p>
//       </div>
      
//       <div className="component-list__details">
//         <div className="component-list__detail-card">
//           <h3 className="component-list__detail-title">Характеристики</h3>
//           <p>Здесь будет подробная информация о компоненте {component}</p>
//         </div>
        
//         <div className="component-list__detail-card">
//           <h3 className="component-list__detail-title">Описание</h3>
//           <p>Описание компонента и его применение</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComponentList;












import React from 'react';
import '../styles/ComponentList.css';

const ComponentList = ({ category, component }) => {
  // Безопасно извлекаем имена из объектов
  const componentName = component?.name || component;
  const categoryName = category?.name || category;

  return (
    <div className="component-list">
      <div className="component-list__header">
        {/* Исправлено: componentName вместо component */}
        <h1 className="component-list__title">Компонент: {componentName}</h1>
        {/* Исправлено: categoryName вместо category */}
        <p className="component-list__category-path">Категория: {categoryName}</p>
      </div>
      
      <div className="component-list__details">
        <div className="component-list__detail-card">
          <h3 className="component-list__detail-title">Характеристики</h3>
          {/* Добавлено отображение реальных данных компонента */}
          {component && typeof component === 'object' ? (
            <div>
              <p><strong>ID:</strong> {component.id}</p>
              <p><strong>Название:</strong> {component.name}</p>
              {component.storage_cell && (
                <p><strong>Ячейка хранения:</strong> {component.storage_cell}</p>
              )}
              {component.quantity !== undefined && (
                <p><strong>Количество:</strong> {component.quantity}</p>
              )}
              {component.datasheet_url && (
                <p><strong>Даташит:</strong> <a href={component.datasheet_url} target="_blank" rel="noopener noreferrer">Ссылка</a></p>
              )}
              {component.parameters && Object.keys(component.parameters).length > 0 && (
                <div>
                  <strong>Параметры:</strong>
                  <pre>{JSON.stringify(component.parameters, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <p>Здесь будет подробная информация о компоненте {componentName}</p>
          )}
        </div>
        
        <div className="component-list__detail-card">
          <h3 className="component-list__detail-title">Описание</h3>
          <p>Описание компонента и его применение</p>
        </div>
      </div>
    </div>
  );
};

export default ComponentList;
