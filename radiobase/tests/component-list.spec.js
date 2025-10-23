import { test, expect } from '@playwright/test';

// Мок-данные для тестирования ATmega328
const mockComponentData = {
  id: 1,
  name: 'ATmega328',
  category_id: 4,
  category_name: 'Микросхемы',
  storage_cell: 'A-15-3',
  datasheet_url: 'https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf',
  quantity: 25,
  updated_at: '2024-01-15T14:30:00.000Z',
  parameters: JSON.stringify({
    'Архитектура': 'AVR',
    'Тактовая частота': '20 МГц',
    'Флеш-память': '32 КБ',
    'ОЗУ': '2 КБ',
    'EEPROM': '1 КБ',
    'Напряжение питания': '1.8-5.5 В',
    'Количество выводов': '28',
    'Интерфейсы': 'SPI, I2C, UART'
  }),
  image_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  description: '8-битный микроконтроллер AVR с расширенными периферийными устройствами. Идеально подходит для проектов Arduino.'
};

const mockCategories = [
  { id: 1, name: 'Транзисторы' },
  { id: 2, name: 'Резисторы' },
  { id: 3, name: 'Конденсаторы' },
  { id: 4, name: 'Микросхемы' },
  { id: 5, name: 'Диоды' }
];

const mockComponents = [
  mockComponentData
];

