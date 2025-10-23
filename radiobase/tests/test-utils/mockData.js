// Утилита для создания мок-данных компонентов
export const createMockComponent = (overrides = {}) => {
  const defaultComponent = {
    id: 1,
    name: 'ATmega328',
    category_id: 4,
    category_name: 'Микросхемы',
    storage_cell: 'A-15-3',
    datasheet_url: 'https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf',
    quantity: 25,
    updated_at: new Date().toISOString(),
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
    description: '8-битный микроконтроллер AVR с расширенными периферийными устройствами.'
  };

  return { ...defaultComponent, ...overrides };
};

export const mockCategories = [
  { id: 1, name: 'Транзисторы' },
  { id: 2, name: 'Резисторы' },
  { id: 3, name: 'Конденсаторы' },
  { id: 4, name: 'Микросхемы' },
  { id: 5, name: 'Диоды' }
];
