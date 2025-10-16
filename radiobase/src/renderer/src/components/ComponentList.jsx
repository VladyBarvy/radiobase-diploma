// import React from 'react';
// import '../styles/ComponentList.css';

// const ComponentList = ({ category, component }) => {
//   // Безопасно извлекаем имена из объектов
//   const componentName = component?.name || component;
//   const categoryName = category?.name || category;

//   return (
//     <div className="component-list">
//       <div className="component-list__header">
//         {/* Исправлено: componentName вместо component */}
//         <h1 className="component-list__title">Компонент: {componentName}</h1>
//         {/* Исправлено: categoryName вместо category */}
//         <p className="component-list__category-path">Категория: {categoryName}</p>
//       </div>

//       <div className="component-list__details">
//         <div className="component-list__detail-card">
//           <h3 className="component-list__detail-title">Характеристики</h3>
//           {/* Добавлено отображение реальных данных компонента */}
//           {component && typeof component === 'object' ? (
//             <div>
//               <p><strong>ID:</strong> {component.id}</p>
//               <p><strong>Название:</strong> {component.name}</p>
//               {component.storage_cell && (
//                 <p><strong>Ячейка хранения:</strong> {component.storage_cell}</p>
//               )}
//               {component.quantity !== undefined && (
//                 <p><strong>Количество:</strong> {component.quantity}</p>
//               )}
//               {component.datasheet_url && (
//                 <p><strong>Даташит:</strong> <a href={component.datasheet_url} target="_blank" rel="noopener noreferrer">Ссылка</a></p>
//               )}
//               {component.parameters && Object.keys(component.parameters).length > 0 && (
//                 <div>
//                   <strong>Параметры:</strong>
//                   <pre>{JSON.stringify(component.parameters, null, 2)}</pre>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <p>Здесь будет подробная информация о компоненте {componentName}</p>
//           )}
//         </div>

//         <div className="component-list__detail-card">
//           <h3 className="component-list__detail-title">Описание</h3>
//           {component && component.description ? (
//             <p>{component.description}</p>
//           ) : (
//             <p>Описание компонента и его применение</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComponentList;







































// import React from 'react';
// import '../styles/ComponentList.css';

// const ComponentList = ({ category, component }) => {
//   // Безопасно извлекаем имена из объектов
//   const componentName = component?.name || component;
//   const categoryName = category?.name || category;

//   // Функция для форматирования даты
//   const formatDate = (dateString) => {
//     if (!dateString) return 'Не указано';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('ru-RU', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   // Функция для рендеринга параметров в виде таблицы
//   const renderParameters = (parameters) => {
//     if (!parameters || typeof parameters !== 'object') {
//       return <p>Параметры не указаны</p>;
//     }

//     const paramEntries = Object.entries(parameters);

//     if (paramEntries.length === 0) {
//       return <p>Параметры не указаны</p>;
//     }

//     return (
//       <div className="parameters-table">
//         <table className="parameters-table__table">
//           <tbody>
//             {paramEntries.map(([key, value], index) => (
//               <tr key={index} className="parameters-table__row">
//                 <td className="parameters-table__param-name">
//                   <strong>{key}</strong>
//                 </td>
//                 <td className="parameters-table__param-value">
//                   {value}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   return (
//     <div className="component-list">
//       <div className="component-list__header">
//         <h1 className="component-list__title">{componentName}</h1>
//         <p className="component-list__category-path">Категория: {categoryName}</p>
//       </div>

