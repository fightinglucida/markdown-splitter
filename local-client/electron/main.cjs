const { app, BrowserWindow, dialog, ipcMain, shell, Menu } = require('electron')
const path = require('path')
const fs = require('fs/promises')
const { fileURLToPath, pathToFileURL } = require('url')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    title: 'Markdown2Card',
    width: 1360,
    height: 880,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#ecece6',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.maximize()
  win.removeMenu()

  if (isDev) {
    win.loadURL('http://127.0.0.1:5188')
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
})

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

function settingsFilePath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function imageCacheDir() {
  return path.join(app.getPath('temp'), 'Markdown2Card', 'image-cache')
}

function customFontDirs() {
  if (app.isPackaged) {
    const appDir = path.dirname(app.getPath('exe'))
    return [
      path.join(appDir, 'fonts'),
      path.join(appDir, 'font')
    ]
  }
  const root = path.join(__dirname, '..')
  return [
    path.join(root, 'fonts'),
    path.join(root, 'font')
  ]
}

function fontMime(ext) {
  if (ext === '.woff2') return 'font/woff2'
  if (ext === '.woff') return 'font/woff'
  if (ext === '.otf') return 'font/otf'
  return 'font/ttf'
}

function fontFamilyFromFile(fileName, index) {
  const ext = path.extname(fileName)
  const base = fileName.slice(0, Math.max(0, fileName.length - ext.length))
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return `M2CFont-${index + 1}-${base || 'Custom'}`
}

function fontNameFromFile(fileName) {
  const ext = path.extname(fileName)
  return fileName.slice(0, Math.max(0, fileName.length - ext.length))
}

function imageMime(ext) {
  const normalized = String(ext || '').toLowerCase()
  if (normalized === '.jpg' || normalized === '.jpeg') return 'image/jpeg'
  if (normalized === '.webp') return 'image/webp'
  if (normalized === '.gif') return 'image/gif'
  if (normalized === '.svg') return 'image/svg+xml'
  if (normalized === '.avif') return 'image/avif'
  return 'image/png'
}

function imageExtensionFromMime(mime) {
  const normalized = String(mime || '').toLowerCase()
  if (normalized === 'image/jpeg') return '.jpg'
  if (normalized === 'image/webp') return '.webp'
  if (normalized === 'image/gif') return '.gif'
  if (normalized === 'image/svg+xml') return '.svg'
  if (normalized === 'image/avif') return '.avif'
  return '.png'
}

function isSupportedImagePath(filePath) {
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'].includes(path.extname(filePath).toLowerCase())
}