test.describe('ComponentList - отображение карточки ATmega328', () => {
  test.beforeEach(async ({ page }) => {
    // Мокаем window.api вызовы перед загрузкой страницы
    await page.addInitScript(() => {
      // Мокаем объект window.api
      window.api = {
        database: {
          getCategories: () => Promise.resolve([
            { id: 1, name: 'Транзисторы' },
            { id: 2, name: 'Резисторы' },
            { id: 3, name: 'Конденсаторы' },
            { id: 4, name: 'Микросхемы' },
            { id: 5, name: 'Диоды' }
          ]),
          getComponents: (categoryId) => Promise.resolve([
            {
              id: 1,
              name: 'ATmega328',
              category_id: 4,
              category_name: 'Микросхемы',
              storage_cell: 'A-15-3',
              datasheet_url: 'https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf',
              quantity: 25,
              updated_at: '2024-01-15T14:30:00.000Z',
              parameters: JSON.stringify({
                'Архитектура': 'AVR',
                'Тактовая частота': '20 МГц',
                'Флеш-память': '32 КБ',
                'ОЗУ': '2 КБ',
                'EEPROM': '1 КБ',
                'Напряжение питания': '1.8-5.5 В',
                'Количество выводов': '28',
                'Интерфейсы': 'SPI, I2C, UART'
              }),
              image_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
              description: '8-битный микроконтроллер AVR с расширенными периферийными устройствами. Идеально подходит для проектов Arduino.'
            }
          ]),
          getComponent: (id) => Promise.resolve({
            id: 1,
            name: 'ATmega328',
            category_id: 4,
            category_name: 'Микросхемы',
            storage_cell: 'A-15-3',
            datasheet_url: 'https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf',
            quantity: 25,
            updated_at: '2024-01-15T14:30:00.000Z',
            parameters: JSON.stringify({
              'Архитектура': 'AVR',
              'Тактовая частота': '20 МГц',
              'Флеш-память': '32 КБ',
              'ОЗУ': '2 КБ',
              'EEPROM': '1 КБ',
              'Напряжение питания': '1.8-5.5 В',
              'Количество выводов': '28',
              'Интерфейсы': 'SPI, I2C, UART'
            }),
            image_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            description: '8-битный микроконтроллер AVR с расширенными периферийными устройствами. Идеально подходит для проектов Arduino.'
          }),
          addCategory: () => Promise.resolve({ success: true, id: 6 }),
          deleteCategory: () => Promise.resolve({ success: true }),
          addComponent: () => Promise.resolve({ success: true, id: 2 }),
          updateComponent: () => Promise.resolve({ success: true }),
          deleteComponent: () => Promise.resolve({ success: true }),
          searchComponents: () => Promise.resolve([]),
          getDatabaseStats: () => Promise.resolve({}),
          checkIntegrity: () => Promise.resolve({ success: true })
        }
      };

      // Также мокаем window.electron если он используется
      window.electron = {
        shell: {
          openExternal: (url) => {
            console.log('Opening external URL:', url);
            return Promise.resolve();
          }
        }
      };
    });

    // Переходим на страницу приложения
    await page.goto('/');
    
    // Ждем загрузки приложения
    await page.waitForSelector('.app', { timeout: 30000 });
    
    // Ждем загрузки категорий
    await page.waitForSelector('.sidebar__category-button', { timeout: 15000 });
    
    console.log('Categories loaded, clicking on Микросхемы...');
    
    // Кликаем на категорию "Микросхемы"
    const microcontrollerCategory = page.locator('.sidebar__category-button', { hasText: 'Микросхемы' });
    await microcontrollerCategory.click();
    
    // Ждем раскрытия категории
    await page.waitForTimeout(2000);
    
    console.log('Category expanded, looking for ATmega328...');
    
    // Ждем появления компонентов и кликаем на ATmega328
    await page.waitForSelector('.sidebar__component-button', { timeout: 10000 });
    const atmegaComponent = page.locator('.sidebar__component-button', { hasText: 'ATmega328' });
    await atmegaComponent.click();
    
    // Ждем загрузки карточки компонента
    await page.waitForSelector('.component-card', { timeout: 15000 });
    
    console.log('Component card loaded successfully');
  });

  test('должна отображаться основная информация о компоненте', async ({ page }) => {
    // Проверяем заголовок
    await expect(page.locator('.component-title')).toHaveText('ATmega328');
    
    // Проверяем категорию
    await expect(page.locator('.info-row:has(.info-label:text("Категория:")) .info-value'))
      .toHaveText('Микросхемы');
    
    // Проверяем ячейку хранения
    await expect(page.locator('.info-row:has(.info-label:text("Ячейка:")) .info-value'))
      .toHaveText('A-15-3');
    
    // Проверяем количество
    await expect(page.locator('.info-row:has(.info-label:text("Количество:")) .info-value'))
      .toHaveText('25');
  });

  test('должна отображаться ссылка на datasheet', async ({ page }) => {
    const datasheetLink = page.locator('.datasheet-link');
    await expect(datasheetLink).toHaveText('Открыть');
    await expect(datasheetLink).toHaveAttribute('href', mockComponentData.datasheet_url);
  });

  test('должна отображаться дата обновления в правильном формате', async ({ page }) => {
    const dateElement = page.locator('.info-row:has(.info-label:text("Обновлён:")) .info-value');
    await expect(dateElement).toBeVisible();
    
    const dateText = await dateElement.textContent();
    // Проверяем, что дата отображается в правильном формате
    expect(dateText).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });

  test('должно отображаться описание компонента', async ({ page }) => {
    const descriptionSection = page.locator('.description-section');
    await expect(descriptionSection).toBeVisible();
    
    const descriptionContent = page.locator('.description-content');
    await expect(descriptionContent).toHaveText(mockComponentData.description);
  });

  test('должна отображаться таблица параметров', async ({ page }) => {
    const parametersSection = page.locator('.parameters-section-full');
    await expect(parametersSection).toBeVisible();
    
    // Проверяем заголовок секции
    await expect(parametersSection.locator('.section-title')).toHaveText('Параметры');
    
    // Проверяем наличие таблицы
    const parametersTable = page.locator('.parameters-table');
    await expect(parametersTable).toBeVisible();
    
    // Проверяем несколько ключевых параметров
    await expect(page.locator('.parameter-name-cell:has-text("Архитектура")')).toBeVisible();
    await expect(page.locator('.parameter-value-cell:has-text("AVR")')).toBeVisible();
    
    await expect(page.locator('.parameter-name-cell:has-text("Тактовая частота")')).toBeVisible();
    await expect(page.locator('.parameter-value-cell:has-text("20 МГц")')).toBeVisible();
  });

  test('должно отображаться изображение компонента', async ({ page }) => {
    const imageSection = page.locator('.image-section-right');
    await expect(imageSection).toBeVisible();
    
    const componentImage = page.locator('.component-image');
    await expect(componentImage).toBeVisible();
    await expect(componentImage).toHaveAttribute('src', mockComponentData.image_data);
  });

  test('должна быть доступна кнопка редактирования', async ({ page }) => {
    const editButton = page.locator('.btn-edit-component');
    await expect(editButton).toBeVisible();
    await expect(editButton).toHaveText('Редактировать');
    await expect(editButton).toBeEnabled();
  });
});

