// import { contextBridge, ipcRenderer } from 'electron'
// import { electronAPI } from '@electron-toolkit/preload'

// // Custom APIs for renderer
// const api = {
//   database: {
//     // Categories
//     getCategories: () => ipcRenderer.invoke('database:getCategories'),
//     addCategory: (name) => ipcRenderer.invoke('database:addCategory', name),
//     deleteCategory: (id) => ipcRenderer.invoke('database:deleteCategory', id),
    
//     // Components
//     getComponents: (categoryId) => ipcRenderer.invoke('database:getComponents', categoryId),
//     getComponent: (id) => ipcRenderer.invoke('database:getComponent', id),
//     addComponent: (componentData) => ipcRenderer.invoke('database:addComponent', componentData),
//     updateComponent: (componentData) => ipcRenderer.invoke('database:updateComponent', componentData),
//     deleteComponent: (id) => ipcRenderer.invoke('database:deleteComponent', id),
    
//     // Search and utilities
//     searchComponents: (query) => ipcRenderer.invoke('database:searchComponents', query),
//     getDatabaseStats: () => ipcRenderer.invoke('database:getDatabaseStats'),
//     checkIntegrity: () => ipcRenderer.invoke('database:checkIntegrity')
//   },

//   window: {
//     openBrowser: (url) => ipcRenderer.invoke('window:openBrowser', url)
//   }
// }

// // Use `contextBridge` APIs to expose Electron APIs to
// // renderer only if context isolation is enabled, otherwise
// // just add to the DOM global.
// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld('electron', electronAPI)
//     contextBridge.exposeInMainWorld('api', api)
//   } catch (error) {
//     console.error(error)
//   }
// } else {
//   window.electron = electronAPI
//   window.api = api
// }





















// import { contextBridge, ipcRenderer } from 'electron'
// import { electronAPI } from '@electron-toolkit/preload'

// // Custom APIs for renderer
// const api = {
//   database: {
//     // Categories
//     getCategories: () => ipcRenderer.invoke('database:getCategories'),
//     addCategory: (name) => ipcRenderer.invoke('database:addCategory', name),
//     deleteCategory: (id) => ipcRenderer.invoke('database:deleteCategory', id),
//     updateCategory: (id, name) => ipcRenderer.invoke('database:updateCategory', id, name),
    
//     // Components
//     getComponents: (categoryId) => ipcRenderer.invoke('database:getComponents', categoryId),
//     getComponent: (id) => ipcRenderer.invoke('database:getComponent', id),
//     addComponent: (componentData) => ipcRenderer.invoke('database:addComponent', componentData),
//     updateComponent: (componentData) => ipcRenderer.invoke('database:updateComponent', componentData),
//     deleteComponent: (id) => ipcRenderer.invoke('database:deleteComponent', id),
    
//     // Search and utilities
//     searchComponents: (query) => ipcRenderer.invoke('database:searchComponents', query),
//     getDatabaseStats: () => ipcRenderer.invoke('database:getDatabaseStats'),
//     checkIntegrity: () => ipcRenderer.invoke('database:checkIntegrity'),
//     getDebugInfo: () => ipcRenderer.invoke('database:getDebugInfo')
//   },
//   window: {
//     openBrowser: (url) => ipcRenderer.invoke('window:openBrowser', url)
//   },
//   debug: {
//     checkFS: () => ipcRenderer.invoke('debug:checkFS')
//   }
// }

// // Use `contextBridge` APIs to expose Electron APIs to
// // renderer only if context isolation is enabled, otherwise
// // just add to the DOM global.
// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld('electron', electronAPI)
//     contextBridge.exposeInMainWorld('api', api)
    
//     // Добавляем обработчик ошибок БД
//     contextBridge.exposeInMainWorld('databaseError', {
//       onError: (callback) => {
//         ipcRenderer.on('database-error', (event, message) => {
//           callback(message)
//         })
//       }
//     })
//   } catch (error) {
//     console.error(error)
//   }
// } else {
//   window.electron = electronAPI
//   window.api = api
// }























