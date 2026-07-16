import JSZip from 'jszip'

const APP_STATE_KEY = 'markdown-card-app-state'
const MARKDOWN_EXTENSIONS = /\.(md|markdown|txt)$/i
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|svg)$/i
const FONT_EXTENSIONS = /\.(ttf|otf|woff2?)$/i
const DATABASE_NAME = 'markdown2card-web-storage'
const DATABASE_STORE = 'keyval'

let outputDirectoryHandle = null
let fontDirectoryName = ''
let fontFiles = []
let virtualFiles = new Map()
let batchArchive = null
const fileDataUrlCache = new WeakMap()
const remoteImageCache = new Map()
const remoteImageInflight = new Map()

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('当前浏览器不支持 IndexedDB'))
      return
    }
    const request = window.indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DATABASE_STORE)) {
        request.result.createObjectStore(DATABASE_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('IndexedDB 打开失败'))
  })
}

async function databaseGet(key) {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(DATABASE_STORE, 'readonly')
      const request = transaction.objectStore(DATABASE_STORE).get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('IndexedDB 读取失败'))
    })
  } finally {
    database.close()
  }
}

async function databaseSet(key, value) {
  const database = await openDatabase()
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(DATABASE_STORE, 'readwrite')
      transaction.objectStore(DATABASE_STORE).put(value, key)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error || new Error('IndexedDB 保存失败'))
      transaction.onabort = () => reject(transaction.error || new Error('IndexedDB 保存已中止'))
    })
  } finally {
    database.close()
  }
}

async function hasHandlePermission(handle, mode = 'read') {
  if (!handle?.queryPermission) return false
  try { return await handle.queryPermission({ mode }) === 'granted' } catch { return false }
}

function normalizeVirtualPath(value) {
  const parts = String(value || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(part => part && part !== '.')
  const normalized = []
  for (const part of parts) {
    if (part === '..') normalized.pop()
    else normalized.push(part)
  }
  return normalized.join('/')
}

function dirname(value) {
  const parts = normalizeVirtualPath(value).split('/')
  parts.pop()
  return parts.join('/')
}

function safeName(value) {
  return String(value || 'untitled')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim()
    .slice(0, 120) || 'untitled'
}

function readAsDataUrl(file) {
  if (fileDataUrlCache.has(file)) return fileDataUrlCache.get(file)
  const pending = new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error(`无法读取 ${file.name}`))
    reader.readAsDataURL(file)
  })
  fileDataUrlCache.set(file, pending)
  return pending
}

function pickFiles({ accept = '', multiple = false, directory = false } = {}) {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple || directory
    if (directory) {
      input.webkitdirectory = true
      input.setAttribute('webkitdirectory', '')
    }
    input.style.display = 'none'
    document.body.appendChild(input)

    let settled = false
    let focusTimer = 0
    const handleFocus = () => {
      window.clearTimeout(focusTimer)
      focusTimer = window.setTimeout(() => {
        if (!settled && !input.files?.length) finish([])
      }, 350)
    }
    const finish = files => {
      if (settled) return
      settled = true
      window.clearTimeout(focusTimer)
      window.removeEventListener('focus', handleFocus)
      input.remove()
      resolve(Array.from(files || []))
    }

    input.addEventListener('change', () => finish(input.files), { once: true })
    input.addEventListener('cancel', () => finish([]), { once: true })
    window.addEventListener('focus', handleFocus)
    input.click()
  })
}

function registerVirtualFiles(files) {
  virtualFiles = new Map()
  for (const file of files) {
    const relativePath = normalizeVirtualPath(file.webkitRelativePath || file.name)
    virtualFiles.set(relativePath, file)
    virtualFiles.set(relativePath.toLowerCase(), file)
  }
}

