import React, { useState } from 'react';
import '../styles/ComponentList.css';

const ComponentList = ({ category, component, onEdit }) => {
  // Все хуки должны быть в начале компонента, до любых условных операторов
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

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
  const categoryName = component.category_name || category?.name || 'Неизвестно';

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

  // Функция для открытия модального окна
  const handleUpdateImage = () => {
    setIsImageModalOpen(true);
  };

  // Функция для закрытия модального окна
  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setImagePreview(null);
  };

  // Функция для обработки выбора файла
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Функция для сохранения изображения
  const handleSaveImage = async () => {
    if (!imagePreview) return;

    try {
      const updatedComponent = {
        ...component,
        image_data: imagePreview,
        updated_at: new Date().toISOString()
      };

      // Вызываем API для обновления компонента
      const result = await window.api.database.updateComponent(updatedComponent);

      if (result.success) {
        console.log('✅ Image updated successfully');

        // Обновляем компонент в родительском компоненте
        if (onEdit) {
          onEdit(updatedComponent);
        }

        handleCloseImageModal();
      } else {
        console.error('❌ Failed to update image:', result.error);
        alert('Не удалось обновить изображение');
      }
    } catch (error) {
      console.error('❌ Error updating image:', error);
      alert('Ошибка при обновлении изображения');
    }
  };

  // Функция для открытия datasheet в браузерном окне
  // Функция для открытия datasheet в браузерном окне
  const handleDatasheetClick = async (e, url) => {
    e.preventDefault();

    // Отладочная информация
    console.log('🔍 Debug - Available APIs:');
    console.log('window.api:', window.api);
    console.log('window.electron:', window.electron);
    console.log('window.api.window:', window.api?.window);

    try {
      console.log('🌐 Opening datasheet:', url);

      if (!url) {
        alert('Ссылка на datasheet не указана');
        return;
      }

      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      // Простой подход: всегда открываем в системном браузере
      if (window.electron && window.electron.shell) {
        // Используем Electron shell API
        window.electron.shell.openExternal(normalizedUrl);
      } else if (window.api && window.api.window && window.api.window.openBrowser) {
        // Пробуем наш кастомный метод
        const result = await window.api.window.openBrowser(normalizedUrl);
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        // Последний вариант: обычное окно браузера
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      }

    } catch (error) {
      console.error('❌ Error opening datasheet:', error);

      // Ultimate fallback
      window.open(url, '_blank', 'noopener,noreferrer');
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
                      onClick={(e) => handleDatasheetClick(e, component.datasheet_url)}
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
                    <button
                      className="btn btn-outline-primary btn-sm mt-2"
                      onClick={handleUpdateImage}
                    >
                      <i className="fas fa-sync me-1"></i>Обновить изображение
                    </button>
                  </div>
                </div>
              ) : (
                <div className="image-placeholder">
                  <i className="fas fa-image fa-3x mb-2"></i>
                  <p className="text-muted mb-2">Нет изображения</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleUpdateImage}
                  >
                    <i className="fas fa-plus me-1"></i>Добавить
                  </button>
                </div>
              )}
            </div>
          </div>

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

      {/* Модальное окно для обновления изображения */}
      {isImageModalOpen && (
        <div className="modal-overlay" onClick={handleCloseImageModal}>
          <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {component.image_data ? 'Обновить изображение' : 'Добавить изображение'}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseImageModal}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="image-upload-section">
                <div className="image-preview">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Предпросмотр" className="image-preview-img" />
                  ) : component.image_data ? (
                    <img src={component.image_data} alt="Текущее" className="image-preview-img" />
                  ) : (
                    <div className="image-placeholder">
                      <span>Изображение не загружено</span>
                    </div>
                  )}
                </div>

                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="update-component-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                  <label htmlFor="update-component-image" className="file-input-label">
                    {imagePreview ? 'Выбрать другое изображение' : 'Выбрать изображение'}
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseImageModal}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveImage}
                disabled={!imagePreview && !component.image_data}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentList;