// import { contextBridge, ipcRenderer } from 'electron'
// import { electronAPI } from '@electron-toolkit/preload'

// // Custom APIs for renderer
// const api = {
//   database: {
//     // Categories
//     getCategories: () => ipcRenderer.invoke('database:getCategories'),
//     addCategory: (name) => ipcRenderer.invoke('database:addCategory', name),
//     deleteCategory: (id) => ipcRenderer.invoke('database:deleteCategory', id),
//     updateCategory: (id, name) => ipcRenderer.invoke('database:updateCategory', id, name),
    
//     // Components
//     getComponents: (categoryId) => ipcRenderer.invoke('database:getComponents', categoryId),
//     getComponent: (id) => ipcRenderer.invoke('database:getComponent', id),
//     addComponent: (componentData) => ipcRenderer.invoke('database:addComponent', componentData),
//     updateComponent: (componentData) => ipcRenderer.invoke('database:updateComponent', componentData),
//     deleteComponent: (id) => ipcRenderer.invoke('database:deleteComponent', id),
    
//     // Search and utilities
//     searchComponents: (query) => ipcRenderer.invoke('database:searchComponents', query),
//     getDatabaseStats: () => ipcRenderer.invoke('database:getDatabaseStats'),
//     getDebugInfo: () => ipcRenderer.invoke('database:getDebugInfo')
//   },
//   debug: {
//     checkFS: () => ipcRenderer.invoke('debug:checkFS')
//   }
// }

// // Use `contextBridge` APIs to expose Electron APIs to
// // renderer only if context isolation is enabled, otherwise
// // just add to the DOM global.
// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld('electron', electronAPI)
//     contextBridge.exposeInMainWorld('api', api)
//   } catch (error) {
//     console.error(error)
//   }
// } else {
//   window.electron = electronAPI
//   window.api = api
// }


















// import { contextBridge, ipcRenderer } from 'electron'
// import { electronAPI } from '@electron-toolkit/preload'

// // Custom APIs for renderer
// const api = {
//   database: {
//     // Categories
//     getCategories: () => ipcRenderer.invoke('database:getCategories'),
//     addCategory: (name) => ipcRenderer.invoke('database:addCategory', name),
//     deleteCategory: (id) => ipcRenderer.invoke('database:deleteCategory', id),
//     updateCategory: (id, name) => ipcRenderer.invoke('database:updateCategory', id, name),
    
//     // Components
//     getComponents: (categoryId) => ipcRenderer.invoke('database:getComponents', categoryId),
//     getComponent: (id) => ipcRenderer.invoke('database:getComponent', id),
//     addComponent: (componentData) => ipcRenderer.invoke('database:addComponent', componentData),
//     updateComponent: (componentData) => ipcRenderer.invoke('database:updateComponent', componentData),
//     deleteComponent: (id) => ipcRenderer.invoke('database:deleteComponent', id),
    
//     // Search and utilities
//     searchComponents: (query) => ipcRenderer.invoke('database:searchComponents', query),
//     getDatabaseStats: () => ipcRenderer.invoke('database:getDatabaseStats'),
//     getDatabaseInfo: () => ipcRenderer.invoke('database:getDatabaseInfo'),
//     getDebugInfo: () => ipcRenderer.invoke('database:getDebugInfo'),
    
//     // Export/Import
//     exportDatabase: (destinationPath) => ipcRenderer.invoke('database:exportDatabase', destinationPath),
//     importDatabase: (sourcePath) => ipcRenderer.invoke('database:importDatabase', sourcePath)
//   },
//   debug: {
//     checkFS: () => ipcRenderer.invoke('debug:checkFS')
//   }
// }

// // Dialog and system APIs
// const systemAPI = {
//   dialog: {
//     showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
//     showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options)
//   },
//   shell: {
//     showItemInFolder: (path) => ipcRenderer.invoke('shell:showItemInFolder', path),
//     openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
//   }
// }

