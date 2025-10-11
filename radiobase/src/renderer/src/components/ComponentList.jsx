import React from 'react';
import '../styles/ComponentList.css';

const ComponentList = ({ category, component }) => {
  return (
    <div className="component-list">
      <div className="component-list__header">
        <h1 className="component-list__title">Компонент: {component}</h1>
        <p className="component-list__category-path">Категория: {category}</p>
      </div>
      
      <div className="component-list__details">
        <div className="component-list__detail-card">
          <h3 className="component-list__detail-title">Характеристики</h3>
          <p>Здесь будет подробная информация о компоненте {component}</p>
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