async function markdownRecords(files) {
  registerVirtualFiles(files)
  const records = []
  for (const file of files) {
    if (!MARKDOWN_EXTENSIONS.test(file.name)) continue
    const virtualPath = normalizeVirtualPath(file.webkitRelativePath || file.name)
    records.push({
      path: virtualPath,
      baseDir: dirname(virtualPath),
      name: file.name,
      content: await file.text()
    })
  }
  return records.sort((a, b) => a.path.localeCompare(b.path, 'zh-Hans-CN'))
}

function isEmbeddedImage(href) {
  return /^(?:data:|blob:)/i.test(href)
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('图片转换失败'))
    reader.readAsDataURL(blob)
  })
}

async function fetchImageAsDataUrl(href) {
  if (remoteImageCache.has(href)) return remoteImageCache.get(href)
  if (remoteImageInflight.has(href)) return remoteImageInflight.get(href)

  const pending = (async () => {
    const candidates = [href, `/img-proxy?url=${encodeURIComponent(href)}`]
    for (const url of candidates) {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 5000)
      try {
        const response = await fetch(url, { cache: 'force-cache', signal: controller.signal })
        if (response.ok) return await blobToDataUrl(await response.blob())
      } catch {
        // Try the same-origin proxy when the remote server does not allow CORS.
      } finally {
        window.clearTimeout(timer)
      }
    }
    return href
  })()

  remoteImageInflight.set(href, pending)
  try {
    const result = await pending
    remoteImageCache.set(href, result)
    return result
  } finally {
    remoteImageInflight.delete(href)
  }
}

function parseMarkdownImageDestination(destination) {
  const value = String(destination || '').trim()
  if (value.startsWith('<')) {
    const close = value.indexOf('>')
    if (close > 0) return { href: value.slice(1, close), title: value.slice(close + 1).trim() }
  }
  const match = value.match(/^(\S+?)(\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?$/)
  return match
    ? { href: match[1], title: (match[2] || '').trim() }
    : { href: value, title: '' }
}

async function resolveImageHref(href, baseDir, state) {
  const rawHref = String(href || '').trim()
  if (!rawHref || isEmbeddedImage(rawHref) || rawHref.startsWith('#')) return rawHref
  if (/^https?:/i.test(rawHref)) return fetchImageAsDataUrl(rawHref)
  if (/^(?:file:|\/\/)/i.test(rawHref)) return rawHref

  let decoded = rawHref.split(/[?#]/, 1)[0]
  try { decoded = decodeURIComponent(decoded) } catch {}
  const candidate = normalizeVirtualPath(`${baseDir || ''}/${decoded}`)
  const file = virtualFiles.get(candidate) || virtualFiles.get(candidate.toLowerCase())
  if (!file || !IMAGE_EXTENSIONS.test(file.name)) {
    state.missing.push(rawHref)
    return rawHref
  }

  state.resolved += 1
  return readAsDataUrl(file)
}

async function rewriteMarkdownImages(markdown, baseDir, state) {
  const source = String(markdown || '')
  const pattern = /!\[([^\]]*)\]\(([^)\n]+)\)/g
  let output = ''
  let lastIndex = 0
  for (const match of source.matchAll(pattern)) {
    const [full, alt, destination] = match
    const parsed = parseMarkdownImageDestination(destination)
    const href = await resolveImageHref(parsed.href, baseDir, state)
    output += source.slice(lastIndex, match.index)
    output += `![${alt}](${href}${parsed.title ? ` ${parsed.title}` : ''})`
    lastIndex = match.index + full.length
  }
  return output + source.slice(lastIndex)
}

async function rewriteHtmlImages(markdown, baseDir, state) {
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
  return output + source.slice(lastIndex)
}

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+);base64,([\s\S]+)$/)
  if (!match) throw new Error('图片数据格式无效')
  const bytes = atob(match[2].replace(/\s+/g, ''))
  const buffer = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i += 1) buffer[i] = bytes.charCodeAt(i)
  return new Blob([buffer], { type: match[1] })
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

