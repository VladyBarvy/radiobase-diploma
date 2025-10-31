// import { app, shell, BrowserWindow, ipcMain } from 'electron'
// import { join } from 'path'
// import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset'
// import ComponentsDatabase from './database'

// let mainWindow
// let db

// function createWindow() {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false
//     }
//   })

//   // Запуск в полноэкранном режиме
//   mainWindow.maximize()

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.show()
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   // HMR for renderer base on electron-vite cli.
//   // Load the remote URL for development or the local html file for production.
//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }

//   return mainWindow
// }

// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//   // Set app user model id for windows
//   electronApp.setAppUserModelId('com.electron')

//   // Default open or close DevTools by F12 in development
//   // and ignore CommandOrControl + R in production.
//   // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window)
//   })

//   // IPC test
//   ipcMain.on('ping', () => console.log('pong'))

//   // Initialize database and setup handlers with small delay
//   initializeApp()
// })

// // Функция для инициализации приложения
// // async function initializeApp() {
// //   try {
// //     // Инициализируем базу данных
// //     db = new ComponentsDatabase()
// //     console.log('✅ Database initialized successfully')

// //     // Настраиваем обработчики IPC
// //     setupDatabaseHandlers()
// //     console.log('✅ Database IPC handlers registered')

// //     // Создаем окно после инициализации БД
// //     mainWindow = createWindow()

// //   } catch (error) {
// //     console.error('❌ Database initialization failed:', error)
// //     // Все равно создаем окно, но с ошибкой
// //     mainWindow = createWindow()
// //   }
// // }


// async function initializeApp() {
//   try {
//     // Инициализируем базу данных
//     db = new ComponentsDatabase();
//     console.log('✅ Database initialized successfully');

//     // Дополнительная диагностика
//     const dbInfo = db.getDatabaseInfo();
//     console.log('📊 Database info:', dbInfo);

//     // Настраиваем обработчики IPC
//     setupDatabaseHandlers();
//     console.log('✅ Database IPC handlers registered');

//     // Создаем окно после инициализации БД
//     mainWindow = createWindow();

//     // Отправляем информацию о БД в renderer process для отладки
//     mainWindow.webContents.once('did-finish-load', () => {
//       mainWindow.webContents.send('database-info', dbInfo);
//     });

//   } catch (error) {
//     console.error('❌ Database initialization failed:', error);
    
//     // Создаем окно даже при ошибке, но показываем ошибку
//     mainWindow = createWindow();
    
//     // Отправляем ошибку в renderer process
//     mainWindow.webContents.once('did-finish-load', () => {
//       mainWindow.webContents.send('database-error', {
//         message: error.message,
//         stack: error.stack
//       });
//     });
//   }
// }


// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// // Close database when app quits
// app.on('before-quit', () => {
//   if (db) {
//     db.close()
//     console.log('✅ Database closed')
//   }
// })

// // Database IPC handlers
// function setupDatabaseHandlers() {
//   if (!db) {
//     console.error('❌ Database not initialized, cannot setup handlers')
//     return
//   }

//   // Categories
//   ipcMain.handle('database:getCategories', async () => {
//     return db.getCategories()
//   })

//   ipcMain.handle('database:addCategory', async (_, name) => {
//     return db.addCategory(name)
//   })

//   ipcMain.handle('database:deleteCategory', async (_, id) => {
//     return db.deleteCategory(id)
//   })

//   // Components
//   ipcMain.handle('database:getComponents', async (_, categoryId) => {
//     return db.getComponents(categoryId)
//   })

//   ipcMain.handle('database:getComponent', async (_, id) => {
//     return db.getComponent(id)
//   })

//   ipcMain.handle('database:addComponent', async (_, componentData) => {
//     return db.addComponent(componentData)
//   })

//   ipcMain.handle('database:updateComponent', async (_, componentData) => {
//     return db.updateComponent(componentData)
//   })

//   ipcMain.handle('database:deleteComponent', async (_, id) => {
//     return db.deleteComponent(id)
//   })

//   // Search and utilities
//   ipcMain.handle('database:searchComponents', async (_, query) => {
//     return db.searchComponents(query)
//   })

//   ipcMain.handle('database:getDatabaseStats', async () => {
//     return db.getDatabaseStats()
//   })

//   ipcMain.handle('database:checkIntegrity', async () => {
//     return db.checkDatabaseIntegrity()
//   })

//   ipcMain.handle('database:updateCategory', async (_, id, name) => {
//     return db.updateCategory(id, name)
//   })

//   ipcMain.handle('window:openBrowser', async (_, url) => {
//     try {
//       // Создаем новое браузерное окно
//       const browserWindow = new BrowserWindow({
//         width: 1200,
//         height: 800,
//         minWidth: 800,
//         minHeight: 600,
//         webPreferences: {
//           nodeIntegration: false,
//           contextIsolation: true,
//           enableRemoteModule: false,
//           webSecurity: true
//         },
//         title: 'Datasheet - ' + url,
//         icon: icon // используем ту же иконку что и у основного приложения
//       });
  
//       // Загружаем URL
//       await browserWindow.loadURL(url);
  
//       // Обработчик для внешних ссылок (открывать в системном браузере)
//       browserWindow.webContents.setWindowOpenHandler(({ url }) => {
//         require('electron').shell.openExternal(url);
//         return { action: 'deny' };
//       });
  