//       <div className="component-list__details">
//         {/* Основная информация */}
//         <div className="component-list__detail-card">
//           <h3 className="component-list__detail-title">Основная информация</h3>
//           {component && typeof component === 'object' ? (
//             <div className="component-info">
//               <div className="info-row">
//                 <span className="info-label">ID:</span>
//                 <span className="info-value">{component.id}</span>
//               </div>
//               <div className="info-row">
//                 <span className="info-label">Название:</span>
//                 <span className="info-value">{component.name}</span>
//               </div>
//               {component.storage_cell && (
//                 <div className="info-row">
//                   <span className="info-label">Ячейка хранения:</span>
//                   <span className="info-value">{component.storage_cell}</span>
//                 </div>
//               )}
//               {component.quantity !== undefined && (
//                 <div className="info-row">
//                   <span className="info-label">Количество:</span>
//                   <span className="info-value">{component.quantity} шт.</span>
//                 </div>
//               )}
//               {component.datasheet_url && (
//                 <div className="info-row">
//                   <span className="info-label">Datasheet:</span>
//                   <span className="info-value">
//                     <a href={component.datasheet_url} target="_blank" rel="noopener noreferrer">
//                       Открыть
//                     </a>
//                   </span>
//                 </div>
//               )}
//               {component.updated_at && (
//                 <div className="info-row">
//                   <span className="info-label">Обновлён:</span>
//                   <span className="info-value">{formatDate(component.updated_at)}</span>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <p>Здесь будет подробная информация о компоненте {componentName}</p>
//           )}
//         </div>

//         {/* Описание */}
//         <div className="component-list__detail-card">
//           <h3 className="component-list__detail-title">Описание</h3>
//           {component && component.description ? (
//             <div className="component-description">
//               <p>{component.description}</p>
//             </div>
//           ) : (
//             <p>Описание компонента и его применение</p>
//           )}
//         </div>

//         {/* Параметры */}
//         <div className="component-list__detail-card">
//           <h3 className="component-list__detail-title">Параметры</h3>
//           {component && component.parameters ? (
//             renderParameters(component.parameters)
//           ) : (
//             <p>Параметры не указаны</p>
//           )}
//         </div>

//         {/* Изображение (если есть) */}
//         {component && component.image_data && (
//           <div className="component-list__detail-card">
//             <h3 className="component-list__detail-title">Изображение</h3>
//             <div className="component-image">
//               <img 
//                 src={component.image_data} 
//                 alt={component.name}
//                 className="component-image__img"
//               />
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ComponentList;















































// import React from 'react';
// import '../styles/ComponentList.css';

// const ComponentList = ({ category, component }) => {
//   // Если компонент не выбран, показываем placeholder как в образце
//   if (!component || typeof component !== 'object') {
//     return (
//       <div className="component-view">
//         <div className="text-center text-muted mt-5">
//           <i className="fas fa-microchip fa-3x mb-3"></i>
//           <h4>Выберите компонент для просмотра</h4>
//           <p>или создайте новый компонент</p>
//         </div>
//       </div>
//     );
//   }

//   const componentName = component.name;
//   const categoryName = category?.name || 'Неизвестно';

//   // Функция для форматирования даты
//   const formatDate = (dateString) => {
//     if (!dateString) return 'Не обновлялся';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('ru-RU', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   // Функция для безопасного парсинга параметров
//   const getParametersObject = (parameters) => {
//     if (!parameters) return {};
//     if (typeof parameters === 'string') {
//       try {
//         return JSON.parse(parameters);
//       } catch {
//         return {};
//       }
//     }
//     return parameters;
//   };

//   const parameters = getParametersObject(component.parameters);

//   return (
//     <div className="component-view">
//       {/* Карточка компонента в стиле Bootstrap как в образце */}
//       <div className="card">
//         <div className="card-header d-flex justify-content-between align-items-center">
//           <h4 className="mb-0">{componentName}</h4>
//           <button className="btn btn-primary">
//             <i className="fas fa-edit me-2"></i>Редактировать
//           </button>
//         </div>

