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

//   // mainWindow.on('ready-to-show', () => {
//   //   mainWindow.show()
//   // })
//   // Запуск в полноэкранном режиме
//   mainWindow.maximize()



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

//   // Initialize database
//   try {
//     db = new ComponentsDatabase()
//     console.log('✅ Database initialized successfully')
//   } catch (error) {
//     console.error('❌ Database initialization failed:', error)
//   }

//   // Setup database IPC handlers
//   setupDatabaseHandlers()

//   mainWindow = createWindow()

//   app.on('activate', function () {
//     // On macOS it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (BrowserWindow.getAllWindows().length === 0) {
//       mainWindow = createWindow()
//     }
//   })
// })

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
//   if (!db) return

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
// }

// // In this file you can include the rest of your app's specific main process
// // code. You can also put them in separate files and require them here.







import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
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
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Запуск в полноэкранном режиме
  mainWindow.maximize()

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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

  // Initialize database and setup handlers with small delay
  initializeApp()
})

// Функция для инициализации приложения
async function initializeApp() {
  try {
    // Инициализируем базу данных
    db = new ComponentsDatabase()
    console.log('✅ Database initialized successfully')

    // Настраиваем обработчики IPC
    setupDatabaseHandlers()
    console.log('✅ Database IPC handlers registered')

    // Создаем окно после инициализации БД
    mainWindow = createWindow()

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    // Все равно создаем окно, но с ошибкой
    mainWindow = createWindow()
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

  // Categories
  ipcMain.handle('database:getCategories', async () => {
    return db.getCategories()
  })

  ipcMain.handle('database:addCategory', async (_, name) => {
    return db.addCategory(name)
  })

  ipcMain.handle('database:deleteCategory', async (_, id) => {
    return db.deleteCategory(id)
  })

  // Components
  ipcMain.handle('database:getComponents', async (_, categoryId) => {
    return db.getComponents(categoryId)
  })

  ipcMain.handle('database:getComponent', async (_, id) => {
    return db.getComponent(id)
  })

  ipcMain.handle('database:addComponent', async (_, componentData) => {
    return db.addComponent(componentData)
  })

  ipcMain.handle('database:updateComponent', async (_, componentData) => {
    return db.updateComponent(componentData)
  })

  ipcMain.handle('database:deleteComponent', async (_, id) => {
    return db.deleteComponent(id)
  })

  // Search and utilities
  ipcMain.handle('database:searchComponents', async (_, query) => {
    return db.searchComponents(query)
  })

  ipcMain.handle('database:getDatabaseStats', async () => {
    return db.getDatabaseStats()
  })

  ipcMain.handle('database:checkIntegrity', async () => {
    return db.checkDatabaseIntegrity()
  })

  // Добавьте обработчик для обновления категорий (если используется в Sidebar.jsx)
  ipcMain.handle('database:updateCategory', async (_, id, name) => {
    return db.updateCategory(id, name)
  })
}

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