//       console.log('✅ Browser window opened for:', url);
//       return { success: true };
//     } catch (error) {
//       console.error('❌ Failed to open browser window:', error);
//       return { success: false, error: error.message };
//     }
//   });
// }

// app.on('activate', function () {
//   // On macOS it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (BrowserWindow.getAllWindows().length === 0) {
//     mainWindow = createWindow()
//   }
// })

// // In this file you can include the rest of your app's specific main process
// // code. You can also put them in separate files and require them here.





















































// import { app, shell, BrowserWindow, ipcMain } from 'electron'
// import { join } from 'path'
// import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset'
// import ComponentsDatabase from './database'


// // const { app, shell, BrowserWindow, ipcMain } = require('electron')
// // const { join } = require('path')
// // const { electronApp, optimizer, is } = require('@electron-toolkit/utils')
// // const ComponentsDatabase = require('./database') // CommonJS require

// let mainWindow
// let db

// function createWindow() {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false
//     }
//   })

//   // Запуск в полноэкранном режиме
//   mainWindow.maximize()

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.show()
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   // HMR for renderer base on electron-vite cli.
//   // Load the remote URL for development or the local html file for production.
//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }

//   return mainWindow
// }

// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//   // Set app user model id for windows
//   electronApp.setAppUserModelId('com.electron')

//   // Default open or close DevTools by F12 in development
//   // and ignore CommandOrControl + R in production.
//   // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window)
//   })

//   // IPC test
//   ipcMain.on('ping', () => console.log('pong'))

//   // Initialize database and setup handlers with small delay
//   initializeApp()
// })

// // Функция для инициализации приложения
// async function initializeApp() {
//   // try {
//   //   // Инициализируем базу данных
//   //   db = new ComponentsDatabase()
//   //   console.log('✅ Database initialized successfully')

//   //   // Настраиваем обработчики IPC
//   //   setupDatabaseHandlers()
//   //   console.log('✅ Database IPC handlers registered')

//   //   // Создаем окно после инициализации БД
//   //   mainWindow = createWindow()

//   // } catch (error) {
//   //   console.error('❌ Database initialization failed:', error)
//   //   // Все равно создаем окно, но с ошибкой
//   //   mainWindow = createWindow()
//   // }





//   try {
//     console.log('🔧 Initializing database...');
    
//     // Инициализируем базу данных
//     db = new ComponentsDatabase();
//     console.log('✅ Database initialized successfully');

//     // Настраиваем обработчики IPC
//     setupDatabaseHandlers();
//     console.log('✅ Database IPC handlers registered');

//     // Создаем окно после инициализации БД
//     mainWindow = createWindow();

//   } catch (error) {
//     console.error('❌ Database initialization failed:', error);
    
//     // Показываем сообщение об ошибке пользователю
//     if (mainWindow) {
//       mainWindow.webContents.executeJavaScript(`
//         alert('Ошибка инициализации базы данных: ${error.message}. Проверьте права доступа к папке приложения.');
//       `);
//     }
    
//     // Все равно создаем окно, но с ошибкой
//     mainWindow = createWindow();
//   }






// }

// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// // Close database when app quits
// app.on('before-quit', () => {
//   if (db) {
//     db.close()
//     console.log('✅ Database closed')
//   }
// })

// // Database IPC handlers
// function setupDatabaseHandlers() {
//   if (!db) {
//     console.error('❌ Database not initialized, cannot setup handlers')
//     return
//   }

//   // Categories
//   ipcMain.handle('database:getCategories', async () => {
//     return db.getCategories()
//   })

//   ipcMain.handle('database:addCategory', async (_, name) => {
//     return db.addCategory(name)
//   })

//   ipcMain.handle('database:deleteCategory', async (_, id) => {
//     return db.deleteCategory(id)
//   })

//   // Components
//   ipcMain.handle('database:getComponents', async (_, categoryId) => {
//     return db.getComponents(categoryId)
//   })

//   ipcMain.handle('database:getComponent', async (_, id) => {
//     return db.getComponent(id)
//   })

//   ipcMain.handle('database:addComponent', async (_, componentData) => {
//     return db.addComponent(componentData)
//   })

//   ipcMain.handle('database:updateComponent', async (_, componentData) => {
//     return db.updateComponent(componentData)
//   })

//   ipcMain.handle('database:deleteComponent', async (_, id) => {
//     return db.deleteComponent(id)
//   })

//   // Search and utilities
//   ipcMain.handle('database:searchComponents', async (_, query) => {
//     return db.searchComponents(query)
//   })

//   ipcMain.handle('database:getDatabaseStats', async () => {
//     return db.getDatabaseStats()
//   })

//   ipcMain.handle('database:checkIntegrity', async () => {
//     return db.checkDatabaseIntegrity()
//   })

//   ipcMain.handle('database:updateCategory', async (_, id, name) => {
//     return db.updateCategory(id, name)
//   })

//   ipcMain.handle('window:openBrowser', async (_, url) => {
//     try {
//       // Создаем новое браузерное окно
//       const browserWindow = new BrowserWindow({
//         width: 1200,
//         height: 800,
//         minWidth: 800,
//         minHeight: 600,
//         webPreferences: {
//           nodeIntegration: false,
//           contextIsolation: true,
//           enableRemoteModule: false,
//           webSecurity: true
//         },
//         title: 'Datasheet - ' + url,
//         icon: icon // используем ту же иконку что и у основного приложения
//       });
  