function decodePathPart(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function resolveLocalImagePath(href, baseDir = '') {
  const raw = String(href || '').trim()
  if (!raw || /^(https?:|data:|blob:|mailto:|#)/i.test(raw)) return ''

  const cleanHref = raw.replace(/[?#].*$/, '')
  let filePath = ''

  if (/^file:/i.test(cleanHref)) {
    try {
      filePath = fileURLToPath(cleanHref)
    } catch {
      return ''
    }
  } else {
    const decoded = decodePathPart(cleanHref)
    if (/^[a-zA-Z]:[\\/]/.test(decoded) || path.isAbsolute(decoded)) {
      filePath = decoded
    } else if (baseDir) {
      filePath = path.resolve(baseDir, decoded)
    }
  }

  if (!filePath || !isSupportedImagePath(filePath)) return ''
  return filePath
}

function parseMarkdownImageDestination(value) {
  const inner = String(value || '').trim()
  if (inner.startsWith('<')) {
    const end = inner.indexOf('>')
    if (end > 0) {
      return {
        href: inner.slice(1, end),
        title: inner.slice(end + 1).trim()
      }
    }
  }

  const titleMatch = inner.match(/^(\S+)(\s+["'][\s\S]*["'])$/)
  if (titleMatch) {
    return {
      href: titleMatch[1],
      title: titleMatch[2].trim()
    }
  }

  return { href: inner, title: '' }
}

async function imageFileToDataUrl(filePath) {
  const buffer = await fs.readFile(filePath)
  return `data:${imageMime(path.extname(filePath))};base64,${buffer.toString('base64')}`
}

async function resolveImageHref(href, baseDir, state) {
  const filePath = resolveLocalImagePath(href, baseDir)
  if (!filePath) return href

  try {
    const dataUrl = await imageFileToDataUrl(filePath)
    state.resolved += 1
    return dataUrl
  } catch {
    state.missing.push(href)
    return href
  }
}

async function rewriteMarkdownImageLinks(markdown, baseDir, state) {
  const source = String(markdown || '')
  const pattern = /!\[([^\]]*)\]\(([^)\n]+)\)/g
  let output = ''
  let lastIndex = 0

  for (const match of source.matchAll(pattern)) {
    const [full, alt, destination] = match
    const parsed = parseMarkdownImageDestination(destination)
    const nextHref = await resolveImageHref(parsed.href, baseDir, state)
    const title = parsed.title ? ` ${parsed.title}` : ''
    output += source.slice(lastIndex, match.index)
    output += `![${alt}](${nextHref}${title})`
    lastIndex = match.index + full.length
  }

  output += source.slice(lastIndex)
  return output
}

async function rewriteHtmlImageSources(markdown, baseDir, state) {
  const source = String(markdown || '')
  const pattern = /(<img\b[^>]*\bsrc\s*=\s*)(["'])(.*?)\2/gi
  let output = ''
  let lastIndex = 0

  for (const match of source.matchAll(pattern)) {
    const [full, prefix, quote, href] = match
    const nextHref = await resolveImageHref(href, baseDir, state)
    output += source.slice(lastIndex, match.index)
    output += `${prefix}${quote}${nextHref}${quote}`
    lastIndex = match.index + full.length
  }

  output += source.slice(lastIndex)
  return output
}

async function resolveMarkdownImages(markdown, baseDir) {
  const state = { resolved: 0, missing: [] }
  const withMarkdownImages = await rewriteMarkdownImageLinks(markdown, baseDir, state)
  const withHtmlImages = await rewriteHtmlImageSources(withMarkdownImages, baseDir, state)
  return {
    markdown: withHtmlImages,
    resolved: state.resolved,
    missing: state.missing
  }
}

ipcMain.handle('settings:loadAppState', async () => {
  try {
    const raw = await fs.readFile(settingsFilePath(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
})

ipcMain.handle('settings:saveAppState', async (_event, payload) => {
  const filePath = settingsFilePath()
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(payload || {}, null, 2), 'utf8')
  return true
})

ipcMain.handle('fonts:list', async () => {
  const dirs = customFontDirs()
  await ensureDir(dirs[0])

  const fonts = []
  for (const dir of dirs) {
    let entries = []
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      continue
    }

    entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const ext = path.extname(entry.name).toLowerCase()
      if (!['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) continue
      const filePath = path.join(dir, entry.name)
      const buffer = await fs.readFile(filePath)
      fonts.push({
        name: fontNameFromFile(entry.name),
        family: fontFamilyFromFile(entry.name, fonts.length),
        dataUrl: `data:${fontMime(ext)};base64,${buffer.toString('base64')}`
      })
    }
  }

  return {
    dir: dirs.join('；'),
    dirs,
    fonts
  }
})

ipcMain.handle('fonts:openDir', async () => {
  const dir = customFontDirs()[0]
  await ensureDir(dir)
  const error = await shell.openPath(dir)
  return { ok: !error, dir, error }
})

ipcMain.handle('images:resolveMarkdownImages', async (_event, payload) => {
  const { markdown = '', baseDir = '' } = payload || {}
  return resolveMarkdownImages(markdown, baseDir)
})

ipcMain.handle('images:saveTempImage', async (_event, payload) => {
  const dataUrl = String(payload?.dataUrl || '')
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/)
  if (!match) throw new Error('剪贴板图片数据无效')

  const mime = match[1]
  const base64 = match[2].replace(/\s+/g, '')
  const ext = imageExtensionFromMime(mime)
  const dir = imageCacheDir()
  await ensureDir(dir)

  const random = Math.random().toString(36).slice(2, 8)
  const fileName = `paste-${Date.now()}-${random}${ext}`
  const filePath = path.join(dir, fileName)
  await fs.writeFile(filePath, Buffer.from(base64, 'base64'))

  return {
    dir,
    filePath,
    markdownPath: pathToFileURL(filePath).href
  }
})

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
      baseDir: path.dirname(filePath),
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
      baseDir: path.dirname(filePath),
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

ipcMain.handle('file:saveBatchReport', async (_event, payload) => {
  const { outputDir, report } = payload || {}
  if (!outputDir) throw new Error('缺少输出文件夹')
  await ensureDir(outputDir)

  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('')
  const success = Array.isArray(report?.success) ? report.success : []
  const failed = Array.isArray(report?.failed) ? report.failed : []
  const lines = [
    'Markdown2Card 批量导出结果',
    `时间：${now.toLocaleString('zh-CN')}`,
    `成功：${success.length}`,
    `失败：${failed.length}`,
    '',
    '成功清单：',
    ...success.map((item, index) => `${index + 1}. ${item.name} -> ${item.count || 0} 张`),
    '',
    '失败清单：',
    ...failed.map((item, index) => `${index + 1}. ${item.name}：${item.error || '未知错误'}`)
  ]
  const filePath = path.join(outputDir, `batch-export-report-${stamp}.txt`)
  await fs.writeFile(filePath, lines.join('\n'), 'utf8')
  return { filePath }
})