// // Use `contextBridge` APIs to expose Electron APIs to
// // renderer only if context isolation is enabled, otherwise
// // just add to the DOM global.
// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld('electron', electronAPI)
//     contextBridge.exposeInMainWorld('api', api)
//     contextBridge.exposeInMainWorld('electronAPI', systemAPI)
//   } catch (error) {
//     console.error(error)
//   }
// } else {
//   window.electron = electronAPI
//   window.api = api
//   window.electronAPI = systemAPI
// }










































// import { contextBridge, ipcRenderer } from 'electron'
// import { electronAPI } from '@electron-toolkit/preload'

// // Custom APIs for renderer
// const api = {
//   database: {
//     // Categories
//     getCategories: () => ipcRenderer.invoke('database:getCategories'),
//     addCategory: (name) => ipcRenderer.invoke('database:addCategory', name),
//     deleteCategory: (id) => ipcRenderer.invoke('database:deleteCategory', id),
//     updateCategory: (id, name) => ipcRenderer.invoke('database:updateCategory', id, name),
    
//     // Components
//     getComponents: (categoryId) => ipcRenderer.invoke('database:getComponents', categoryId),
//     getComponent: (id) => ipcRenderer.invoke('database:getComponent', id),
//     addComponent: (componentData) => ipcRenderer.invoke('database:addComponent', componentData),
//     updateComponent: (componentData) => ipcRenderer.invoke('database:updateComponent', componentData),
//     deleteComponent: (id) => ipcRenderer.invoke('database:deleteComponent', id),
    
//     // Search and utilities
//     searchComponents: (query) => ipcRenderer.invoke('database:searchComponents', query),
//     getDatabaseStats: () => ipcRenderer.invoke('database:getDatabaseStats'),
//     getDatabaseInfo: () => ipcRenderer.invoke('database:getDatabaseInfo'),
//     getDebugInfo: () => ipcRenderer.invoke('database:getDebugInfo'),
    
//     // Export/Import
//     exportDatabase: (destinationPath) => ipcRenderer.invoke('database:exportDatabase', destinationPath),
//     importDatabase: (sourcePath) => ipcRenderer.invoke('database:importDatabase', sourcePath)
//   },
  
//   // Dialog and system APIs
//   dialog: {
//     showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
//     showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options)
//   },
  
//   shell: {
//     showItemInFolder: (path) => ipcRenderer.invoke('shell:showItemInFolder', path),
//     openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
//   },
  
//   debug: {
//     checkFS: () => ipcRenderer.invoke('debug:checkFS')
//   }
// }

// // Use `contextBridge` APIs to expose Electron APIs to
// // renderer only if context isolation is enabled, otherwise
// // just add to the DOM global.
// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld('electron', electronAPI)
//     contextBridge.exposeInMainWorld('api', api)
//   } catch (error) {
//     console.error(error)
//   }
// } else {
//   window.electron = electronAPI
//   window.api = api
// }
























































import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  database: {
    // Categories
    getCategories: () => ipcRenderer.invoke('database:getCategories'),
    addCategory: (name) => ipcRenderer.invoke('database:addCategory', name),
    deleteCategory: (id) => ipcRenderer.invoke('database:deleteCategory', id),
    
    // Components
    getComponents: (categoryId) => ipcRenderer.invoke('database:getComponents', categoryId),
    getComponent: (id) => ipcRenderer.invoke('database:getComponent', id),
    addComponent: (componentData) => ipcRenderer.invoke('database:addComponent', componentData),
    updateComponent: (componentData) => ipcRenderer.invoke('database:updateComponent', componentData),
    deleteComponent: (id) => ipcRenderer.invoke('database:deleteComponent', id),
    
    // Search and utilities
    searchComponents: (query) => ipcRenderer.invoke('database:searchComponents', query),
    getDatabaseStats: () => ipcRenderer.invoke('database:getDatabaseStats'),
    checkIntegrity: () => ipcRenderer.invoke('database:checkIntegrity')
  },

  window: {
    openBrowser: (url) => ipcRenderer.invoke('window:openBrowser', url)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