//       // Загружаем URL
//       await browserWindow.loadURL(url);
  
//       // Обработчик для внешних ссылок (открывать в системном браузере)
//       browserWindow.webContents.setWindowOpenHandler(({ url }) => {
//         require('electron').shell.openExternal(url);
//         return { action: 'deny' };
//       });
  
//       console.log('✅ Browser window opened for:', url);
//       return { success: true };
//     } catch (error) {
//       console.error('❌ Failed to open browser window:', error);
//       return { success: false, error: error.message };
//     }
//   });
// }

// app.on('activate', function () {
//   // On macOS it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (BrowserWindow.getAllWindows().length === 0) {
//     mainWindow = createWindow()
//   }
// })

// // In this file you can include the rest of your app's specific main process
// // code. You can also put them in separate files and require them here.

































































// import { app, shell, BrowserWindow, ipcMain } from 'electron'
// import { join } from 'path'
// import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset'
// import fs from 'fs'
// import path from 'path' // Добавляем импорт path

// let mainWindow
// let db = null

// function createWindow() {
//   console.log('🔄 Creating main window...')
  
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false,
//       nodeIntegration: false,
//       contextIsolation: true,
//       devTools: true
//     }
//   })

//   mainWindow.webContents.openDevTools()
//   mainWindow.maximize()

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.show()
//     console.log('✅ Main window ready')
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }

//   return mainWindow
// }

// app.whenReady().then(() => {
//   electronApp.setAppUserModelId('com.electron')

//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window)
//   })

//   initializeApp()
// })

// async function initializeApp() {
//   try {
//     console.log('🔧 ===== APP STARTUP =====')
//     console.log('📁 App path:', app.getAppPath())
//     console.log('📁 Exec path:', process.execPath)
//     console.log('📁 Is packaged:', app.isPackaged)
//     console.log('📁 User data:', app.getPath('userData'))
//     console.log('🔧 =======================')
    
//     // Сначала создаем окно
//     mainWindow = createWindow()
    
//     // Затем инициализируем БД
//     console.log('🔧 Importing database module...')
//     const DatabaseModule = await import('./database.js')
    
//     console.log('🔧 Creating database instance...')
//     db = new DatabaseModule.default()
    
//     // Регистрируем обработчики
//     setupDatabaseHandlers()
    
//     console.log('✅ App initialized successfully')
    
//   } catch (error) {
//     console.error('❌ App initialization failed:', error)
//     console.error('❌ Error message:', error.message)
//     console.error('❌ Error stack:', error.stack)
    
//     // Все равно регистрируем обработчики
//     setupDatabaseHandlers()
    
//     if (mainWindow) {
//       mainWindow.webContents.executeJavaScript(`
//         console.error('Init Error:', ${JSON.stringify(error.message)});
//         alert('Ошибка инициализации: ${error.message}');
//       `)
//     }
//   }
// }

// function setupDatabaseHandlers() {
//   console.log('🔧 Setting up IPC handlers...')
  
//   // Categories
//   ipcMain.handle('database:getCategories', async () => {
//     console.log('📁 IPC: getCategories called')
//     if (!db) {
//       console.error('❌ Database not initialized')
//       throw new Error('Database not initialized')
//     }
//     return db.getCategories()
//   })

//   ipcMain.handle('database:addCategory', async (_, name) => {
//     console.log('📁 IPC: addCategory called with:', name)
//     if (!db) throw new Error('Database not initialized')
//     return db.addCategory(name)
//   })

//   ipcMain.handle('database:updateCategory', async (_, id, name) => {
//     console.log('📁 IPC: updateCategory called with:', id, name)
//     if (!db) throw new Error('Database not initialized')
//     return { success: true } // TODO: Implement
//   })

//   ipcMain.handle('database:deleteCategory', async (_, id) => {
//     console.log('📁 IPC: deleteCategory called with:', id)
//     if (!db) throw new Error('Database not initialized')
//     return { success: true } // TODO: Implement
//   })

//   // Components
//   ipcMain.handle('database:getComponents', async (_, categoryId) => {
//     console.log('📁 IPC: getComponents called with categoryId:', categoryId)
//     if (!db) throw new Error('Database not initialized')
//     return db.getComponents(categoryId)
//   })

//   ipcMain.handle('database:getComponent', async (_, id) => {
//     console.log('📁 IPC: getComponent called with id:', id)
//     if (!db) throw new Error('Database not initialized')
//     return null // TODO: Implement
//   })

//   ipcMain.handle('database:addComponent', async (_, componentData) => {
//     console.log('📁 IPC: addComponent called')
//     if (!db) throw new Error('Database not initialized')
//     return { success: true, id: 1 } // TODO: Implement
//   })

//   ipcMain.handle('database:updateComponent', async (_, componentData) => {
//     console.log('📁 IPC: updateComponent called')
//     if (!db) throw new Error('Database not initialized')
//     return { success: true } // TODO: Implement
//   })

//   ipcMain.handle('database:deleteComponent', async (_, id) => {
//     console.log('📁 IPC: deleteComponent called with id:', id)
//     if (!db) throw new Error('Database not initialized')
//     return { success: true } // TODO: Implement
//   })

//   // Search
//   ipcMain.handle('database:searchComponents', async (_, query) => {
//     console.log('📁 IPC: searchComponents called with query:', query)
//     if (!db) throw new Error('Database not initialized')
//     return [] // TODO: Implement
//   })

