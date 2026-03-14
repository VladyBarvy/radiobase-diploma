// Проверка, похожа ли строка на JSON
export const looksLikeJsonString = (str) => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  return (
    trimmed.startsWith('{') || 
    trimmed.startsWith('[') || 
    /^[0-9"truefalsenull]/.test(trimmed)
  );
};

// Обработка загрузки PDF
export const handlePdfUpload = (e, setPdfFile, setErrors) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type !== 'application/pdf') {
    setErrors(prev => ({ ...prev, pdf: 'Пожалуйста, выберите PDF файл' }));
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    setErrors(prev => ({ ...prev, pdf: 'Размер файла не должен превышать 10MB' }));
    return;
  }

  setErrors(prev => {
    const newErrors = { ...prev };
    delete newErrors['pdf'];
    return newErrors;
  });

  setPdfFile(file);
  console.log('📄 PDF file selected:', file.name, file.size);
};

// Загрузка категорий
export const loadCategories = async (setLocalCategories) => {
  try {
    const categoriesData = await window.api.database.getCategories();
    setLocalCategories(categoriesData);
  } catch (error) {
    console.error('❌ Ошибка загрузки категорий:', error);
  }
};

// Получение текущей даты и времени
export const getCurrentDateTime = () => {
  const now = new Date();
  return now.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Парсинг параметров
export const parseParameters = (parameters) => {
  if (!parameters) return [];

  console.log('🔍 Parsing parameters:', parameters);

  if (Array.isArray(parameters)) {
    return parameters;
  }

  if (typeof parameters === 'object' && parameters !== null) {
    const keys = Object.keys(parameters);

    if (keys.length > 0 && keys.every(key => !isNaN(key))) {
      console.log('⚠️ Parameters appear to be a parsed string, trying to reconstruct...');
      
      const reconstructedString = keys.map(key => parameters[key]).join('');
      console.log('🔍 Reconstructed string:', reconstructedString);

      if (!looksLikeJsonString(reconstructedString)) {
        console.error('❌ Reconstructed string does not look like JSON:', reconstructedString);
        return [{ key: '', value: '' }];
      }

      try {
        const parsed = JSON.parse(reconstructedString);
        console.log('✅ Successfully parsed reconstructed parameters:', parsed);
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value)
        }));
      } catch (error) {
        console.error('❌ Failed to parse reconstructed string:', error);
        return [{ key: '', value: '' }];
      }
    }

    console.log('✅ Normal parameters object:', parameters);
    return Object.entries(parameters).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  }

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

// Проверка наличия несохраненных изменений
export const hasChanges = (formData, newParameters, imagePreview, editMode, originalData) => {
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
};

// Обработчик закрытия с подтверждением
export const handleCloseWithConfirmation = (
  hasUnsavedChanges, 
  hasChangesFn, 
  handleSubmit, 
  onClose
) => {
  if (hasUnsavedChanges && hasChangesFn()) {
    const shouldSave = window.confirm(
      'У вас есть несохраненные изменения. Хотите сохранить перед закрытием?'
    );

    if (shouldSave) {
      handleSubmit(new Event('submit'));
    } else {
      onClose();
    }
  } else {
    onClose();
  }
};

// Получение ошибки поля
export const getFieldError = (errors, fieldName) => {
  return errors[fieldName];
};

// Проверка наличия ошибки
export const hasError = (errors, fieldName) => {
  return !!errors[fieldName];
};

// Обработка изменения поля
export const handleFieldChange = (
  field, 
  value, 
  setFormData, 
  setErrors, 
  errors
) => {
  console.log(`🔄 Field change: ${field} =`, value, `(type: ${typeof value})`);

  if (field === 'quantity') {
    const numValue = typeof value === 'string' && value.trim() === ''
      ? 0
      : Number(value) || 0;

    console.log(`🔢 Processed quantity: ${value} -> ${numValue}`);

    setFormData(prev => ({
      ...prev,
      [field]: numValue
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }

  if (errors[field]) {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }
};

// Конвертация файла в ArrayBuffer
export const convertFileToArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
