import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../styles/ModalAddComponent.css';

import {
  FaEdit,
  FaSave,
  FaUpload,         // Стрелка вверх (загрузка)
  FaDownload,       // Стрелка вниз (скачивание)
  FaFileUpload,     // Файл со стрелкой вверх
  FaCloudUploadAlt, // Облако со стрелкой вверх
  FaImage,          // Изображение
  FaPhotoVideo,     // Фото/видео
  FaCamera,         // Камера
  FaFilePdf, // Добавить эту строку
  FaTrash    // Если используете удаление файла
} from 'react-icons/fa';
import { validateForm, validationRules, validateImage } from './validationRules';


import {
  handlePdfUpload as handlePdfUploadUtil,
  loadCategories as loadCategoriesUtil,
  getCurrentDateTime as getCurrentDateTimeUtil,
  parseParameters as parseParametersUtil,
  hasChanges as hasChangesUtil,
  handleCloseWithConfirmation as handleCloseWithConfirmationUtil,
  getFieldError as getFieldErrorUtil,
  hasError as hasErrorUtil,
  handleFieldChange as handleFieldChangeUtil,
  convertFileToArrayBuffer as convertFileToArrayBufferUtil
} from '../utils/ModalAddCompFunc';


const ModalAddComponent = ({
  isOpen,
  onClose,
  onSave,
  categories = [],
  selectedCategory = null,
  editMode = false,
  componentData: initialComponentData = null,
  onPdfUpdate
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
  const [errors, setErrors] = useState({});
  const [pdfFile, setPdfFile] = useState(null);



  const handleSubmit = async (e) => {
    e.preventDefault();

    // Конвертация PDF в base64 если есть файл
    let pdfData = null;
    let pdfFilename = null;
    let pdfSize = 0;

    if (pdfFile) {
      pdfData = await convertFileToArrayBuffer(pdfFile); // ← Изменено здесь
      pdfFilename = pdfFile.name;
      pdfSize = pdfFile.size;
    }


    // Валидация формы
    const validation = validateForm(formData, newParameters);

    if (!validation.isValid) {
      setErrors(validation.errors);
      console.log('❌ Validation errors:', validation.errors);

      // Показываем первую ошибку
      const firstErrorKey = Object.keys(validation.errors)[0];
      if (firstErrorKey) {
        alert(validation.errors[firstErrorKey]);
      }

      return;
    }

    // Очищаем ошибки
    setErrors({});

    console.log('🔍 DEBUG: Before creating componentData:', {
      formDataQuantity: formData.quantity,
      parameters: newParameters
    });

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
      image_data: formData.image_data || imagePreview || null,
      pdf_data: pdfData,
      pdf_filename: pdfFilename,
      pdf_size: pdfSize,
    };

    // Добавляем ID компонента в режиме редактирования
    if (editMode && initialComponentData) {
      componentData.id = initialComponentData.id;
    }

    console.log('💾 Final component data to save:', componentData);
    console.log('🔍 DEBUG: quantity in final data:', {
      value: componentData.quantity,
      type: typeof componentData.quantity
    });

    // Добавляем ID компонента в режиме редактирования
    if (editMode && initialComponentData) {
      componentData.id = initialComponentData.id;
    }

    try {
      const result = await onSave(componentData);
      console.log('✅ Save successful');

      // УВЕДОМЛЯЕМ ОБ ИЗМЕНЕНИИ PDF
      if (onPdfUpdate && componentData.id) {
        // Если есть PDF файл, вызываем колбэк
        if (pdfFile) {
          onPdfUpdate(componentData.id, true);
        } else if (editMode && !pdfFile && formData.pdf_filename) {
          // Если PDF был удален
          onPdfUpdate(componentData.id, false);
        }
      }

      setHasUnsavedChanges(false);
      setPdfFile(null); // Очищаем выбранный файл
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении компонента:', error);
      console.error('❌ Error saving component:', error);
      alert('Не удалось сохранить компонент');
    }
  };










  const handlePdfUpload = useCallback((e) => {
    handlePdfUploadUtil(e, setPdfFile, setErrors);
  }, []);

  const loadCategories = useCallback(async () => {
    await loadCategoriesUtil(setLocalCategories);
  }, []);

  const getCurrentDateTime = useCallback(() => {
    return getCurrentDateTimeUtil();
  }, []);

  const parseParameters = useCallback((parameters) => {
    return parseParametersUtil(parameters);
  }, []);

  const hasChangesCallback = useCallback(() => {
    return hasChangesUtil(formData, newParameters, imagePreview, editMode, originalData);
  }, [formData, newParameters, imagePreview, editMode, originalData]);

  const handleCloseWithConfirmation = useCallback(() => {
    handleCloseWithConfirmationUtil(
      hasUnsavedChanges,
      hasChangesCallback,
      handleSubmit,
      onClose
    );
  }, [hasUnsavedChanges, hasChangesCallback, handleSubmit, onClose]);

  const getFieldError = useCallback((fieldName) => {
    return getFieldErrorUtil(errors, fieldName);
  }, [errors]);

  const hasError = useCallback((fieldName) => {
    return hasErrorUtil(errors, fieldName);
  }, [errors]);

  const handleFieldChange = useCallback((field, value) => {
    handleFieldChangeUtil(field, value, setFormData, setErrors, errors);
  }, [errors]);

  const convertFileToArrayBuffer = useCallback((file) => {
    return convertFileToArrayBufferUtil(file);
  }, []);



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



        console.log('📝 Edit mode - initial data:', initialComponentData);

        // Получаем свежие данные из БД перед открытием
        const fetchFreshData = async () => {
          try {
            const freshData = await window.api.database.getComponent(initialComponentData.id);
            if (freshData) {
              // Используем свежие данные
              const original = {
                category_id: freshData.category_id || '',
                name: freshData.name || '',
                storage_cell: freshData.storage_cell || '',
                datasheet_url: freshData.datasheet_url || '',
                quantity: freshData.quantity || 0,
                parameters: freshData.parameters || {},
                description: freshData.description || '',
                image_data: freshData.image_data || null
              };
              setOriginalData(original);

              setFormData({
                category_id: freshData.category_id || '',
                name: freshData.name || '',
                storage_cell: freshData.storage_cell || '',
                datasheet_url: freshData.datasheet_url || '',
                quantity: freshData.quantity || 0,
                parameters: freshData.parameters || {},
                description: freshData.description || ''
              });

              const parametersArray = parseParameters(freshData.parameters);
              setNewParameters(parametersArray.length > 0 ? parametersArray : [{ key: '', value: '' }]);
              setImagePreview(freshData.image_data || null);
              setHasUnsavedChanges(false);
            }
          } catch (error) {
            console.error('❌ Error fetching fresh component data:', error);

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


          }
        };

        fetchFreshData();

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
      const changesExist = hasChangesCallback();
      setHasUnsavedChanges(changesExist);
    }
  }, [formData, newParameters, imagePreview, isOpen, editMode, hasChangesCallback]);

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




  const handleCancel = () => {
    handleCloseWithConfirmation();
  };

  if (!isOpen) return null;



  return (
    <div className="modal-overlay">
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
              <h3 className="section-title">Категория <span className="required-field"></span></h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <select
                    className={`form-control ${hasError('category_id') ? 'form-control-error' : ''}`}
                    value={formData.category_id}
                    onChange={(e) => handleFieldChange('category_id', e.target.value)}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {localCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {hasError('category_id') && (
                    <div className="form-error-message">{getFieldError('category_id')}</div>
                  )}
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
                    className={`form-control ${hasError('name') ? 'form-control-error' : ''}`}
                    placeholder="Введите название компонента"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    required
                  />
                  {hasError('name') && (
                    <div className="form-error-message">{getFieldError('name')}</div>
                  )}
                  <div className="form-hint">
                    {'Название должно быть от 2 до 100 символов'}
                  </div>
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
                    className={`form-control ${hasError('storage_cell') ? 'form-control-error' : ''}`}
                    placeholder="Например: A-12-5 (только буквы, цифры, пробелы и дефисы)"
                    value={formData.storage_cell}
                    onChange={(e) => handleFieldChange('storage_cell', e.target.value)}
                    maxLength={validationRules.storage_cell.maxLength}
                  />
                  {hasError('storage_cell') && (
                    <div className="form-error-message">{getFieldError('storage_cell')}</div>
                  )}
                  <div className="form-hint">
                    Максимум {validationRules.storage_cell.maxLength} символов
                  </div>
                </div>
              </div>
            </div>



            {/* Ссылка на datasheet */}
            <div className="form-section">
              <h3 className="section-title">Ссылка</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <input
                    type="url"
                    className={`form-control ${hasError('datasheet_url') ? 'form-control-error' : ''}`}
                    placeholder="https://example.com/datasheet.pdf"
                    value={formData.datasheet_url}
                    onChange={(e) => handleFieldChange('datasheet_url', e.target.value)}
                    maxLength={validationRules.datasheet_url.maxLength}
                  />
                  {hasError('datasheet_url') && (
                    <div className="form-error-message">{getFieldError('datasheet_url')}</div>
                  )}
                  <div className="form-hint">
                    Пример: https://example.com/document.pdf
                  </div>
                </div>
              </div>
            </div>




            {/* PDF Datasheet */}
            <div className="form-section">
              <h3 className="section-title">PDF Datasheet</h3>

              {hasError('pdf') && (
                <div className="form-error-message mb-2">{getFieldError('pdf')}</div>
              )}

              <div className="file-input-wrapper" >
                <input
                  type="file"
                  id="component-pdf"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfUpload}
                  className="file-input"
                />

                {!pdfFile && !formData.pdf_filename ? (
                  <label htmlFor="component-pdf" className="file-input-label">
                    <FaFileUpload size={14} />
                    Загрузить PDF
                  </label>
                ) : (
                  <div className="pdf-info-container">
                    <div className="pdf-info">
                      <FaFilePdf size={20} color="#e53e3e" />
                      <span className="pdf-filename">
                        {pdfFile ? pdfFile.name : formData.pdf_filename}
                      </span>
                      <span className="pdf-size">
                        ({(pdfFile ? pdfFile.size : formData.pdf_size) / 1024} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      className="pdf-remove-btn"
                      onClick={() => {
                        setPdfFile(null);
                        if (editMode && formData.pdf_filename) {
                          // Если в режиме редактирования, нужно будет удалить PDF при сохранении
                          setFormData(prev => ({
                            ...prev,
                            pdf_filename: null,
                            pdf_size: 0
                          }));
                        }
                      }}
                      title="Удалить PDF"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="form-hint">
                Максимальный размер: 10MB
              </div>
            </div>


            {/* Количество */}
            <div className="form-section">
              <h3 className="section-title">Количество</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <input
                    type="number"
                    className={`form-control ${hasError('quantity') ? 'form-control-error' : ''}`}
                    value={formData.quantity}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const numValue = rawValue === '' ? 0 : parseInt(rawValue, 10);

                      // Используем handleInputChange вместо handleFieldChange
                      handleInputChange('quantity', numValue);

                      // Сбрасываем ошибку
                      if (errors['quantity']) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors['quantity'];
                          return newErrors;
                        });
                      }
                    }}
                    min="0"
                    max="999999"
                    step="1"
                  />
                  {hasError('quantity') && (
                    <div className="form-error-message">{getFieldError('quantity')}</div>
                  )}
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
                    className={`form-control textarea-description ${hasError('description') ? 'form-control-error' : ''}`}
                    placeholder="Введите описание компонента и его применение..."
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows="4"
                    maxLength={validationRules.description.maxLength}
                  />
                  {hasError('description') && (
                    <div className="form-error-message">{getFieldError('description')}</div>
                  )}
                  <div className="form-hint text-right">
                    {formData.description?.length || 0}/{validationRules.description.maxLength} символов
                  </div>
                </div>
              </div>
            </div>






            {/* Параметры - ТАБЛИЧНЫЙ ВИД */}
            <div className="form-section">
              <h3 className="section-title">Параметры</h3>

              {hasError('parameters') && (
                <div className="form-error-message mb-2">{getFieldError('parameters')}</div>
              )}

              <div className="parameters-table-container">
                {/* Заголовок таблицы */}
                <div className="parameters-table-header">
                  <div className="parameter-name-header">
                    Параметр
                    <span className="parameter-hint">макс. {validationRules.parameters.keyMaxLength} симв.</span>
                  </div>
                  <div className="parameter-value-header">
                    Значение
                    <span className="parameter-hint">макс. {validationRules.parameters.valueMaxLength} симв.</span>
                  </div>
                  <div className="parameter-actions-header">Действия</div>
                </div>

                {/* Тело таблицы */}
                <div className="parameters-table-body">
                  {newParameters.map((param, index) => (
                    <div key={index} className="parameter-table-row">
                      {/* Поле названия параметра */}
                      <div className="parameter-name-cell">
                        <input
                          type="text"
                          className={`form-control parameter-input ${hasError(`paramKey_${index}`) ? 'form-control-error' : ''}`}
                          placeholder="Например: Напряжение питания"
                          value={param.key}
                          onChange={(e) => {
                            handleParameterChange(index, 'key', e.target.value);
                            if (errors[`paramKey_${index}`]) {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors[`paramKey_${index}`];
                                return newErrors;
                              });
                            }
                          }}
                          maxLength={validationRules.parameters.keyMaxLength}
                        />
                        {hasError(`paramKey_${index}`) && (
                          <div className="form-error-message small">{getFieldError(`paramKey_${index}`)}</div>
                        )}
                      </div>

                      {/* Поле значения параметра */}
                      <div className="parameter-value-cell">
                        <input
                          type="text"
                          className={`form-control parameter-input ${hasError(`paramValue_${index}`) ? 'form-control-error' : ''}`}
                          placeholder="Например: 5 В"
                          value={param.value}
                          onChange={(e) => {
                            handleParameterChange(index, 'value', e.target.value);
                            if (errors[`paramValue_${index}`]) {
                              setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors[`paramValue_${index}`];
                                return newErrors;
                              });
                            }
                          }}
                          maxLength={validationRules.parameters.valueMaxLength}
                        />
                        {hasError(`paramValue_${index}`) && (
                          <div className="form-error-message small">{getFieldError(`paramValue_${index}`)}</div>
                        )}
                      </div>

                      {/* Кнопка удаления */}
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

              {/* Счетчик параметров */}
              <div className="parameters-info">
                <div className="parameters-count">
                  Параметров: {newParameters.length} / {validationRules.parameters.maxCount}
                </div>
                {newParameters.length >= validationRules.parameters.maxCount && (
                  <div className="form-error-message">
                    Достигнуто максимальное количество параметров
                  </div>
                )}
              </div>

              {/* Кнопка добавления параметра (только если не превышен лимит) */}
              {newParameters.length < validationRules.parameters.maxCount && (
                <button
                  type="button"
                  className="add-param-btn table-add-btn"
                  onClick={addParameterField}
                >
                  + Добавить параметр
                </button>
              )}
            </div>

            <div className="divider"></div>


            {/* Изображение компонента */}
            <div className="form-section">
              <h3 className="section-title">Изображение компонента</h3>
              <div className="image-upload-section">
                {hasError('image') && (
                  <div className="form-error-message mb-2">{getFieldError('image')}</div>
                )}

                <div className="image-preview">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Предпросмотр" className="image-preview-img" />
                  ) : (
                    <div className="image-placeholder">
                      <span>Изображение не загружено</span>
                      <div className="image-hint">
                        Максимальный размер: 5MB<br />
                        Форматы: JPG, PNG, GIF, WebP
                      </div>
                    </div>
                  )}
                </div>

                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="component-image"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Валидация изображения
                        const imageError = validateImage(file);
                        if (imageError) {
                          setErrors(prev => ({ ...prev, image: imageError }));
                          return;
                        }

                        // Очищаем ошибку
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors['image'];
                          return newErrors;
                        });

                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setImagePreview(e.target.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="file-input"
                  />

                  <label htmlFor="component-image" className="file-input-label">
                    <FaFileUpload size={14} />
                    {imagePreview ? 'Заменить изображение' : 'Загрузить изображение'}
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