async function writeBlob(directory, filename, blob) {
  const fileHandle = await directory.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

async function collectFontFilesFromHandle(handle, prefix = '') {
  const results = []
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind === 'file' && FONT_EXTENSIONS.test(name)) {
      const file = await entry.getFile()
      results.push(file)
    } else if (entry.kind === 'directory') {
      results.push(...await collectFontFilesFromHandle(entry, `${prefix}${name}/`))
    }
  }
  return results
}

function fontMime(name) {
  const ext = String(name).split('.').pop()?.toLowerCase()
  if (ext === 'woff2') return 'font/woff2'
  if (ext === 'woff') return 'font/woff'
  if (ext === 'otf') return 'font/otf'
  return 'font/ttf'
}

async function webOpenFontDirectory() {
  try {
    if (window.showDirectoryPicker) {
      const handle = await window.showDirectoryPicker({ mode: 'read' })
      fontFiles = await collectFontFilesFromHandle(handle)
      fontDirectoryName = handle.name
      await databaseSet('fontDirectoryHandle', handle).catch(() => undefined)
    } else {
      fontFiles = await pickFiles({ accept: '.ttf,.otf,.woff,.woff2', multiple: true, directory: true })
        .then(files => files.filter(file => FONT_EXTENSIONS.test(file.name)))
      fontDirectoryName = fontFiles[0]?.webkitRelativePath?.split('/')[0] || '已选择的字体文件'
    }
    return { ok: true, dir: fontDirectoryName || '字体文件夹' }
  } catch (error) {
    if (error?.name === 'AbortError') return { ok: false, dir: fontDirectoryName, error: '已取消选择' }
    throw error
  }
}

