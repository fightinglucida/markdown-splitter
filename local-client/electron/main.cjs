const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs/promises')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#101114',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.maximize()

  if (isDev) {
    win.loadURL('http://127.0.0.1:5188')
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

function safeName(name) {
  return String(name || 'untitled')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'untitled'
}

ipcMain.handle('dialog:openMarkdownFiles', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择 Markdown 文件',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }
    ]
  })
  if (result.canceled) return []

  const files = []
  for (const filePath of result.filePaths) {
    const content = await fs.readFile(filePath, 'utf8')
    files.push({
      path: filePath,
      name: path.basename(filePath),
      content
    })
  }
  return files
})

ipcMain.handle('dialog:openMarkdownFolder', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择 Markdown 文件夹',
    properties: ['openDirectory']
  })
  if (result.canceled || !result.filePaths[0]) return []

  const root = result.filePaths[0]
  const entries = await fs.readdir(root, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (!/\.(md|markdown|txt)$/i.test(entry.name)) continue
    const filePath = path.join(root, entry.name)
    const content = await fs.readFile(filePath, 'utf8')
    files.push({
      path: filePath,
      name: entry.name,
      content
    })
  }
  return files
})

ipcMain.handle('dialog:selectOutputFolder', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择输出文件夹',
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled) return ''
  return result.filePaths[0] || ''
})

ipcMain.handle('dialog:openImage', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择图片',
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] }
    ]
  })
  if (result.canceled || !result.filePaths[0]) return ''
  const filePath = result.filePaths[0]
  const buffer = await fs.readFile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mime = ext === '.svg'
    ? 'image/svg+xml'
    : ext === '.webp'
      ? 'image/webp'
      : ext === '.gif'
        ? 'image/gif'
        : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : 'image/png'
  return `data:${mime};base64,${buffer.toString('base64')}`
})

ipcMain.handle('file:saveImages', async (_event, payload) => {
  const { outputDir, articleName, images, mode = 'folder' } = payload || {}
  if (!outputDir) throw new Error('缺少输出文件夹')
  if (!Array.isArray(images) || images.length === 0) throw new Error('没有可保存的图片')

  const safeArticleName = safeName(articleName)
  const articleDir = mode === 'flat' ? outputDir : path.join(outputDir, safeArticleName)
  await ensureDir(articleDir)

  const saved = []
  for (let i = 0; i < images.length; i += 1) {
    const image = images[i]
    const base64 = String(image.dataUrl || '').replace(/^data:image\/png;base64,/, '')
    if (!base64) continue
    const fileName = mode === 'flat'
      ? `${safeArticleName}-${String(i + 1).padStart(3, '0')}.png`
      : `card-${String(i + 1).padStart(3, '0')}.png`
    const filePath = path.join(articleDir, fileName)
    await fs.writeFile(filePath, Buffer.from(base64, 'base64'))
    saved.push(filePath)
  }

  if (saved.length === 0) throw new Error('图片数据为空，未写入文件')

  return { dir: articleDir, files: saved }
})
