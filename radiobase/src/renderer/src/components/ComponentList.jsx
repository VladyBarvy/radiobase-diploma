import React, { useState, useMemo, useCallback } from 'react';
import { FaEdit } from 'react-icons/fa';
import '../styles/ComponentList.css';

const ComponentList = ({ category, component, onEdit }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Мемоизируем вычисляемые значения
  const componentName = useMemo(() => component?.name, [component?.name]);
  const categoryName = useMemo(() => 
    component?.category_name || category?.name || 'Неизвестно',
    [component?.category_name, category?.name]
  );

  // Мемоизируем форматирование даты
  const formattedDate = useMemo(() => {
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
    return formatDate(component?.updated_at);
  }, [component?.updated_at]);

  // Мемоизируем параметры
  const parameters = useMemo(() => {
    const getParametersObject = (parameters) => {
      if (!parameters) return {};

      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 Raw parameters:', parameters);
      }

      if (typeof parameters === 'object') {
        const keys = Object.keys(parameters);
        if (keys.length > 0 && keys.every(key => !isNaN(key))) {
          const reconstructedString = keys.map(key => parameters[key]).join('');
          try {
            return JSON.parse(reconstructedString);
          } catch (error) {
            console.error('❌ Failed to parse reconstructed string:', error);
            return {};
          }
        }
        return parameters;
      }

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

    return getParametersObject(component?.parameters);
  }, [component?.parameters]);

  // Оптимизированные обработчики с useCallback
  const handleEditClick = useCallback(() => {
    onEdit?.(component);
  }, [onEdit, component]);

  const handleUpdateImage = useCallback(() => {
    setIsImageModalOpen(true);
  }, []);

  const handleCloseImageModal = useCallback(() => {
    setIsImageModalOpen(false);
    setImagePreview(null);
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSaveImage = useCallback(async () => {
    if (!imagePreview) return;

    try {
      const updatedComponent = {
        ...component,
        image_data: imagePreview,
        updated_at: new Date().toISOString()
      };

      const result = await window.api.database.updateComponent(updatedComponent);

      if (result.success) {
        onEdit?.(updatedComponent);
        handleCloseImageModal();
      } else {
        console.error('❌ Failed to update image:', result.error);
        alert('Не удалось обновить изображение');
      }
    } catch (error) {
      console.error('❌ Error updating image:', error);
      alert('Ошибка при обновлении изображения');
    }
  }, [imagePreview, component, onEdit, handleCloseImageModal]);

  const handleDatasheetClick = useCallback(async (e, url) => {
    e.preventDefault();

    if (!url) {
      alert('Ссылка на datasheet не указана');
      return;
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      if (window.electron?.shell) {
        window.electron.shell.openExternal(normalizedUrl);
      } else if (window.api?.window?.openBrowser) {
        const result = await window.api.window.openBrowser(normalizedUrl);
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('❌ Error opening datasheet:', error);
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Выносим условия рендеринга в переменные для читаемости
  const hasDescription = !!component?.description;
  const hasParameters = Object.keys(parameters).length > 0;
  const hasImage = !!component?.image_data;
  const hasDatasheet = !!component?.datasheet_url;

  // Если компонент не выбран, показываем placeholder
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
            <FaEdit size={14} />
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
                  {hasDatasheet ? (
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
                <span className="info-value">{formattedDate}</span>
              </div>
            </div>

            {/* Правая колонка - изображение */}
            <div className="image-section-right">
              {hasImage ? (
                <div className="image-container">
                  <img
                    src={component.image_data}
                    className="component-image"
                    alt={componentName}
                  />
                  <div>
                    <button
                      // className="btn btn-outline-primary btn-sm mt-2"
                      className="button-update-image"
                      onClick={handleUpdateImage}
                    >
                      <FaEdit size={14} />
                      Обновить изображение
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

          {/* Описание */}
          {hasDescription && (
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

          {/* Раздел "Параметры" */}
          <div className="parameters-section-full">
            <h2 className="section-title">Параметры</h2>
            {hasParameters ? (
              <div className="new-parameters-container">
                <table className="new-parameters-table">
                  <thead>
                    <tr>
                      <th className="new-param-name-header">Параметр</th>
                      <th className="new-param-value-header">Значение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(parameters).map(([key, value]) => (
                      <tr key={key}>
                        <td className="new-param-name-cell">{key}</td>
                        <td className="new-param-value-cell">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                {hasImage ? 'Обновить изображение' : 'Добавить изображение'}
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
                  ) : hasImage ? (
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
                disabled={!imagePreview && !hasImage}
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

export default React.memo(ComponentList);
