// renderer/src/utils/ImageModal.jsx
import React, { useCallback, useState } from 'react';

const ImageModal = ({
  isOpen,
  onClose,
  onSave,
  imagePreview: externalImagePreview,
  component,
  hasImage
}) => {
  const [localImagePreview, setLocalImagePreview] = useState(externalImagePreview);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📁 Image file selected:', file.name, file.size);
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setLocalImagePreview(e.target.result);
        if (process.env.NODE_ENV !== 'production') {
          console.log('🖼️ Image preview generated');
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSaveClick = useCallback(() => {
    onSave(localImagePreview);
  }, [localImagePreview, onSave]);

  // Синхронизируем локальный превью с внешним при изменении
  React.useEffect(() => {
    setLocalImagePreview(externalImagePreview);
  }, [externalImagePreview]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {hasImage ? 'Обновить изображение' : 'Добавить изображение'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="image-upload-section">
            <div className="image-preview">
              {localImagePreview ? (
                <img src={localImagePreview} alt="Предпросмотр" className="image-preview-img" />
              ) : hasImage ? (
                <img src={component?.image_data} alt="Текущее" className="image-preview-img" />
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
                {localImagePreview ? 'Выбрать другое изображение' : 'Выбрать изображение'}
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveClick}
            disabled={!localImagePreview && !hasImage}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

// Мемоизируем компонент для предотвращения лишних ререндеров
export default React.memo(ImageModal);