//         <div className="card-body">
//           {/* Основная информация в две колонки */}
//           <div className="row mb-4">
//             {/* Левая колонка - основная информация */}
//             <div className="col-md-6">
//               <table className="table table-sm">
//                 <tbody>
//                   <tr>
//                     <td><strong>ID:</strong></td>
//                     <td>{component.id}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Категория:</strong></td>
//                     <td>{categoryName}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Ячейка:</strong></td>
//                     <td>{component.storage_cell || '-'}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Datasheet:</strong></td>
//                     <td>
//                       {component.datasheet_url ? (
//                         <a
//                           href={component.datasheet_url}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="datasheet-link"
//                         >
//                           Открыть
//                         </a>
//                       ) : '-'}
//                     </td>
//                   </tr>
//                   <tr>
//                     <td><strong>Количество:</strong></td>
//                     <td>{component.quantity || 0}</td>
//                   </tr>
//                   <tr>
//                     <td><strong>Обновлён:</strong></td>
//                     <td>{formatDate(component.updated_at)}</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>

//             {/* Правая колонка - изображение */}
//             <div className="col-md-6 text-center">
//               {component.image_data ? (
//                 <>
//                   <div className="component-image-container">
//                     <img
//                       src={component.image_data}
//                       className="img-fluid rounded component-image"
//                       alt={componentName}
//                     />
//                   </div>
//                   <button className="btn btn-outline-primary btn-sm mt-3">
//                     <i className="fas fa-sync me-2"></i>Обновить изображение
//                   </button>
//                 </>
//               ) : (
//                 <div className="component-image-container text-muted">
//                   <i className="fas fa-image fa-4x mb-3"></i>
//                   <p className="mb-3">Нет изображения</p>
//                   <button className="btn btn-primary btn-sm">
//                     <i className="fas fa-plus me-2"></i>Добавить изображение
//                   </button>
//                 </div>
//               )}
//             </div>





//           </div>

//           {/* Описание компонента */}
//           {component.description && (
//             <div className="mb-4">
//               <h6>
//                 <i className="fas fa-info-circle me-2"></i>
//                 Описание
//               </h6>
//               <div className="card">
//                 <div className="card-body">
//                   <p className="card-text mb-0">{component.description}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Параметры в виде таблицы как в образце */}
//           <div>
//             <h6>
//               <i className="fas fa-list-alt me-2"></i>
//               Параметры
//             </h6>
//             {Object.keys(parameters).length > 0 ? (
//               <div className="table-responsive">
//                 <table className="table table-striped table-bordered">
//                   <thead className="table-light">
//                     <tr>
//                       <th>Параметр</th>
//                       <th>Значение</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {Object.entries(parameters).map(([key, value], index) => (
//                       <tr key={index}>
//                         <td><strong>{key}</strong></td>
//                         <td>{value}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <div className="card">
//                 <div className="card-body text-center text-muted">
//                   <i className="fas fa-info-circle me-2"></i>
//                   Параметры не указаны
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComponentList;





















































// import React from 'react';
// import '../styles/ComponentList.css';

// const ComponentList = ({ category, component }) => {
//   // Если компонент не выбран, показываем placeholder как в образце
//   if (!component || typeof component !== 'object') {
//     return (
//       <div className="component-view">
//         <div className="text-center text-muted mt-5">
//           <i className="fas fa-microchip fa-3x mb-3"></i>
//           <h4>Выберите компонент для просмотра</h4>
//           <p>или создайте новый компонент</p>
//         </div>
//       </div>
//     );
//   }

//   const componentName = component.name;
//   const categoryName = category?.name || 'Неизвестно';

//   // Функция для форматирования даты
//   const formatDate = (dateString) => {
//     if (!dateString) return 'Не обновлялся';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('ru-RU', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   // Функция для безопасного парсинга параметров
//   const getParametersObject = (parameters) => {
//     if (!parameters) return {};
//     if (typeof parameters === 'string') {
//       try {
//         return JSON.parse(parameters);
//       } catch {
//         return {};
//       }
//     }
//     return parameters;
//   };




//   const parameters = getParametersObject(component.parameters);



