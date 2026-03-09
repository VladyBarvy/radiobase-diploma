export const validationRules = {
  category_id: {
    required: true,
    message: 'Выберите категорию'
  },

  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Название должно быть от 2 до 100 символов'
  },

  storage_cell: {
    maxLength: 20,
    pattern: /^[A-Za-z0-9\- ]+$/,
    patternMessage: 'Только буквы, цифры, пробелы и дефисы'
  },

  //   datasheet_url: {
  //   pattern: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-.?%&=]*)?$/,
  //   patternMessage: 'Введите корректный URL (например: https://example.com)',
  //   maxLength: 500
  // },

  datasheet_url: {
    pattern: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/,
    patternMessage: 'Введите корректный URL (например: https://example.com)',
    maxLength: 500
  },

  quantity: {
    min: 0,
    max: 999999,
    message: 'Количество должно быть от 0 до 999999'
  },

  description: {
    maxLength: 1000,
    message: 'Описание не должно превышать 1000 символов'
  },

  parameters: {
    maxCount: 20,
    keyMaxLength: 50,
    valueMaxLength: 100
  },

  pdf: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxSizeMessage: 'Размер файла не должен превышать 10MB',
    allowedTypes: ['application/pdf'],
    allowedTypesMessage: 'Пожалуйста, выберите PDF файл'
  }

};

// Функция валидации
export const validateField = (fieldName, value, rules = validationRules) => {
  const rule = rules[fieldName];
  if (!rule) return null; // Нет правила - валидация проходит

  // Проверка на обязательность
  if (rule.required && (!value || value.toString().trim() === '')) {
    return rule.message || 'Это поле обязательно';
  }

  // Проверка минимальной длины
  if (rule.minLength && value && value.toString().length < rule.minLength) {
    return `Минимальная длина: ${rule.minLength} символов`;
  }

  // Проверка максимальной длины
  if (rule.maxLength && value && value.toString().length > rule.maxLength) {
    return `Максимальная длина: ${rule.maxLength} символов`;
  }

  // Проверка паттерна (регулярное выражение)
  if (rule.pattern && value && value.toString().trim() !== '') {
    if (!rule.pattern.test(value.toString())) {
      return rule.patternMessage || 'Неверный формат';
    }
  }

  // Проверка числового диапазона
  if (rule.min !== undefined && value !== undefined && value !== '') {
    const numValue = Number(value);
    if (numValue < rule.min) {
      return `Минимальное значение: ${rule.min}`;
    }
  }

  if (rule.max !== undefined && value !== undefined && value !== '') {
    const numValue = Number(value);
    if (numValue > rule.max) {
      return `Максимальное значение: ${rule.max}`;
    }
  }

  return null; // Все проверки пройдены
};

// Валидация всей формы
export const validateForm = (formData, parameters = []) => {
  const errors = {};

  // Валидация основных полей
  Object.keys(validationRules).forEach(field => {
    if (formData[field] !== undefined) {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    }
  });

  // Валидация параметров
  if (parameters.length > validationRules.parameters.maxCount) {
    errors.parameters = `Максимальное количество параметров: ${validationRules.parameters.maxCount}`;
  }

  parameters.forEach((param, index) => {
    if (param.key && param.key.length > validationRules.parameters.keyMaxLength) {
      errors[`paramKey_${index}`] = `Название параметра не должно превышать ${validationRules.parameters.keyMaxLength} символов`;
    }
    if (param.value && param.value.length > validationRules.parameters.valueMaxLength) {
      errors[`paramValue_${index}`] = `Значение параметра не должно превышать ${validationRules.parameters.valueMaxLength} символов`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateImage = (file) => {
  if (!file) return null;

  // Максимальный размер 5MB
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'Размер файла не должен превышать 5MB';
  }

  // Допустимые форматы
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Допустимые форматы: JPG, PNG, GIF, WebP';
  }

  return null;
};