//   // Stats and debug
//   ipcMain.handle('database:getDatabaseStats', async () => {
//     console.log('📁 IPC: getDatabaseStats called')
//     if (!db) {
//       return { error: 'Database not initialized', isInitialized: false }
//     }
//     return db.getDatabaseStats()
//   })

//   ipcMain.handle('database:getDebugInfo', async () => {
//     const debugInfo = {
//       dbPath: db?.dbPath || 'Not initialized',
//       dbInitialized: !!db?.isInitialized,
//       appPath: app.getAppPath(),
//       execPath: process.execPath,
//       isPackaged: app.isPackaged,
//       userData: app.getPath('userData')
//     }
//     console.log('🔧 Debug Info:', debugInfo)
//     return debugInfo
//   })

//   // File system check
//   ipcMain.handle('debug:checkFS', async () => {
//     try {
//       const userDataPath = app.getPath('userData')
//       const testDir = path.join(userDataPath, 'TestDir')
//       const testFile = path.join(testDir, 'test.txt')
      
//       if (!fs.existsSync(testDir)) {
//         fs.mkdirSync(testDir, { recursive: true })
//       }
      
//       fs.writeFileSync(testFile, 'test content')
//       const content = fs.readFileSync(testFile, 'utf8')
      
//       fs.unlinkSync(testFile)
//       fs.rmdirSync(testDir)
      
//       return {
//         success: true,
//         userDataPath,
//         canWrite: true,
//         testContent: content
//       }
//     } catch (error) {
//       return {
//         success: false,
//         error: error.message
//       }
//     }
//   })



  



//   ipcMain.handle('dialog:showSaveDialog', async (_, options) => {
//     const { dialog } = require('electron')
//     const result = await dialog.showSaveDialog(mainWindow, options)
//     return result
//   })
  
//   ipcMain.handle('dialog:showOpenDialog', async (_, options) => {
//     const { dialog } = require('electron')
//     const result = await dialog.showOpenDialog(mainWindow, options)
//     return result
//   })
  
//   ipcMain.handle('shell:showItemInFolder', async (_, path) => {
//     const { shell } = require('electron')
//     shell.showItemInFolder(path)
//     return { success: true }
//   })
  
//   // Database export/import handlers
//   ipcMain.handle('database:exportDatabase', async (_, destinationPath) => {
//     console.log('📁 IPC: exportDatabase called with path:', destinationPath)
//     if (!db) throw new Error('Database not initialized')
//     return db.exportDatabase(destinationPath)
//   })
  
//   ipcMain.handle('database:importDatabase', async (_, sourcePath) => {
//     console.log('📁 IPC: importDatabase called with path:', sourcePath)
//     if (!db) throw new Error('Database not initialized')
//     return db.importDatabase(sourcePath)
//   })
  
//   ipcMain.handle('database:getDatabaseInfo', async () => {
//     console.log('📁 IPC: getDatabaseInfo called')
//     if (!db) throw new Error('Database not initialized')
//     return db.getDatabaseInfo()
//   })





//   console.log('✅ All IPC handlers registered')
// }

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// app.on('before-quit', () => {
//   if (db) {
//     console.log('🔧 Closing database...')
//     db.close()
//   }
// })

// app.on('activate', function () {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow()
//   }
// })




























// import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
// import { join } from 'path'
// import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset'
// import fs from 'fs'
// import path from 'path'

// let mainWindow
// let db = null

// function createWindow() {
//   console.log('🔄 Creating main window...')
  
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false,
//       nodeIntegration: false,
//       contextIsolation: true,
//       devTools: true
//     }
//   })

//   mainWindow.webContents.openDevTools()
//   mainWindow.maximize()

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.show()
//     console.log('✅ Main window ready')
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }

//   return mainWindow
// }

// app.whenReady().then(() => {
//   electronApp.setAppUserModelId('com.electron')

//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window)
//   })

//   initializeApp()
// })

// async function initializeApp() {
//   try {
//     console.log('🔧 ===== APP STARTUP =====')
//     console.log('📁 App path:', app.getAppPath())
//     console.log('📁 Exec path:', process.execPath)
//     console.log('📁 Is packaged:', app.isPackaged)
//     console.log('📁 User data:', app.getPath('userData'))
//     console.log('🔧 =======================')
    
//     // Сначала создаем окно
//     mainWindow = createWindow()
    
//     // Затем инициализируем БД
//     console.log('🔧 Importing database module...')
//     const DatabaseModule = await import('./database.js')
    
//     console.log('🔧 Creating database instance...')
//     db = new DatabaseModule.default()
    
//     // Регистрируем обработчики
//     setupDatabaseHandlers()
    
//     console.log('✅ App initialized successfully')
    
//   } catch (error) {
//     console.error('❌ App initialization failed:', error)
//     console.error('❌ Error message:', error.message)
//     console.error('❌ Error stack:', error.stack)
    
//     // Все равно регистрируем обработчики
//     setupDatabaseHandlers()
    
//     if (mainWindow) {
//       mainWindow.webContents.executeJavaScript(`
//         console.error('Init Error:', ${JSON.stringify(error.message)});
//         alert('Ошибка инициализации: ${error.message}');
//       `)
//     }
//   }
// }

// function setupDatabaseHandlers() {
//   console.log('🔧 Setting up IPC handlers...')
  