async function webListFonts() {
  if (!fontFiles.length && window.showDirectoryPicker) {
    const savedHandle = await databaseGet('fontDirectoryHandle').catch(() => null)
    if (await hasHandlePermission(savedHandle, 'read')) {
      fontFiles = await collectFontFilesFromHandle(savedHandle)
      fontDirectoryName = savedHandle.name
    }
  }
  const fonts = []
  for (let i = 0; i < fontFiles.length; i += 1) {
    const file = fontFiles[i]
    const baseName = file.name.replace(/\.(ttf|otf|woff2?)$/i, '')
    const raw = await readAsDataUrl(file)
    const dataUrl = raw.replace(/^data:[^;,]+/, `data:${fontMime(file.name)}`)
    fonts.push({
      name: baseName,
      family: `WebCustomFont_${i}_${baseName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      dataUrl
    })
  }
  return { dir: fontDirectoryName || '浏览器字体目录', dirs: fontDirectoryName ? [fontDirectoryName] : [], fonts }
}

async function webSelectOutputFolder() {
  if (!window.showDirectoryPicker) {
    outputDirectoryHandle = null
    return '浏览器下载目录（ZIP）'
  }
  try {
    outputDirectoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
    await databaseSet('outputDirectoryHandle', outputDirectoryHandle).catch(() => undefined)
    return outputDirectoryHandle.name
  } catch (error) {
    if (error?.name === 'AbortError') return ''
    throw error
  }
}

async function webSaveImages({ articleName, images, mode = 'folder' } = {}) {
  if (!Array.isArray(images) || !images.length) throw new Error('没有可保存的图片')
  const article = safeName(articleName)
  const records = images.map((image, index) => ({
    filename: mode === 'flat'
      ? `${article}-${String(index + 1).padStart(3, '0')}.png`
      : `card-${String(index + 1).padStart(3, '0')}.png`,
    blob: dataUrlToBlob(image.dataUrl)
  }))

  if (outputDirectoryHandle) {
    const target = mode === 'flat'
      ? outputDirectoryHandle
      : await outputDirectoryHandle.getDirectoryHandle(article, { create: true })
    for (const record of records) await writeBlob(target, record.filename, record.blob)
    const dir = mode === 'flat' ? outputDirectoryHandle.name : `${outputDirectoryHandle.name}/${article}`
    return { dir, files: records.map(record => `${dir}/${record.filename}`) }
  }

  if (batchArchive) {
    const target = mode === 'folder' ? batchArchive.folder(article) : batchArchive
    for (const record of records) target.file(record.filename, record.blob)
    const dir = mode === 'folder' ? `markdown2card-batch.zip/${article}` : 'markdown2card-batch.zip'
    return { dir, files: records.map(record => `${dir}/${record.filename}`) }
  }

  const zip = new JSZip()
  for (const record of records) zip.file(record.filename, record.blob)
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
  const filename = `${article}.zip`
  downloadBlob(blob, filename)
  return { dir: '浏览器下载目录', files: records.map(record => `${filename}/${record.filename}`) }
}

async function webSaveBatchReport({ report } = {}) {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const success = Array.isArray(report?.success) ? report.success : []
  const failed = Array.isArray(report?.failed) ? report.failed : []
  const text = [
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
  ].join('\n')
  const filename = `batch-export-report-${stamp}.txt`
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  if (outputDirectoryHandle) await writeBlob(outputDirectoryHandle, filename, blob)
  else if (batchArchive) batchArchive.file(filename, blob)
  else downloadBlob(blob, filename)
  return { filePath: outputDirectoryHandle ? `${outputDirectoryHandle.name}/${filename}` : filename }
}

async function loadWebAppState() {
  let state = await databaseGet('appState').catch(() => null)
  if (!state) {
    try { state = JSON.parse(localStorage.getItem(APP_STATE_KEY) || 'null') } catch { state = null }
  }
  if (!state || typeof state !== 'object') return null

  const savedHandle = await databaseGet('outputDirectoryHandle').catch(() => null)
  if (await hasHandlePermission(savedHandle, 'readwrite')) {
    outputDirectoryHandle = savedHandle
    state.outputDir = savedHandle.name
  } else {
    outputDirectoryHandle = null
    state.outputDir = ''
  }
  return state
}

async function saveWebAppState(payload) {
  await databaseSet('appState', payload || {})
  localStorage.removeItem(APP_STATE_KEY)
  return true
}

export function createWebApi() {
  return {
    openMarkdownFiles: async () => markdownRecords(await pickFiles({ accept: '.md,.markdown,.txt', multiple: true })),
    openMarkdownFolder: async () => markdownRecords(await pickFiles({ directory: true })),
    openImage: async () => {
      const [file] = await pickFiles({ accept: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml' })
      return file ? readAsDataUrl(file) : ''
    },
    selectOutputFolder: webSelectOutputFolder,
    saveImages: webSaveImages,
    saveBatchReport: webSaveBatchReport,
    beginBatchExport: async () => {
      batchArchive = outputDirectoryHandle ? null : new JSZip()
      return true
    },
    finishBatchExport: async () => {
      if (!batchArchive) return null
      const archive = batchArchive
      batchArchive = null
      const blob = await archive.generateAsync({ type: 'blob', compression: 'STORE' })
      downloadBlob(blob, 'markdown2card-batch.zip')
      return { filePath: 'markdown2card-batch.zip' }
    },
    loadAppState: loadWebAppState,
    saveAppState: saveWebAppState,
    listFonts: webListFonts,
    openFontDir: webOpenFontDirectory,
    resolveMarkdownImages: async ({ markdown = '', baseDir = '' } = {}) => {
      const state = { resolved: 0, missing: [] }
      const withMarkdown = await rewriteMarkdownImages(markdown, baseDir, state)
      const withHtml = await rewriteHtmlImages(withMarkdown, baseDir, state)
      return { markdown: withHtml, resolved: state.resolved, missing: state.missing }
    },
    saveTempImage: async ({ dataUrl = '' } = {}) => {
      if (!/^data:image\//i.test(dataUrl)) throw new Error('剪贴板图片数据无效')
      return { dir: '浏览器内存', filePath: dataUrl, markdownPath: dataUrl }
    }
  }
}
