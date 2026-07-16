const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('localCardApi', {
  openMarkdownFiles: () => ipcRenderer.invoke('dialog:openMarkdownFiles'),
  openMarkdownFolder: () => ipcRenderer.invoke('dialog:openMarkdownFolder'),
  openImage: () => ipcRenderer.invoke('dialog:openImage'),
  selectOutputFolder: () => ipcRenderer.invoke('dialog:selectOutputFolder'),
  saveImages: (payload) => ipcRenderer.invoke('file:saveImages', payload),
  saveBatchReport: (payload) => ipcRenderer.invoke('file:saveBatchReport', payload),
  loadAppState: () => ipcRenderer.invoke('settings:loadAppState'),
  saveAppState: (payload) => ipcRenderer.invoke('settings:saveAppState', payload),
  listFonts: () => ipcRenderer.invoke('fonts:list'),
  openFontDir: () => ipcRenderer.invoke('fonts:openDir'),
  resolveMarkdownImages: (payload) => ipcRenderer.invoke('images:resolveMarkdownImages', payload),
  saveTempImage: (payload) => ipcRenderer.invoke('images:saveTempImage', payload)
})