//   // ===== CATEGORIES =====
//   ipcMain.handle('database:getCategories', async () => {
//     console.log('📁 IPC: getCategories called')
//     if (!db) {
//       console.error('❌ Database not initialized')
//       throw new Error('Database not initialized')
//     }
//     return db.getCategories()
//   })

//   ipcMain.handle('database:addCategory', async (_, name) => {
//     console.log('📁 IPC: addCategory called with:', name)
//     if (!db) throw new Error('Database not initialized')
//     return db.addCategory(name)
//   })

//   ipcMain.handle('database:updateCategory', async (_, id, name) => {
//     console.log('📁 IPC: updateCategory called with:', id, name)
//     if (!db) throw new Error('Database not initialized')
//     return db.updateCategory(id, name)
//   })

//   ipcMain.handle('database:deleteCategory', async (_, id) => {
//     console.log('📁 IPC: deleteCategory called with:', id)
//     if (!db) throw new Error('Database not initialized')
//     return db.deleteCategory(id)
//   })

//   // ===== COMPONENTS =====
//   ipcMain.handle('database:getComponents', async (_, categoryId) => {
//     console.log('📁 IPC: getComponents called with categoryId:', categoryId)
//     if (!db) throw new Error('Database not initialized')
//     return db.getComponents(categoryId)
//   })

//   ipcMain.handle('database:getComponent', async (_, id) => {
//     console.log('📁 IPC: getComponent called with id:', id)
//     if (!db) throw new Error('Database not initialized')
//     return db.getComponent(id)
//   })

//   ipcMain.handle('database:addComponent', async (_, componentData) => {
//     console.log('📁 IPC: addComponent called')
//     if (!db) throw new Error('Database not initialized')
//     return db.addComponent(componentData)
//   })

//   ipcMain.handle('database:updateComponent', async (_, componentData) => {
//     console.log('📁 IPC: updateComponent called')
//     if (!db) throw new Error('Database not initialized')
//     return db.updateComponent(componentData)
//   })

//   ipcMain.handle('database:deleteComponent', async (_, id) => {
//     console.log('📁 IPC: deleteComponent called with id:', id)
//     if (!db) throw new Error('Database not initialized')
//     return db.deleteComponent(id)
//   })

//   // ===== SEARCH =====
//   ipcMain.handle('database:searchComponents', async (_, query) => {
//     console.log('📁 IPC: searchComponents called with query:', query)
//     if (!db) throw new Error('Database not initialized')
//     return db.searchComponents(query)
//   })

//   // ===== DATABASE MANAGEMENT =====
//   ipcMain.handle('database:getDatabaseStats', async () => {
//     console.log('📁 IPC: getDatabaseStats called')
//     if (!db) {
//       return { error: 'Database not initialized', isInitialized: false }
//     }
//     return db.getDatabaseStats()
//   })

//   ipcMain.handle('database:getDatabaseInfo', async () => {
//     console.log('📁 IPC: getDatabaseInfo called')
//     if (!db) throw new Error('Database not initialized')
//     return db.getDatabaseInfo()
//   })

//   ipcMain.handle('database:exportDatabase', async (_, destinationPath) => {
//     console.log('📁 IPC: exportDatabase called with path:', destinationPath)
//     if (!db) throw new Error('Database not initialized')
//     return db.exportDatabase(destinationPath)
//   })

//   ipcMain.handle('database:importDatabase', async (_, sourcePath) => {
//     console.log('📁 IPC: importDatabase called with path:', sourcePath)
//     if (!db) throw new Error('Database not initialized')
//     return db.importDatabase(sourcePath)
//   })

//   ipcMain.handle('database:getDebugInfo', async () => {
//     const debugInfo = {
//       dbPath: db?.dbPath || 'Not initialized',
//       dbInitialized: !!db?.isInitialized,
//       appPath: app.getAppPath(),
//       execPath: process.execPath,
//       isPackaged: app.isPackaged,
//       userData: app.getPath('userData')
//     }
//     console.log('🔧 Debug Info:', debugInfo)
//     return debugInfo
//   })

//   // ===== SYSTEM DIALOGS =====
//   ipcMain.handle('dialog:showSaveDialog', async (_, options) => {
//     console.log('💾 IPC: showSaveDialog called')
//     const result = await dialog.showSaveDialog(mainWindow, options)
//     return result
//   })

//   ipcMain.handle('dialog:showOpenDialog', async (_, options) => {
//     console.log('💾 IPC: showOpenDialog called')
//     const result = await dialog.showOpenDialog(mainWindow, options)
//     return result
//   })

//   ipcMain.handle('shell:showItemInFolder', async (_, filePath) => {
//     console.log('📁 IPC: showItemInFolder called with path:', filePath)
//     shell.showItemInFolder(filePath)
//     return { success: true }
//   })

//   // ===== DEBUG UTILITIES =====
//   ipcMain.handle('debug:checkFS', async () => {
//     try {
//       const userDataPath = app.getPath('userData')
//       const testDir = path.join(userDataPath, 'TestDir')
//       const testFile = path.join(testDir, 'test.txt')
      
//       if (!fs.existsSync(testDir)) {
//         fs.mkdirSync(testDir, { recursive: true })
//       }
      
//       fs.writeFileSync(testFile, 'test content')
//       const content = fs.readFileSync(testFile, 'utf8')
      
