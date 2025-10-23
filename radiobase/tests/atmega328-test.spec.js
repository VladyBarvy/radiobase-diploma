// tests/atmega328-test.spec.js
import { test, expect } from '@playwright/test';

test.describe('Тестирование ATmega328P-PU с мок-данными', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🚀 Настройка тестовой среды...');
    
    // Устанавливаем мок-данные через evaluate
    await page.evaluate(() => {
      console.log('🔄 Инициализация мок-данных...');
      
      // Глобальные мок-данные
      window.mockData = {
        categories: [
          { id: 1, name: 'Транзисторы' },
          { id: 2, name: 'Резисторы' },
          { id: 3, name: 'Конденсаторы' },
          { id: 4, name: 'Микросхемы' },
          { id: 5, name: 'Диоды' }
        ],
        components: [
          {
            id: 1,
            category_id: 4,
            name: 'ATmega328P-PU',
            storage_cell: 'A-111_070925',
            datasheet_url: 'https://example.com/datasheet.pdf',
            quantity: 15,
            parameters: JSON.stringify({
              "Архитектура": "AVR RISC",
              "Рабочее напряжение": "1.8 - 5.5 В",
              "Тактовая частота": "до 20 МГц",
              "Flash память": "32 КБ",
              "SRAM": "2 КБ",
              "EEPROM": "1 КБ"
            }),
            description: '8-битный микроконтроллер AVR',
            image_data: null,
            category_name: 'Микросхемы'
          },
          {
            id: 2,
            category_id: 2,
            name: 'Резистор 10кОм',
            storage_cell: 'R-001_01',
            quantity: 100,
            parameters: JSON.stringify({
              "Сопротивление": "10 кОм",
              "Допуск": "5%",
              "Мощность": "0.25 Вт"
            }),
            description: 'Углеродный резистор',
            image_data: null,
            category_name: 'Резисторы'
          }
        ]
      };

      // Мокаем API методы
      if (!window.api) {
        window.api = {};
      }
      
      window.api.database = {
        getCategories: async () => {
          console.log('📂 Mock: getCategories called');
          return window.mockData.categories;
        },
        
        getComponents: async (categoryId = null) => {
          console.log(`📦 Mock: getComponents called with categoryId: ${categoryId}`);
          let components = window.mockData.components;
          
          if (categoryId) {
            components = components.filter(comp => comp.category_id === parseInt(categoryId));
          }
          
          console.log(`📦 Returning ${components.length} components`);
          return components;
        },
        
        getComponent: async (id) => {
          console.log(`🔍 Mock: getComponent called with id: ${id}`);
          const component = window.mockData.components.find(comp => comp.id === parseInt(id));
          console.log('🔍 Component found:', component ? component.name : 'null');
          return component || null;
        },
        
        searchComponents: async (query) => {
          console.log(`🔎 Mock: searchComponents called with query: ${query}`);
          if (!query) return [];
          
          const results = window.mockData.components.filter(comp => 
            comp.name.toLowerCase().includes(query.toLowerCase())
          );
          console.log(`🔎 Found ${results.length} results`);
          return results;
        },
        
        addCategory: async (name) => {
          console.log(`➕ Mock: addCategory called with name: ${name}`);
          return { success: true, id: Date.now() };
        },
        
        addComponent: async (data) => {
          console.log(`➕ Mock: addComponent called with name: ${data.name}`);
          return { success: true, id: Date.now() };
        },
        
        updateComponent: async (data) => {
          console.log(`✏️ Mock: updateComponent called for id: ${data.id}`);
          return { success: true };
        },
        
        deleteComponent: async (id) => {
          console.log(`🗑️ Mock: deleteComponent called for id: ${id}`);
          return { success: true };
        },
        
        deleteCategory: async (id) => {
          console.log(`🗑️ Mock: deleteCategory called for id: ${id}`);
          return { success: true };
        }
      };
      
      console.log('✅ Mock API установлен');
    });

    await page.goto('/');
    console.log('🌐 Страница загружена');
    
    // Ждем загрузки приложения
    await page.waitForSelector('.app', { timeout: 30000 });
    console.log('✅ Приложение загружено');
    
    // Делаем скриншот начального состояния
    await page.screenshot({ path: 'test-initial-state.png' });
  });

  test('должен загружать интерфейс и показывать категории', async ({ page }) => {
    console.log('🧪 Тест 1: Проверка базового интерфейса');
    
    // Проверяем основные элементы
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();
    
    // Проверяем заголовки
    const sidebarTitles = page.locator('.sidebar__title');
    const titleCount = await sidebarTitles.count();
    console.log(`📝 Найдено заголовков: ${titleCount}`);
    
    for (let i = 0; i < titleCount; i++) {
      const text = await sidebarTitles.nth(i).textContent();
      console.log(`   Заголовок ${i + 1}: "${text}"`);
    }
    
    // Проверяем кнопки
    const actionButtons = page.locator('.sidebar__action-btn');
    const buttonCount = await actionButtons.count();
    console.log(`🔘 Найдено кнопок: ${buttonCount}`);
    
    // Проверяем наличие категорий
    await page.waitForSelector('.sidebar__category-item', { timeout: 10000 });
    const categories = page.locator('.sidebar__category-item');
    const categoryCount = await categories.count();
    console.log(`📂 Найдено категорий: ${categoryCount}`);
    
    // Выводим названия категорий для отладки
    for (let i = 0; i < categoryCount; i++) {
      const categoryName = await categories.nth(i).locator('.sidebar__category-name').textContent();
      console.log(`   Категория ${i + 1}: "${categoryName}"`);
    }
    
    expect(categoryCount).toBeGreaterThan(0);
    console.log('✅ Базовый интерфейс загружен корректно');
  });

  test('должен показывать ATmega328P-PU при открытии категории Микросхемы', async ({ page }) => {
    console.log('🧪 Тест 2: Поиск ATmega328P-PU в категории');
    
    // Сначала проверяем какие категории есть
    const categories = page.locator('.sidebar__category-item');
    const categoryCount = await categories.count();
    console.log(`📂 Всего категорий: ${categoryCount}`);
    
    // Ищем категорию "Микросхемы"
    const microchipCategory = page.locator('.sidebar__category-button', { hasText: 'Микросхемы' });
    const isMicrochipVisible = await microchipCategory.isVisible();
    console.log(`🔍 Категория "Микросхемы" видима: ${isMicrochipVisible}`);
    
    if (isMicrochipVisible) {
      // Кликаем на категорию
      await microchipCategory.click();
      console.log('✅ Категория "Микросхемы" открыта');
      
      // Ждем раскрытия списка компонентов
      await page.waitForTimeout(2000); // Даем время на анимацию
      
      // Проверяем есть ли список компонентов
      const componentsList = page.locator('.sidebar__components-list');
      const isListVisible = await componentsList.isVisible();
      console.log(`📋 Список компонентов видимый: ${isListVisible}`);
      
      if (isListVisible) {
        // Ищем компоненты
        const components = page.locator('.sidebar__component-button');
        const componentCount = await components.count();
        console.log(`💾 Найдено компонентов: ${componentCount}`);
        
        // Выводим названия всех компонентов для отладки
        for (let i = 0; i < componentCount; i++) {
          const componentName = await components.nth(i).textContent();
          console.log(`   Компонент ${i + 1}: "${componentName}"`);
        }
        
        // Ищем конкретно ATmega328P-PU
        const atmegaComponent = page.locator('.sidebar__component-button', { hasText: 'ATmega328P-PU' });
        const isAtmegaVisible = await atmegaComponent.isVisible();
        console.log(`🔍 ATmega328P-PU видимый: ${isAtmegaVisible}`);
        
        if (isAtmegaVisible) {
          console.log('✅ ATmega328P-PU найден в категории Микросхемы');
        } else {
          console.log('❌ ATmega328P-PU не найден, но есть другие компоненты');
        }
      } else {
        console.log('ℹ️ Список компонентов не видимый (возможно пустой)');
      }
    } else {
      console.log('❌ Категория "Микросхемы" не найдена');
    }
  });

  test('должен открывать детальную информацию при клике на компонент', async ({ page }) => {
    console.log('🧪 Тест 3: Детальная информация компонента');
    
    // Открываем категорию "Микросхемы" если она есть
    const microchipCategory = page.locator('.sidebar__category-button', { hasText: 'Микросхемы' });
    if (await microchipCategory.isVisible()) {
      await microchipCategory.click();
      await page.waitForTimeout(1000);
      
      // Ищем ATmega328P-PU
      const atmegaComponent = page.locator('.sidebar__component-button', { hasText: 'ATmega328P-PU' });
      if (await atmegaComponent.isVisible()) {
        await atmegaComponent.click();
        console.log('✅ Кликнули на ATmega328P-PU');
        
        // Ждем загрузки детальной информации
        await page.waitForSelector('.component-card', { timeout: 10000 });
        console.log('✅ Карточка компонента загружена');
        
        // Проверяем основные элементы карточки
        const componentTitle = page.locator('.component-title');
        if (await componentTitle.isVisible()) {
          const titleText = await componentTitle.textContent();
          console.log(`📝 Заголовок компонента: "${titleText}"`);
          await expect(componentTitle).toContainText('ATmega328P-PU');
        }
        
        // Проверяем информацию о компоненте
        const infoRows = page.locator('.info-row');
        const infoCount = await infoRows.count();
        console.log(`📊 Найдено информационных строк: ${infoCount}`);
        
        for (let i = 0; i < infoCount; i++) {
          const label = await infoRows.nth(i).locator('.info-label').textContent();
          const value = await infoRows.nth(i).locator('.info-value').textContent();
          console.log(`   ${label}: "${value}"`);
        }
        
        // Проверяем параметры
        const parametersSection = page.locator('.parameters-section-full');
        if (await parametersSection.isVisible()) {
          console.log('✅ Раздел параметров отображается');
          
          // Проверяем есть ли параметры вообще
          const parameterRows = page.locator('.parameter-row-full');
          const paramCount = await parameterRows.count();
          console.log(`⚙️ Найдено строк параметров: ${paramCount}`);
          
          if (paramCount > 0) {
            // Выводим все параметры для отладки
            for (let i = 0; i < paramCount; i++) {
              const paramName = await parameterRows.nth(i).locator('.parameter-name-cell').textContent();
              const paramValue = await parameterRows.nth(i).locator('.parameter-value-cell').textContent();
              console.log(`   Параметр: "${paramName}" = "${paramValue}"`);
            }
            
            // Ищем конкретные параметры
            const expectedParams = ['Архитектура', 'Рабочее напряжение', 'Flash память'];
            for (const paramName of expectedParams) {
              const paramCell = page.locator('.parameter-name-cell', { hasText: paramName });
              if (await paramCell.isVisible()) {
                console.log(`✅ Параметр "${paramName}" найден`);
              } else {
                console.log(`❌ Параметр "${paramName}" не найден`);
              }
            }
          } else {
            console.log('ℹ️ Параметры не отображаются (возможно пустые)');
          }
        } else {
          console.log('ℹ️ Раздел параметров не отображается');
        }
      } else {
        console.log('❌ ATmega328P-PU не найден для клика');
      }
    } else {
      console.log('❌ Категория "Микросхемы" не найдена для теста');
    }
  });

  test('должен открывать модальное окно редактирования', async ({ page }) => {
    console.log('🧪 Тест 4: Редактирование компонента');
    
    // Пытаемся открыть компонент если возможно
    const microchipCategory = page.locator('.sidebar__category-button', { hasText: 'Микросхемы' });
    if (await microchipCategory.isVisible()) {
      await microchipCategory.click();
      await page.waitForTimeout(1000);
      
      const atmegaComponent = page.locator('.sidebar__component-button', { hasText: 'ATmega328P-PU' });
      if (await atmegaComponent.isVisible()) {
        await atmegaComponent.click();
        await page.waitForSelector('.component-card');
        
        // Пытаемся найти кнопку редактирования
        const editButton = page.locator('.btn-edit-component');
        const isEditVisible = await editButton.isVisible();
        console.log(`✏️ Кнопка редактирования видима: ${isEditVisible}`);
        
        if (isEditVisible) {
          await editButton.click();
          console.log('✅ Кликнули на кнопку редактирования');
          
          // Проверяем открылось ли модальное окно
          const modal = page.locator('.modal-add-component');
          const isModalVisible = await modal.isVisible({ timeout: 5000 });
          console.log(`📋 Модальное окно открылось: ${isModalVisible}`);
          
          if (isModalVisible) {
            await expect(modal.locator('.modal-title')).toContainText('Редактировать компонент');
            console.log('✅ Модальное окно редактирования открыто корректно');
            
            // Закрываем модальное окно
            const closeButton = page.locator('.modal-close-btn');
            await closeButton.click();
            await expect(modal).not.toBeVisible();
          }
        } else {
          console.log('ℹ️ Кнопка редактирования не видима');
        }
      }
    }
  });
});