test.describe('ComponentList - обработка различных сценариев', () => {
  test('должна корректно отображаться карточка при отсутствии некоторых данных', async ({ page }) => {
    // Мокаем данные с отсутствующими полями
    await page.addInitScript(() => {
      window.api = {
        database: {
          getCategories: () => Promise.resolve([
            { id: 4, name: 'Микросхемы' }
          ]),
          getComponents: () => Promise.resolve([
            {
              id: 1,
              name: 'ATmega328',
              category_id: 4,
              category_name: 'Микросхемы',
              storage_cell: null,
              datasheet_url: null,
              quantity: 0,
              updated_at: '2024-01-15T14:30:00.000Z',
              parameters: JSON.stringify({}),
              image_data: null,
              description: null
            }
          ]),
          getComponent: () => Promise.resolve({
            id: 1,
            name: 'ATmega328 Incomplete',
            category_id: 4,
            category_name: 'Микросхемы',
            storage_cell: null,
            datasheet_url: null,
            quantity: 0,
            updated_at: '2024-01-15T14:30:00.000Z',
            parameters: JSON.stringify({}),
            image_data: null,
            description: null
          }),
          // остальные методы...
          addCategory: () => Promise.resolve({ success: true }),
          deleteCategory: () => Promise.resolve({ success: true }),
          addComponent: () => Promise.resolve({ success: true }),
          updateComponent: () => Promise.resolve({ success: true }),
          deleteComponent: () => Promise.resolve({ success: true }),
          searchComponents: () => Promise.resolve([]),
          getDatabaseStats: () => Promise.resolve({}),
          checkIntegrity: () => Promise.resolve({ success: true })
        }
      };
    });

    await page.goto('/');
    await page.waitForSelector('.sidebar__category-button');
    await page.click('.sidebar__category-button:has-text("Микросхемы")');
    await page.waitForTimeout(1000);
    await page.click('.sidebar__component-button:has-text("ATmega328")');
    await page.waitForSelector('.component-card');

    // Проверяем отображение дефолтных значений
    await expect(page.locator('.info-row:has(.info-label:text("Ячейка:")) .info-value'))
      .toHaveText('-');
    
    await expect(page.locator('.info-row:has(.info-label:text("Datasheet:")) .info-value'))
      .toHaveText('-');
    
    // Проверяем placeholder для изображения
    await expect(page.locator('.image-placeholder')).toBeVisible();
    
    // Проверяем сообщение об отсутствии параметров
    await expect(page.locator('.no-parameters')).toBeVisible();
  });
});

// Простой тест для отладки
test('базовый тест загрузки приложения', async ({ page }) => {
  await page.addInitScript(() => {
    window.api = {
      database: {
        getCategories: () => Promise.resolve([
          { id: 1, name: 'Тестовая категория' }
        ]),
        getComponents: () => Promise.resolve([]),
        getComponent: () => Promise.resolve(null),
        addCategory: () => Promise.resolve({ success: true }),
        deleteCategory: () => Promise.resolve({ success: true }),
        addComponent: () => Promise.resolve({ success: true }),
        updateComponent: () => Promise.resolve({ success: true }),
        deleteComponent: () => Promise.resolve({ success: true }),
        searchComponents: () => Promise.resolve([]),
        getDatabaseStats: () => Promise.resolve({}),
        checkIntegrity: () => Promise.resolve({ success: true })
      }
    };
  });

  await page.goto('/');
  await page.waitForSelector('.app');
  
  // Проверяем, что приложение загрузилось
  await expect(page.locator('.app')).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
  
  console.log('Basic app load test passed');
});