//       fs.unlinkSync(testFile)
//       fs.rmdirSync(testDir)
      
//       return {
//         success: true,
//         userDataPath,
//         canWrite: true,
//         testContent: content
//       }
//     } catch (error) {
//       return {
//         success: false,
//         error: error.message
//       }
//     }
//   })

//   console.log('✅ All IPC handlers registered')
// }

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// app.on('before-quit', () => {
//   if (db) {
//     console.log('🔧 Closing database...')
//     db.close()
//   }
// })

// app.on('activate', function () {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow()
//   }
// })


























































































// import { app, shell, BrowserWindow, ipcMain } from 'electron'
// import { join } from 'path'
// import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset'
// import ComponentsDatabase from './database'

// let mainWindow
// let db

// function createWindow() {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false
//     }
//   })

//   // Запуск в полноэкранном режиме
//   mainWindow.maximize()

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.show()
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   // HMR for renderer base on electron-vite cli.
//   // Load the remote URL for development or the local html file for production.
//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }

//   return mainWindow
// }

// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//   // Set app user model id for windows
//   electronApp.setAppUserModelId('com.electron')

//   // Default open or close DevTools by F12 in development
//   // and ignore CommandOrControl + R in production.
//   // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window)
//   })

//   // IPC test
//   ipcMain.on('ping', () => console.log('pong'))

//   // Initialize database and setup handlers with small delay
//   initializeApp()
// })

// // Функция для инициализации приложения
// async function initializeApp() {
//   try {
//     // Инициализируем базу данных
//     db = new ComponentsDatabase()
//     console.log('✅ Database initialized successfully')

//     // Настраиваем обработчики IPC
//     setupDatabaseHandlers()
//     console.log('✅ Database IPC handlers registered')

//     // Создаем окно после инициализации БД
//     mainWindow = createWindow()

//   } catch (error) {
//     console.error('❌ Database initialization failed:', error)
//     // Все равно создаем окно, но с ошибкой
//     mainWindow = createWindow()
//   }
// }

// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// // Close database when app quits
// app.on('before-quit', () => {
//   if (db) {
//     db.close()
//     console.log('✅ Database closed')
//   }
// })

// // Database IPC handlers
// function setupDatabaseHandlers() {
//   if (!db) {
//     console.error('❌ Database not initialized, cannot setup handlers')
//     return
//   }

//   // Categories
//   ipcMain.handle('database:getCategories', async () => {
//     return db.getCategories()
//   })

//   ipcMain.handle('database:addCategory', async (_, name) => {
//     return db.addCategory(name)
//   })

//   ipcMain.handle('database:deleteCategory', async (_, id) => {
//     return db.deleteCategory(id)
//   })

//   // Components
//   ipcMain.handle('database:getComponents', async (_, categoryId) => {
//     return db.getComponents(categoryId)
//   })

//   ipcMain.handle('database:getComponent', async (_, id) => {
//     return db.getComponent(id)
//   })

//   ipcMain.handle('database:addComponent', async (_, componentData) => {
//     return db.addComponent(componentData)
//   })

//   ipcMain.handle('database:updateComponent', async (_, componentData) => {
//     return db.updateComponent(componentData)
//   })

//   ipcMain.handle('database:deleteComponent', async (_, id) => {
//     return db.deleteComponent(id)
//   })

//   // Search and utilities
//   ipcMain.handle('database:searchComponents', async (_, query) => {
//     return db.searchComponents(query)
//   })

//   ipcMain.handle('database:getDatabaseStats', async () => {
//     return db.getDatabaseStats()
//   })

//   ipcMain.handle('database:checkIntegrity', async () => {
//     return db.checkDatabaseIntegrity()
//   })

//   ipcMain.handle('database:updateCategory', async (_, id, name) => {
//     return db.updateCategory(id, name)
//   })

//   ipcMain.handle('window:openBrowser', async (_, url) => {
//     try {
//       // Создаем новое браузерное окно
//       const browserWindow = new BrowserWindow({
//         width: 1200,
//         height: 800,
//         minWidth: 800,
//         minHeight: 600,
//         webPreferences: {
//           nodeIntegration: false,
//           contextIsolation: true,
//           enableRemoteModule: false,
//           webSecurity: true
//         },
//         title: 'Datasheet - ' + url,
//         icon: icon // используем ту же иконку что и у основного приложения
//       });
  
//       // Загружаем URL
//       await browserWindow.loadURL(url);
  
//       // Обработчик для внешних ссылок (открывать в системном браузере)
//       browserWindow.webContents.setWindowOpenHandler(({ url }) => {
//         require('electron').shell.openExternal(url);
//         return { action: 'deny' };
//       });
  
//       console.log('✅ Browser window opened for:', url);
//       return { success: true };
//     } catch (error) {
//       console.error('❌ Failed to open browser window:', error);
//       return { success: false, error: error.message };
//     }
//   });
// }

// app.on('activate', function () {
//   // On macOS it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (BrowserWindow.getAllWindows().length === 0) {
//     mainWindow = createWindow()
//   }
// })

// // In this file you can include the rest of your app's specific main process
// // code. You can also put them in separate files and require them here.
















































































// import { app, shell, BrowserWindow, ipcMain } from 'electron'
// import { join } from 'path'
// import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset'
// import ComponentsDatabase from './database'

// let mainWindow
// let db

// function createWindow() {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false
//     }
//   })

