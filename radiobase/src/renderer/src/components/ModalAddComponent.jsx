// renderer/src/components/ModalAddComponent.jsx
import React, { useState, useEffect } from 'react';
import '../styles/ModalAddComponent.css';

const ModalAddComponent = ({
  isOpen,
  onClose,
  onSave,
  categories = [],
  selectedCategory = null,
  editMode = false,
  componentData: initialComponentData = null
}) => {
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    storage_cell: '',
    datasheet_url: '',
    quantity: 0,
    parameters: {},
    description: ''
  });

  const [newParameters, setNewParameters] = useState([{ key: '', value: '' }]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Функция для получения текущей даты и времени в нужном формате
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Обновляем время каждую секунду
  useEffect(() => {
    if (isOpen) {
      // Устанавливаем начальное время
      setCurrentDateTime(getCurrentDateTime());

      // Обновляем время каждую секунду
      const interval = setInterval(() => {
        setCurrentDateTime(getCurrentDateTime());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Сбрасываем форму при открытии/закрытии
  useEffect(() => {
    if (isOpen) {
      if (editMode && initialComponentData) {
        // Режим редактирования - заполняем данными компонента
        setFormData({
          category_id: initialComponentData.category_id || '',
          name: initialComponentData.name || '',
          storage_cell: initialComponentData.storage_cell || '',
          datasheet_url: initialComponentData.datasheet_url || '',
          quantity: initialComponentData.quantity || 0,
          parameters: initialComponentData.parameters || {},
          description: initialComponentData.description || ''
        });

        // Преобразуем параметры в массив для формы
        const parametersArray = Object.entries(initialComponentData.parameters || {}).map(
          ([key, value]) => ({ key, value })
        );
        setNewParameters(parametersArray.length > 0 ? parametersArray : [{ key: '', value: '' }]);

        // Устанавливаем изображение если есть
        setImagePreview(initialComponentData.image_data || null);
      } else {
        // Режим добавления - сбрасываем форму
        const initialCategoryId = selectedCategory?.id || (categories[0]?.id || '');

        setFormData({
          category_id: initialCategoryId,
          name: '',
          storage_cell: '',
          datasheet_url: '',
          quantity: 0,
          parameters: {},
          description: ''
        });

        setNewParameters([{ key: '', value: '' }]);
        setImageFile(null);
        setImagePreview(null);
      }
    }
  }, [isOpen, selectedCategory, categories, editMode, initialComponentData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParameterChange = (index, field, value) => {
    const updated = [...newParameters];
    updated[index][field] = value;
    setNewParameters(updated);
  };

  const addParameterField = () => {
    setNewParameters(prev => [...prev, { key: '', value: '' }]);
  };

  const removeParameterField = (index) => {
    if (newParameters.length > 1) {
      setNewParameters(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Валидация
    if (!formData.category_id) {
      alert('Выберите категорию');
      return;
    }

    if (!formData.name.trim()) {
      alert('Введите название компонента');
      return;
    }

    // Собираем параметры
    const parameters = {};
    newParameters.forEach(param => {
      if (param.key.trim() && param.value.trim()) {
        parameters[param.key.trim()] = param.value.trim();
      }
    });

    const componentData = {
      ...formData,
      parameters,
      updated_at: new Date().toISOString(), // Сохраняем в ISO формате для БД
      image_data: imagePreview
    };

    // Добавляем ID компонента в режиме редактирования
    if (editMode && initialComponentData) {
      componentData.id = initialComponentData.id;
    }

    try {
      await onSave(componentData);
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении компонента:', error);
      alert('Не удалось сохранить компонент');
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content modal-add-component" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editMode ? 'Редактировать компонент' : 'Добавить компонент'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleCancel}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Категория */}
            <div className="form-section">
              <h3 className="section-title">Категория</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <select
                    className="form-control"
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Название компонента */}
            <div className="form-section">
              <h3 className="section-title">Название</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Введите название компонента"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Ячейка хранения */}
            <div className="form-section">
              <h3 className="section-title">Ячейка хранения</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Например: A-12-5"
                    value={formData.storage_cell}
                    onChange={(e) => handleInputChange('storage_cell', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Ссылка на datasheet */}
            <div className="form-section">
              <h3 className="section-title">Ссылка на datasheet</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com/datasheet.pdf"
                    value={formData.datasheet_url}
                    onChange={(e) => handleInputChange('datasheet_url', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Количество */}
            <div className="form-section">
              <h3 className="section-title">Количество</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Например: 0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Дата последнего обновления */}
            <div className="form-section">
              <h3 className="section-title">Дата последнего обновления</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <div className="datetime-display-container">
                    <div className="datetime-display">
                      {currentDateTime || getCurrentDateTime()}
                    </div>
                    <div className="datetime-hint">
                      Время будет установлено автоматически при сохранении
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Описание */}
            <div className="form-section">
              <h3 className="section-title">Описание</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <textarea
                    className="form-control textarea-description"
                    placeholder="Введите описание компонента и его применение..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="4"
                  />
                </div>
              </div>
            </div>

            {/* Параметры */}
            <div className="form-section">
              <h3 className="section-title">Параметры</h3>

              {newParameters.map((param, index) => (
                <div key={index} className="parameter-row">
                  <input
                    type="text"
                    className="form-control parameter-key"
                    placeholder="Параметр"
                    value={param.key}
                    onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control parameter-value"
                    placeholder="Значение"
                    value={param.value}
                    onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                  />
                  {newParameters.length > 1 && (
                    <button
                      type="button"
                      className="parameter-remove-btn"
                      onClick={() => removeParameterField(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="add-param-btn"
                onClick={addParameterField}
              >
                + Добавить параметр
              </button>
            </div>

            <div className="divider"></div>

            {/* Изображение компонента */}
            <div className="form-section">
              <h3 className="section-title">Изображение компонента</h3>
              <div className="image-upload-section">
                <div className="image-preview">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Предпросмотр" className="image-preview-img" />
                  ) : (
                    <div className="image-placeholder">
                      <span>Изображение не загружено</span>
                    </div>
                  )}
                </div>

                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="component-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                  <label htmlFor="component-image" className="file-input-label">
                    Загрузить изображение
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editMode ? 'Сохранить изменения' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAddComponent;
