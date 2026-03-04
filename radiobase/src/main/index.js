import { app, shell, BrowserWindow, ipcMain } from 'electron'
 import { nativeImage } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon_3 from '../../resources/icon_3.png?asset'
import ComponentsDatabase from './database'

let mainWindow;
let db;

function createWindow() {




  let icon
  
  // Определяем путь и формат иконки в зависимости от платформы
  if (process.platform === 'win32') {
    // Для Windows используем .ico
    const iconPath = join(__dirname, '../../resources/icon_3.ico')
    
    // Проверяем существование файла
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath)
      console.log('📊 ICO file info:', {
        path: iconPath,
        size: fs.statSync(iconPath).size,
        imageSize: icon.getSize(),
        isEmpty: icon.isEmpty()
      })
      
      // Если иконка всё ещё пустая, пробуем загрузить как PNG и конвертировать
      if (icon.isEmpty()) {
        console.log('⚠️ ICO is empty, trying PNG fallback...')
        const pngPath = join(__dirname, '../../resources/icon_3.png')
        if (fs.existsSync(pngPath)) {
          icon = nativeImage.createFromPath(pngPath)
        }
      }
    } else {
      // Если .ico не найден, используем .png
      const pngPath = join(__dirname, '../../resources/icon_3.png')
      if (fs.existsSync(pngPath)) {
        icon = nativeImage.createFromPath(pngPath)
      }
    }
  } else {
    // Для Linux/Mac используем .png
    const pngPath = join(__dirname, '../../resources/icon_3.png')
    if (fs.existsSync(pngPath)) {
      icon = nativeImage.createFromPath(pngPath)
    }
  }



  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,



icon: icon, // Используем nativeImage

    // icon: icon_3, 
    // ...(process.platform === 'linux' ? { icon_3 } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // // Всегда показываем DevTools в разработке и для отладки
  // if (is.dev) {
  //   mainWindow.webContents.openDevTools()
  // } else {
  //   // В продакшене тоже оставляем возможность открыть DevTools
  //   mainWindow.webContents.on('did-frame-finish-load', () => {
  //     mainWindow.webContents.openDevTools()
  //   })
  // }

  // Запуск в полноэкранном режиме
  mainWindow.maximize()

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    console.log('🚀 Main window ready to show')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }



  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`📱 Renderer Console [${level}]: ${message}`)
  })




    // Дополнительно устанавливаем иконку после создания окна
  if (icon && !icon.isEmpty()) {
    mainWindow.setIcon(icon)
  }

  

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {



  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  console.log('🎯 App is ready, initializing database...')

  // Initialize database and setup handlers with small delay
  initializeApp()
})

// Функция для инициализации приложения
async function initializeApp() {
  try {

    console.log('🎯 App initialization started...');
    console.log('📁 Process info:', {
      execPath: process.execPath,
      cwd: process.cwd(),
      portableExecutable: process.env.PORTABLE_EXECUTABLE_FILE,
      appPath: app.getAppPath(),
      isPackaged: app.isPackaged
    });

    console.log('🗄️ Starting database initialization...')

    // Инициализируем базу данных
    db = new ComponentsDatabase()

    // Ждем завершения инициализации БД
    await db.initPromise;
    console.log('✅ Database initialized successfully')

    // Настраиваем обработчики IPC
    setupDatabaseHandlers()
    console.log('✅ Database IPC handlers registered')

    // Создаем окно после инициализации БД
    mainWindow = createWindow()

    // Логируем путь к БД
    const stats = await db.getDatabaseStats()
    console.log('📊 Database stats:', stats)

  } catch (error) {
    console.error('❌ Database initialization failed:', error)

    // Показываем подробную информацию об ошибке
    console.error('🔍 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      path: error.path
    })

    // Все равно создаем окно, но с ошибкой
    mainWindow = createWindow()

    // Отправляем ошибку в renderer process
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('database-error', error.message)
    })
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Close database when app quits
app.on('before-quit', () => {
  console.log('🛑 App is quitting, closing database...')
  if (db) {
    db.close()
    console.log('✅ Database closed')
  }
})