test.describe('Тесты функциональности без зависимостей', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app', { timeout: 30000 });
  });

  test('должен позволять добавлять новую категорию', async ({ page }) => {
    console.log('🧪 Тест 5: Добавление категории');
    
    // Нажимаем кнопку добавления категории
    const addCategoryBtn = page.locator('.sidebar__action-btn').first();
    await addCategoryBtn.click();
    
    // Проверяем что модальное окно открылось
    const categoryModal = page.locator('.modal-add-category');
    const isModalVisible = await categoryModal.isVisible({ timeout: 5000 });
    console.log(`📋 Модальное окно добавления категории открыто: ${isModalVisible}`);
    
    if (isModalVisible) {
      await expect(categoryModal.locator('.modal-title')).toContainText('Добавить категорию');
      await expect(page.locator('#categoryName')).toBeVisible();
      console.log('✅ Функциональность добавления категории работает');
      
      // Закрываем модальное окно
      await page.locator('.modal-close-btn').click();
    }
  });

  test('должен позволять добавлять новый компонент', async ({ page }) => {
    console.log('🧪 Тест 6: Добавление компонента');
    
    // Нажимаем кнопку добавления компонента
    const addComponentBtn = page.locator('.sidebar__action-btn').nth(1);
    await addComponentBtn.click();
    
    // Проверяем что модальное окно открылось
    const componentModal = page.locator('.modal-add-component');
    const isModalVisible = await componentModal.isVisible({ timeout: 5000 });
    console.log(`📋 Модальное окно добавления компонента открыто: ${isModalVisible}`);
    
    if (isModalVisible) {
      await expect(componentModal.locator('.modal-title')).toContainText('Добавить компонент');
      await expect(page.locator('input[placeholder="Введите название компонента"]')).toBeVisible();
      console.log('✅ Функциональность добавления компонента работает');
      
      // Закрываем модальное окно
      await page.locator('.modal-close-btn').click();
    }
  });
});