//   console.log('🔍 Component parameters:', parameters);
//   console.log('🔍 Parameters type:', typeof parameters);
//   console.log('🔍 Parameters keys:', Object.keys(parameters));
  
//   const safeParameters = typeof parameters === 'string' 
//     ? getParametersObject(parameters) 
//     : parameters;

//   return (
//     <div className="component-view">
//       {/* Карточка компонента */}
//       <div className="component-card">
//         {/* Заголовок с названием компонента */}
//         <div className="component-header">
//           <h1 className="component-title">{componentName}</h1>
//         </div>

//         <div className="component-content">
//           {/* Верхний блок: основная информация + изображение */}
//           <div className="top-section">
//             {/* Левая колонка - основная информация */}
//             <div className="info-section">
//               {/* <div className="info-row">
//                 <span className="info-label">ID:</span>
//                 <span className="info-value">{component.id}</span>
//               </div> */}
//               <div className="info-row">
//                 <span className="info-label">Категория:</span>
//                 <span className="info-value">{categoryName}</span>
//               </div>
//               <div className="info-row">
//                 <span className="info-label">Ячейка:</span>
//                 <span className="info-value">{component.storage_cell || '-'}</span>
//               </div>
//               <div className="info-row">
//                 <span className="info-label">Datasheet:</span>
//                 <span className="info-value">
//                   {component.datasheet_url ? (
//                     <a
//                       href={component.datasheet_url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="datasheet-link"
//                     >
//                       Открыть
//                     </a>
//                   ) : '-'}
//                 </span>
//               </div>
//               <div className="info-row">
//                 <span className="info-label">Количество:</span>
//                 <span className="info-value">{component.quantity || 0}</span>
//               </div>
//               <div className="info-row">
//                 <span className="info-label">Обновлён:</span>
//                 <span className="info-value">{formatDate(component.updated_at)}</span>
//               </div>
//             </div>

//             {/* Правая колонка - изображение */}
//             <div className="image-section-right">
//               {component.image_data ? (
//                 <div className="image-container">
//                   <img
//                     src={component.image_data}
//                     className="component-image"
//                     alt={componentName}
//                   />
//                   <div>
//                     <button className="btn btn-outline-primary btn-sm mt-2">
//                       <i className="fas fa-sync me-1"></i>Обновить изображение
//                     </button>
//                   </div>

//                 </div>
//               ) : (
//                 <div className="image-placeholder">
//                   <i className="fas fa-image fa-3x mb-2"></i>
//                   <p className="text-muted mb-2">Нет изображения</p>
//                   <button className="btn btn-primary btn-sm">
//                     <i className="fas fa-plus me-1"></i>Добавить
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Разделитель */}
//           <div className="divider"></div>

//           {/* Описание (если есть) */}
//           {component.description && (
//             <>
//               <div className="description-section">
//                 <h2 className="section-title">Описание</h2>
//                 <div className="description-content">
//                   {component.description}
//                 </div>
//               </div>
//               <div className="divider"></div>
//             </>
//           )}

//           {/* Нижний блок: параметры на всю ширину */}
//           {/* <div className="parameters-section-full">
//             <h2 className="section-title">Параметры</h2>
//             {Object.keys(parameters).length > 0 ? (
//               <div className="parameters-table">
//                 <div className="table-header">
//                   <div className="parameter-name-header">Параметр</div>
//                   <div className="parameter-value-header">Значение</div>
//                 </div>
//                 <div className="table-body">
//                   {Object.entries(parameters).map(([key, value], index) => (
//                     <div key={index} className="parameter-row-full">
//                       <div className="parameter-name-cell">{key}</div>
//                       <div className="parameter-value-cell">{value}</div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="no-parameters">
//                 <i className="fas fa-info-circle me-2"></i>
//                 Параметры не указаны
//               </div>
//             )}
//           </div> */}