// Database IPC handlers
function setupDatabaseHandlers() {
  if (!db) {
    console.error('❌ Database not initialized, cannot setup handlers')
    return
  }

  console.log('🔧 Setting up database IPC handlers...')

  // Categories
  ipcMain.handle('database:getCategories', async () => {
    console.log('📂 Getting categories...')
    const result = await db.getCategories()
    console.log(`📂 Found ${result.length} categories`)
    return result
  })

  ipcMain.handle('database:addCategory', async (_, name) => {
    console.log('➕ Adding category:', name)
    const result = await db.addCategory(name)
    console.log('➕ Category add result:', result)
    return result
  })

  ipcMain.handle('database:deleteCategory', async (_, id) => {
    console.log('🗑️ Deleting category:', id)
    const result = await db.deleteCategory(id)
    console.log('🗑️ Category delete result:', result)
    return result
  })

  // Components
  ipcMain.handle('database:getComponents', async (_, categoryId) => {
    console.log('🔧 Getting components for category:', categoryId)
    const result = await db.getComponents(categoryId)
    console.log(`🔧 Found ${result.length} components`)
    return result
  })

  ipcMain.handle('database:getComponent', async (_, id) => {
    console.log('🔍 Getting component:', id)
    const result = await db.getComponent(id)
    console.log('🔍 Component result:', result ? 'found' : 'not found')
    return result
  })

  ipcMain.handle('database:addComponent', async (_, componentData) => {
    console.log('➕ Adding component:', componentData.name)
    const result = await db.addComponent(componentData)
    console.log('➕ Component add result:', result)
    return result
  })

  ipcMain.handle('database:updateComponent', async (_, componentData) => {
    console.log('✏️ Updating component:', componentData.id)
    const result = await db.updateComponent(componentData)
    console.log('✏️ Component update result:', result)
    return result
  })

  ipcMain.handle('database:deleteComponent', async (_, id) => {
    console.log('🗑️ Deleting component:', id)
    const result = await db.deleteComponent(id)
    console.log('🗑️ Component delete result:', result)
    return result
  })

  // Search and utilities
  ipcMain.handle('database:searchComponents', async (_, query) => {
    console.log('🔍 Searching components:', query)
    const result = await db.searchComponents(query)
    console.log(`🔍 Found ${result.length} results`)
    return result
  })

  ipcMain.handle('database:getDatabaseStats', async () => {
    console.log('📊 Getting database stats...')
    const result = await db.getDatabaseStats()
    console.log('📊 Database stats:', result)
    return result
  })

  ipcMain.handle('database:checkIntegrity', async () => {
    console.log('🔍 Checking database integrity...')
    const result = await db.checkDatabaseIntegrity()
    console.log('🔍 Integrity check result:', result)
    return result
  })

  ipcMain.handle('database:updateCategory', async (_, id, name) => {
    console.log('✏️ Updating category:', id, name)
    const result = await db.updateCategory(id, name)
    console.log('✏️ Category update result:', result)
    return result
  })






  // PDF handlers
  ipcMain.handle('database:uploadComponentPdf', async (_, id, pdfData, filename, size) => {
    console.log('📄 Uploading PDF for component:', id);
    const result = await db.updateComponent({
      id,
      pdf_data: pdfData,
      pdf_filename: filename,
      pdf_size: size,
      pdf_mime_type: 'application/pdf'
    });
    return result;
  });

  ipcMain.handle('database:getComponentPdf', async (_, id) => {
    console.log('📄 Getting PDF for component:', id);
    return await db.getComponentPdf(id);
  });

  ipcMain.handle('database:removeComponentPdf', async (_, id) => {
    console.log('🗑️ Removing PDF for component:', id);
    return await db.removeComponentPdf(id);
  });







  ipcMain.handle('window:openBrowser', async (_, url) => {
    try {
      console.log('🌐 Opening browser for:', url)
      // Создаем новое браузерное окно
      const browserWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          webSecurity: true
        },
        title: 'Datasheet - ' + url,
        icon: icon_3 // используем ту же иконку что и у основного приложения
      });

      // Загружаем URL
      await browserWindow.loadURL(url);

      // Обработчик для внешних ссылок (открывать в системном браузере)
      browserWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
      });

      // Открываем DevTools для отладки
      //browserWindow.webContents.openDevTools();

      console.log('✅ Browser window opened for:', url);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to open browser window:', error);
      return { success: false, error: error.message };
    }
  });



  ipcMain.handle('database:forceRefreshComponent', async (_, id) => {
    console.log('🔄 Force refreshing component:', id);
    return await db.getComponent(id); // Получаем свежие данные из БД
  });

  // Добавляем хендлер для получения информации о пути БД
  ipcMain.handle('database:getDbInfo', async () => {
    const stats = await db.getDatabaseStats()
    return {
      dbPath: stats.dbPath,
      exists: require('fs').existsSync(stats.dbPath),
      appPath: app.getAppPath(),
      execPath: process.execPath,
      cwd: process.cwd(),
      isPackaged: app.isPackaged
    }
  })

  console.log('✅ All database IPC handlers registered')
}

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow()
  }
})

// Логируем все необработанные ошибки
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
})