//   // Запуск в полноэкранном режиме
//   mainWindow.maximize()

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.show()
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   // HMR for renderer base on electron-vite cli.
//   // Load the remote URL for development or the local html file for production.
//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }

//   return mainWindow
// }

// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//   // Set app user model id for windows
//   electronApp.setAppUserModelId('com.electron')

//   // Default open or close DevTools by F12 in development
//   // and ignore CommandOrControl + R in production.
//   // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window)
//   })

//   // IPC test
//   ipcMain.on('ping', () => console.log('pong'))

//   // Initialize database and setup handlers with small delay
//   initializeApp()
// })

// // Функция для инициализации приложения
// async function initializeApp() {
//   try {
//     // Инициализируем базу данных
//     db = new ComponentsDatabase()
//     console.log('✅ Database initialized successfully')

//     // Настраиваем обработчики IPC
//     setupDatabaseHandlers()
//     console.log('✅ Database IPC handlers registered')

//     // Создаем окно после инициализации БД
//     mainWindow = createWindow()

//   } catch (error) {
//     console.error('❌ Database initialization failed:', error)
//     // Все равно создаем окно, но с ошибкой
//     mainWindow = createWindow()
//   }
// }

// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// // Close database when app quits
// app.on('before-quit', () => {
//   if (db) {
//     db.close()
//     console.log('✅ Database closed')
//   }
// })

// // Database IPC handlers
// function setupDatabaseHandlers() {
//   if (!db) {
//     console.error('❌ Database not initialized, cannot setup handlers')
//     return
//   }

//   // Categories
//   ipcMain.handle('database:getCategories', async () => {
//     return db.getCategories()
//   })

//   ipcMain.handle('database:addCategory', async (_, name) => {
//     return db.addCategory(name)
//   })

//   ipcMain.handle('database:deleteCategory', async (_, id) => {
//     return db.deleteCategory(id)
//   })

//   // Components
//   ipcMain.handle('database:getComponents', async (_, categoryId) => {
//     return db.getComponents(categoryId)
//   })

//   ipcMain.handle('database:getComponent', async (_, id) => {
//     return db.getComponent(id)
//   })

//   ipcMain.handle('database:addComponent', async (_, componentData) => {
//     return db.addComponent(componentData)
//   })

//   ipcMain.handle('database:updateComponent', async (_, componentData) => {
//     return db.updateComponent(componentData)
//   })

//   ipcMain.handle('database:deleteComponent', async (_, id) => {
//     return db.deleteComponent(id)
//   })

//   // Search and utilities
//   ipcMain.handle('database:searchComponents', async (_, query) => {
//     return db.searchComponents(query)
//   })

//   ipcMain.handle('database:getDatabaseStats', async () => {
//     return db.getDatabaseStats()
//   })

//   ipcMain.handle('database:checkIntegrity', async () => {
//     return db.checkDatabaseIntegrity()
//   })

//   ipcMain.handle('database:updateCategory', async (_, id, name) => {
//     return db.updateCategory(id, name)
//   })

//   ipcMain.handle('window:openBrowser', async (_, url) => {
//     try {
//       // Создаем новое браузерное окно
//       const browserWindow = new BrowserWindow({
//         width: 1200,
//         height: 800,
//         minWidth: 800,
//         minHeight: 600,
//         webPreferences: {
//           nodeIntegration: false,
//           contextIsolation: true,
//           enableRemoteModule: false,
//           webSecurity: true
//         },
//         title: 'Datasheet - ' + url,
//         icon: icon // используем ту же иконку что и у основного приложения
//       });
  
//       // Загружаем URL
//       await browserWindow.loadURL(url);
  
//       // Обработчик для внешних ссылок (открывать в системном браузере)
//       browserWindow.webContents.setWindowOpenHandler(({ url }) => {
//         require('electron').shell.openExternal(url);
//         return { action: 'deny' };
//       });
  
//       console.log('✅ Browser window opened for:', url);
//       return { success: true };
//     } catch (error) {
//       console.error('❌ Failed to open browser window:', error);
//       return { success: false, error: error.message };
//     }
//   });
// }

// app.on('activate', function () {
//   // On macOS it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (BrowserWindow.getAllWindows().length === 0) {
//     mainWindow = createWindow()
//   }
// })

// // In this file you can include the rest of your app's specific main process
// // code. You can also put them in separate files and require them here.



























































// import { app, shell, BrowserWindow, ipcMain } from 'electron'
// import { join } from 'path'
// import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import icon from '../../resources/icon.png?asset'
// import ComponentsDatabase from './database'

// let mainWindow
// let db

// function createWindow() {
//   // Create the browser window.
//   const mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false
//     }
//   })

//   // Запуск в полноэкранном режиме
//   mainWindow.maximize()

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.show()
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   // HMR for renderer base on electron-vite cli.
//   // Load the remote URL for development or the local html file for production.
//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }

//   return mainWindow
// }

// // This method will be called when Electron has finished
// // initialization and is ready to create browser windows.
// // Some APIs can only be used after this event occurs.
// app.whenReady().then(() => {
//   // Set app user model id for windows
//   electronApp.setAppUserModelId('com.electron')

//   // Default open or close DevTools by F12 in development
//   // and ignore CommandOrControl + R in production.
//   // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window)
//   })

//   // IPC test
//   ipcMain.on('ping', () => console.log('pong'))

//   // Initialize database and setup handlers with small delay
//   initializeApp()
// })










