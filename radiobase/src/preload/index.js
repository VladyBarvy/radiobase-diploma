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