//           <div className="parameters-section-full">
//             <h2 className="section-title">Параметры</h2>
//             {Object.keys(parameters).length > 0 ? (
//               <div className="parameters-table">
//                 <div className="table-header">
//                   <div className="parameter-name-header">Параметр</div>
//                   <div className="parameter-value-header">Значение</div>
//                 </div>
//                 <div className="table-body">
//                   {Object.entries(parameters).map(([key, value], index) => (
//                     <div key={key} className="parameter-row-full">
//                       <div className="parameter-name-cell">{key}</div>
//                       <div className="parameter-value-cell">
//                         {typeof value === 'object' ? JSON.stringify(value) : String(value)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="no-parameters">
//                 <i className="fas fa-info-circle me-2"></i>
//                 Параметры не указаны
//               </div>
//             )}
//           </div>



//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComponentList;
































// import React from 'react';
// import '../styles/ComponentList.css';

// const ComponentList = ({ category, component }) => {
//   // Если компонент не выбран, показываем placeholder как в образце
//   if (!component || typeof component !== 'object') {
//     return (
//       <div className="component-view">
//         <div className="text-center text-muted mt-5">
//           <i className="fas fa-microchip fa-3x mb-3"></i>
//           <h4>Выберите компонент для просмотра</h4>
//           <p>или создайте новый компонент</p>
//         </div>
//       </div>
//     );
//   }

//   const componentName = component.name;
//   const categoryName = category?.name || 'Неизвестно';

//   // Функция для форматирования даты
//   const formatDate = (dateString) => {
//     if (!dateString) return 'Не обновлялся';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('ru-RU', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   // Функция для безопасного парсинга параметров
//   const getParametersObject = (parameters) => {
//     if (!parameters) return {};
    
//     console.log('🔍 Raw parameters:', parameters);
//     console.log('🔍 Parameters type:', typeof parameters);
    
//     // Если parameters уже объект, проверяем не является ли он разобранной строкой
//     if (typeof parameters === 'object') {
//       const keys = Object.keys(parameters);
//       // Если ключи числовые (0,1,2...) - это вероятно разобранная строка
//       if (keys.length > 0 && keys.every(key => !isNaN(key))) {
//         console.log('⚠️ Parameters appear to be a parsed string, trying to reconstruct...');
//         // Пытаемся восстановить исходную строку
//         const reconstructedString = keys.map(key => parameters[key]).join('');
//         console.log('🔍 Reconstructed string:', reconstructedString);
//         try {
//           return JSON.parse(reconstructedString);
//         } catch (error) {
//           console.error('❌ Failed to parse reconstructed string:', error);
//           return {};
//         }
//       }
//       // Если это нормальный объект с строковыми ключами
//       return parameters;
//     }
    
//     // Если parameters - строка, пытаемся распарсить
//     if (typeof parameters === 'string') {
//       try {
//         return JSON.parse(parameters);
//       } catch {
//         console.error('❌ Failed to parse parameters string');
//         return {};
//       }
//     }
    
//     return {};
//   };

//   // Получаем корректные параметры
//   const parameters = getParametersObject(component.parameters);
  
//   console.log('✅ Final parameters:', parameters);
//   console.log('✅ Final parameters keys:', Object.keys(parameters));

//   return (
//     <div className="component-view">
//       {/* Карточка компонента */}
//       <div className="component-card">
//         {/* Заголовок с названием компонента */}
//         <div className="component-header">
//           <h1 className="component-title">{componentName}</h1>
//         </div>