// // Функция для инициализации приложения
// // async function initializeApp() {
// //   try {
// //     // Инициализируем базу данных
// //     db = new ComponentsDatabase()
// //     console.log('✅ Database initialized successfully')

// //     // Настраиваем обработчики IPC
// //     setupDatabaseHandlers()
// //     console.log('✅ Database IPC handlers registered')

// //     // Создаем окно после инициализации БД
// //     mainWindow = createWindow()

// //   } catch (error) {
// //     console.error('❌ Database initialization failed:', error)
// //     // Все равно создаем окно, но с ошибкой
// //     mainWindow = createWindow()
// //   }
// // }




// async function initializeApp() {
//   try {
//     // Инициализируем базу данных
//     db = new ComponentsDatabase();
    
//     // Ждем завершения инициализации БД
//     await db.initPromise;
//     console.log('✅ Database initialized successfully');

//     // Настраиваем обработчики IPC
//     setupDatabaseHandlers();
//     console.log('✅ Database IPC handlers registered');

//     // Создаем окно после инициализации БД
//     mainWindow = createWindow();

//   } catch (error) {
//     console.error('❌ Database initialization failed:', error);
//     // Все равно создаем окно, но с ошибкой
//     mainWindow = createWindow();
//   }
// }








// // Quit when all windows are closed, except on macOS. There, it's common
// // for applications and their menu bar to stay active until the user quits
// // explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// // Close database when app quits
// app.on('before-quit', () => {
//   if (db) {
//     db.close()
//     console.log('✅ Database closed')
//   }
// })

// // Database IPC handlers
// function setupDatabaseHandlers() {
//   if (!db) {
//     console.error('❌ Database not initialized, cannot setup handlers')
//     return
//   }

//   // Categories
//   ipcMain.handle('database:getCategories', async () => {
//     return db.getCategories()
//   })

//   ipcMain.handle('database:addCategory', async (_, name) => {
//     return db.addCategory(name)
//   })

//   ipcMain.handle('database:deleteCategory', async (_, id) => {
//     return db.deleteCategory(id)
//   })

//   // Components
//   ipcMain.handle('database:getComponents', async (_, categoryId) => {
//     return db.getComponents(categoryId)
//   })

//   ipcMain.handle('database:getComponent', async (_, id) => {
//     return db.getComponent(id)
//   })

//   ipcMain.handle('database:addComponent', async (_, componentData) => {
//     return db.addComponent(componentData)
//   })

//   ipcMain.handle('database:updateComponent', async (_, componentData) => {
//     return db.updateComponent(componentData)
//   })

//   ipcMain.handle('database:deleteComponent', async (_, id) => {
//     return db.deleteComponent(id)
//   })

//   // Search and utilities
//   ipcMain.handle('database:searchComponents', async (_, query) => {
//     return db.searchComponents(query)
//   })

//   ipcMain.handle('database:getDatabaseStats', async () => {
//     return db.getDatabaseStats()
//   })

//   ipcMain.handle('database:checkIntegrity', async () => {
//     return db.checkDatabaseIntegrity()
//   })

//   ipcMain.handle('database:updateCategory', async (_, id, name) => {
//     return db.updateCategory(id, name)
//   })

//   ipcMain.handle('window:openBrowser', async (_, url) => {
//     try {
//       // Создаем новое браузерное окно
//       const browserWindow = new BrowserWindow({
//         width: 1200,
//         height: 800,
//         minWidth: 800,
//         minHeight: 600,
//         webPreferences: {
//           nodeIntegration: false,
//           contextIsolation: true,
//           enableRemoteModule: false,
//           webSecurity: true
//         },
//         title: 'Datasheet - ' + url,
//         icon: icon // используем ту же иконку что и у основного приложения
//       });
  
//       // Загружаем URL
//       await browserWindow.loadURL(url);
  
//       // Обработчик для внешних ссылок (открывать в системном браузере)
//       browserWindow.webContents.setWindowOpenHandler(({ url }) => {
//         require('electron').shell.openExternal(url);
//         return { action: 'deny' };
//       });
  
//       console.log('✅ Browser window opened for:', url);
//       return { success: true };
//     } catch (error) {
//       console.error('❌ Failed to open browser window:', error);
//       return { success: false, error: error.message };
//     }
//   });
// }

// app.on('activate', function () {
//   // On macOS it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (BrowserWindow.getAllWindows().length === 0) {
//     mainWindow = createWindow()
//   }
// })

// // In this file you can include the rest of your app's specific main process
// // code. You can also put them in separate files and require them here.























































































import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon_3 from '../../resources/icon_3.png?asset'
import ComponentsDatabase from './database'

let mainWindow
let db

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon_3 } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })



  // mainWindow.webContents.on('did-frame-finish-load', () => {
  //   mainWindow.webContents.openDevTools()
  // })



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

  // Логирование всех событий
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`📱 Renderer Console [${level}]: ${message}`)
  })

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
        icon: icon // используем ту же иконку что и у основного приложения
      });
  
      // Загружаем URL
      await browserWindow.loadURL(url);
  
      // Обработчик для внешних ссылок (открывать в системном браузере)
      browserWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
      });

      // Открываем DevTools для отладки
      browserWindow.webContents.openDevTools();
  
      console.log('✅ Browser window opened for:', url);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to open browser window:', error);
      return { success: false, error: error.message };
    }
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
