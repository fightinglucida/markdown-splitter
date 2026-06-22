const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('localCardApi', {
  openMarkdownFiles: () => ipcRenderer.invoke('dialog:openMarkdownFiles'),
  openMarkdownFolder: () => ipcRenderer.invoke('dialog:openMarkdownFolder'),
  openImage: () => ipcRenderer.invoke('dialog:openImage'),
  selectOutputFolder: () => ipcRenderer.invoke('dialog:selectOutputFolder'),
  saveImages: (payload) => ipcRenderer.invoke('file:saveImages', payload)
})