//         <div className="component-content">
//           {/* Верхний блок: основная информация + изображение */}
//           <div className="top-section">
//             {/* Левая колонка - основная информация */}
//             <div className="info-section">
//               <div className="info-row">
//                 <span className="info-label">Категория:</span>
//                 <span className="info-value">{categoryName}</span>
//               </div>
//               <div className="info-row">
//                 <span className="info-label">Ячейка:</span>
//                 <span className="info-value">{component.storage_cell || '-'}</span>
//               </div>
//               <div className="info-row">
//                 <span className="info-label">Datasheet:</span>
//                 <span className="info-value">
//                   {component.datasheet_url ? (
//                     <a
//                       href={component.datasheet_url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="datasheet-link"
//                     >
//                       Открыть
//                     </a>
//                   ) : '-'}
//                 </span>
//               </div>
//               <div className="info-row">
//                 <span className="info-label">Количество:</span>
//                 <span className="info-value">{component.quantity || 0}</span>
//               </div>
//               <div className="info-row">
//                 <span className="info-label">Обновлён:</span>
//                 <span className="info-value">{formatDate(component.updated_at)}</span>
//               </div>
//             </div>

//             {/* Правая колонка - изображение */}
//             <div className="image-section-right">
//               {component.image_data ? (
//                 <div className="image-container">
//                   <img
//                     src={component.image_data}
//                     className="component-image"
//                     alt={componentName}
//                   />
//                   <div>
//                     <button className="btn btn-outline-primary btn-sm mt-2">
//                       <i className="fas fa-sync me-1"></i>Обновить изображение
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="image-placeholder">
//                   <i className="fas fa-image fa-3x mb-2"></i>
//                   <p className="text-muted mb-2">Нет изображения</p>
//                   <button className="btn btn-primary btn-sm">
//                     <i className="fas fa-plus me-1"></i>Добавить
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Разделитель */}
//           {/* <div className="divider"></div> */}

//           {/* Описание (если есть) */}
//           {component.description && (
//             <>
//               <div className="description-section">
//                 <h2 className="section-title">Описание</h2>
//                 <div className="description-content">
//                   {component.description}
//                 </div>
//               </div>
//               <div className="divider"></div>
//             </>
//           )}

//           {/* Нижний блок: параметры на всю ширину */}
//           <div className="parameters-section-full">
//             <h2 className="section-title">Параметры</h2>
//             {Object.keys(parameters).length > 0 ? (
//               <div className="parameters-table">
//                 <div className="table-header">
//                   <div className="parameter-name-header">Параметр</div>
//                   <div className="parameter-value-header">Значение</div>
//                 </div>
//                 <div className="table-body">
//                   {Object.entries(parameters).map(([key, value]) => (
//                     <div key={key} className="parameter-row-full">
//                       <div className="parameter-name-cell">{key}</div>
//                       <div className="parameter-value-cell">
//                         {typeof value === 'object' ? JSON.stringify(value) : String(value)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="no-parameters">
//                 <i className="fas fa-info-circle me-2"></i>
//                 Параметры не указаны
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComponentList;








































import React from 'react';
import '../styles/ComponentList.css';

