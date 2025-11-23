import React, { useState, useEffect, useCallback } from 'react';
import '../styles/ModalAddComponent.css';
import {
  FaEdit,
  FaSave,
  FaUpload,        // Стрелка вверх (загрузка)
  FaDownload,      // Стрелка вниз (скачивание)
  FaFileUpload,    // Файл со стрелкой вверх
  FaCloudUploadAlt, // Облако со стрелкой вверх
  FaImage,         // Изображение
  FaPhotoVideo,    // Фото/видео
  FaCamera         // Камера
} from 'react-icons/fa';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [localCategories, setLocalCategories] = useState(categories);

  // Функция для загрузки категорий
  const loadCategories = async () => {
    try {
      const categoriesData = await window.api.database.getCategories();
      setLocalCategories(categoriesData);
    } catch (error) {
      console.error('❌ Ошибка загрузки категорий:', error);
    }
  };

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

  // Функция для корректного парсинга параметров
  const parseParameters = (parameters) => {
    if (!parameters) return [];

    console.log('🔍 Parsing parameters:', parameters);
    console.log('🔍 Parameters type:', typeof parameters);

    // Если parameters уже массив, возвращаем его
    if (Array.isArray(parameters)) {
      return parameters;
    }

    // Если parameters - объект с числовыми ключами (0,1,2...) - это разобранная строка
    if (typeof parameters === 'object' && parameters !== null) {
      const keys = Object.keys(parameters);

      // Проверяем, являются ли ключи числовыми (разобранная строка)
      if (keys.length > 0 && keys.every(key => !isNaN(key))) {
        console.log('⚠️ Parameters appear to be a parsed string, trying to reconstruct...');

        // Восстанавливаем исходную строку из символов
        const reconstructedString = keys.map(key => parameters[key]).join('');
        console.log('🔍 Reconstructed string:', reconstructedString);

        try {
          // Пытаемся распарсить восстановленную строку
          const parsed = JSON.parse(reconstructedString);
          console.log('✅ Successfully parsed reconstructed parameters:', parsed);

          // Преобразуем в массив для формы
          return Object.entries(parsed).map(([key, value]) => ({
            key,
            value: String(value)
          }));
        } catch (error) {
          console.error('❌ Failed to parse reconstructed string:', error);
          return [{ key: '', value: '' }];
        }
      }

      // Если это нормальный объект с строковыми ключами
      console.log('✅ Normal parameters object:', parameters);
      return Object.entries(parameters).map(([key, value]) => ({
        key,
        value: String(value)
      }));
    }

    // Если parameters - строка, пытаемся распарсить
    if (typeof parameters === 'string') {
      try {
        const parsed = JSON.parse(parameters);
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value)
        }));
      } catch (error) {
        console.error('❌ Failed to parse parameters string:', error);
        return [{ key: '', value: '' }];
      }
    }

    return [{ key: '', value: '' }];
  };

  // Функция для проверки наличия несохраненных изменений
  const hasChanges = useCallback(() => {
    if (!editMode || !originalData) return false;

    const currentData = {
      ...formData,
      parameters: Object.fromEntries(
        newParameters
          .filter(param => param.key.trim() && param.value.trim())
          .map(param => [param.key.trim(), param.value.trim()])
      ),
      image_data: imagePreview
    };

    return JSON.stringify(currentData) !== JSON.stringify(originalData);
  }, [formData, newParameters, imagePreview, editMode, originalData]);

  // Обработчик закрытия модального окна с подтверждением
  const handleCloseWithConfirmation = useCallback(() => {
    if (hasUnsavedChanges && hasChanges()) {
      const shouldSave = window.confirm(
        'У вас есть несохраненные изменения. Хотите сохранить перед закрытием?'
      );

      if (shouldSave) {
        // Сохраняем изменения
        handleSubmit(new Event('submit'));
      } else {
        // Закрываем без сохранения
        onClose();
      }
    } else {
      // Нет изменений, просто закрываем
      onClose();
    }
  }, [hasUnsavedChanges, hasChanges, onClose]);

  // Обработчик клика по оверлею
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseWithConfirmation();
    }
  };

  // Обработчик нажатия ESC
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.keyCode === 27 && isOpen) {
        handleCloseWithConfirmation();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, handleCloseWithConfirmation]);

  // Обновляем время каждую секунду
  useEffect(() => {
    if (isOpen) {
      setCurrentDateTime(getCurrentDateTime());
      const interval = setInterval(() => {
        setCurrentDateTime(getCurrentDateTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Сбрасываем форму при открытии/закрытии
  useEffect(() => {
    if (isOpen) {

      loadCategories();

      if (editMode && initialComponentData) {
        console.log('📝 Edit mode - initial data:', initialComponentData);

        // Сохраняем оригинальные данные для сравнения
        const original = {
          category_id: initialComponentData.category_id || '',
          name: initialComponentData.name || '',
          storage_cell: initialComponentData.storage_cell || '',
          datasheet_url: initialComponentData.datasheet_url || '',
          quantity: initialComponentData.quantity || 0,
          parameters: initialComponentData.parameters || {},
          description: initialComponentData.description || '',
          image_data: initialComponentData.image_data || null
        };
        setOriginalData(original);

        setFormData({
          category_id: initialComponentData.category_id || '',
          name: initialComponentData.name || '',
          storage_cell: initialComponentData.storage_cell || '',
          datasheet_url: initialComponentData.datasheet_url || '',
          quantity: initialComponentData.quantity || 0,
          parameters: initialComponentData.parameters || {},
          description: initialComponentData.description || ''
        });

        // Используем функцию корректного парсинга параметров
        const parametersArray = parseParameters(initialComponentData.parameters);
        console.log('✅ Parsed parameters for form:', parametersArray);

        setNewParameters(parametersArray.length > 0 ? parametersArray : [{ key: '', value: '' }]);
        setImagePreview(initialComponentData.image_data || null);
        setHasUnsavedChanges(false);
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
        setOriginalData(null);
        setHasUnsavedChanges(false);
      }
    }
  }, [isOpen, selectedCategory, categories, editMode, initialComponentData]);

  // Отслеживаем изменения в форме
  useEffect(() => {
    if (isOpen && editMode) {
      const changesExist = hasChanges();
      setHasUnsavedChanges(changesExist);
    }
  }, [formData, newParameters, imagePreview, isOpen, editMode, hasChanges]);

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


    console.log('📝 Form submitted with data:', {
      formData,
      newParameters,
      imagePreview: !!imagePreview,
      editMode,
      initialComponentData
    });


    // Валидация
    if (!formData.category_id) {
      alert('Выберите категорию');
      return;
    }

    if (!formData.name.trim()) {
      alert('Введите название компонента');
      return;
    }

    // Собираем параметры в объект
    const parameters = {};
    newParameters.forEach(param => {
      if (param.key.trim() && param.value.trim()) {
        parameters[param.key.trim()] = param.value.trim();
      }
    });

    console.log('💾 Saving parameters:', parameters);

    const componentData = {
      ...formData,
      parameters,
      updated_at: new Date().toISOString(),
      image_data: imagePreview
    };

    // Добавляем ID компонента в режиме редактирования
    if (editMode && initialComponentData) {
      componentData.id = initialComponentData.id;
    }

    console.log('💾 Final component data to save:', componentData);

    try {
      await onSave(componentData);
      console.log('✅ Save successful');
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении компонента:', error);
      console.error('❌ Error saving component:', error);
      alert('Не удалось сохранить компонент');
    }
  };

  const handleCancel = () => {
    handleCloseWithConfirmation();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content modal-add-component" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editMode ? 'Редактировать компонент' : 'Добавить компонент'}
            {hasUnsavedChanges && <span className="unsaved-changes-indicator"> •</span>}
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
                    {localCategories.map(category => (
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

            <div className="form-section">
              <h3 className="section-title">Количество</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  {/* <input
                    type="number"
                    className="form-control"
                    value={formData.quantity === 0 ? "" : formData.quantity} // Показываем пустую строку вместо 0
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === '') {
                        handleInputChange('quantity', 0);
                      } else {
                        const numericValue = parseInt(value, 10);
                        if (!isNaN(numericValue) && numericValue >= 0) {
                          handleInputChange('quantity', numericValue);
                        }
                      }
                    }}
                    onFocus={(e) => {
                      // Если значение 0, очищаем поле при фокусе
                      if (formData.quantity === 0) {
                        e.target.value = "";
                      }
                      e.target.select();
                    }}
                    onBlur={(e) => {
                      // Если поле пустое при потере фокуса, устанавливаем 0
                      if (e.target.value === '') {
                        handleInputChange('quantity', 0);
                      }
                    }}
                    min="0"
                    step="1"
                  /> */}

                  <input
                    type="number"
                    className="form-control"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    min="0"
                    step="1"
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

            {/* Параметры - ТАБЛИЧНЫЙ ВИД */}
            <div className="form-section">
              <h3 className="section-title">Параметры</h3>

              <div className="parameters-table-container">
                {/* Заголовок таблицы */}
                <div className="parameters-table-header">
                  <div className="parameter-name-header">Параметр</div>
                  <div className="parameter-value-header">Значение</div>
                  <div className="parameter-actions-header">Действия</div>
                </div>

                {/* Тело таблицы */}
                <div className="parameters-table-body">
                  {newParameters.map((param, index) => (
                    <div key={index} className="parameter-table-row">
                      <div className="parameter-name-cell">
                        <input
                          type="text"
                          className="form-control parameter-input"
                          placeholder="Например: Напряжение питания"
                          value={param.key}
                          onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                        />
                      </div>
                      <div className="parameter-value-cell">
                        <input
                          type="text"
                          className="form-control parameter-input"
                          placeholder="Например: 5 В"
                          value={param.value}
                          onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                        />
                      </div>
                      <div className="parameter-actions-cell">
                        {newParameters.length > 1 && (
                          <button
                            type="button"
                            className="parameter-remove-btn table-remove-btn"
                            onClick={() => removeParameterField(index)}
                            title="Удалить параметр"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="add-param-btn table-add-btn"
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
                    <FaFileUpload size={14} />
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
              // className="btn btn-primary"
              className="button-save-change"
            >
              <FaSave size={14} />
              {editMode ? 'Сохранить изменения' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAddComponent;