const ComponentList = ({ category, component, onEdit }) => {
  // Если компонент не выбран, показываем placeholder как в образце
  if (!component || typeof component !== 'object') {
    return (
      <div className="component-view">
        <div className="text-center text-muted mt-5">
          <i className="fas fa-microchip fa-3x mb-3"></i>
          <h4>Выберите компонент для просмотра</h4>
          <p>или создайте новый компонент</p>
        </div>
      </div>
    );
  }

  const componentName = component.name;
  const categoryName = category?.name || 'Неизвестно';

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не обновлялся';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Функция для безопасного парсинга параметров
  const getParametersObject = (parameters) => {
    if (!parameters) return {};
    
    console.log('🔍 Raw parameters:', parameters);
    console.log('🔍 Parameters type:', typeof parameters);
    
    // Если parameters уже объект, проверяем не является ли он разобранной строкой
    if (typeof parameters === 'object') {
      const keys = Object.keys(parameters);
      // Если ключи числовые (0,1,2...) - это вероятно разобранная строка
      if (keys.length > 0 && keys.every(key => !isNaN(key))) {
        console.log('⚠️ Parameters appear to be a parsed string, trying to reconstruct...');
        // Пытаемся восстановить исходную строку
        const reconstructedString = keys.map(key => parameters[key]).join('');
        console.log('🔍 Reconstructed string:', reconstructedString);
        try {
          return JSON.parse(reconstructedString);
        } catch (error) {
          console.error('❌ Failed to parse reconstructed string:', error);
          return {};
        }
      }
      // Если это нормальный объект с строковыми ключами
      return parameters;
    }
    
    // Если parameters - строка, пытаемся распарсить
    if (typeof parameters === 'string') {
      try {
        return JSON.parse(parameters);
      } catch {
        console.error('❌ Failed to parse parameters string');
        return {};
      }
    }
    
    return {};
  };

  // Получаем корректные параметры
  const parameters = getParametersObject(component.parameters);
  
  console.log('✅ Final parameters:', parameters);
  console.log('✅ Final parameters keys:', Object.keys(parameters));

  // Обработчик клика по кнопке редактирования
  const handleEditClick = () => {
    if (onEdit) {
      onEdit(component);
    }
  };

  return (
    <div className="component-view">
      {/* Карточка компонента */}
      <div className="component-card">
        {/* Заголовок с названием компонента и кнопкой редактирования */}
        <div className="component-header">
          <h1 className="component-title">{componentName}</h1>
          <button 
            className="btn-edit-component"
            onClick={handleEditClick}
            title="Редактировать компонент"
          >
            <i className="fas fa-edit me-1"></i>
            Редактировать
          </button>
        </div>

        <div className="component-content">
          {/* Верхний блок: основная информация + изображение */}
          <div className="top-section">
            {/* Левая колонка - основная информация */}
            <div className="info-section">
              <div className="info-row">
                <span className="info-label">Категория:</span>
                <span className="info-value">{categoryName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Ячейка:</span>
                <span className="info-value">{component.storage_cell || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Datasheet:</span>
                <span className="info-value">
                  {component.datasheet_url ? (
                    <a
                      href={component.datasheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="datasheet-link"
                    >
                      Открыть
                    </a>
                  ) : '-'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Количество:</span>
                <span className="info-value">{component.quantity || 0}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Обновлён:</span>
                <span className="info-value">{formatDate(component.updated_at)}</span>
              </div>
            </div>

            {/* Правая колонка - изображение */}
            <div className="image-section-right">
              {component.image_data ? (
                <div className="image-container">
                  <img
                    src={component.image_data}
                    className="component-image"
                    alt={componentName}
                  />
                  <div>
                    <button className="btn btn-outline-primary btn-sm mt-2">
                      <i className="fas fa-sync me-1"></i>Обновить изображение
                    </button>
                  </div>
                </div>
              ) : (
                <div className="image-placeholder">
                  <i className="fas fa-image fa-3x mb-2"></i>
                  <p className="text-muted mb-2">Нет изображения</p>
                  <button className="btn btn-primary btn-sm">
                    <i className="fas fa-plus me-1"></i>Добавить
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Разделитель */}
          {/* <div className="divider"></div> */}

          {/* Описание (если есть) */}
          {component.description && (
            <>
              <div className="description-section">
                <h2 className="section-title">Описание</h2>
                <div className="description-content">
                  {component.description}
                </div>
              </div>
              <div className="divider"></div>
            </>
          )}

          {/* Нижний блок: параметры на всю ширину */}
          <div className="parameters-section-full">
            <h2 className="section-title">Параметры</h2>
            {Object.keys(parameters).length > 0 ? (
              <div className="parameters-table">
                <div className="table-header">
                  <div className="parameter-name-header">Параметр</div>
                  <div className="parameter-value-header">Значение</div>
                </div>
                <div className="table-body">
                  {Object.entries(parameters).map(([key, value]) => (
                    <div key={key} className="parameter-row-full">
                      <div className="parameter-name-cell">{key}</div>
                      <div className="parameter-value-cell">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-parameters">
                <i className="fas fa-info-circle me-2"></i>
                Параметры не указаны
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentList;
