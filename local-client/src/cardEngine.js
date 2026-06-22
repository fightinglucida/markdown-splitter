import { marked } from 'marked'

export const ratios = {
  '1:1': { label: '1:1', width: 800, height: 800 },
  '3:4': { label: '3:4', width: 600, height: 800 },
  '4:3': { label: '4:3', width: 800, height: 600 },
  '9:16': { label: '9:16', width: 562, height: 1000 },
  '16:9': { label: '16:9', width: 1000, height: 562 }
}

export const templates = {
  modern: {
    name: '现代简约',
    className: 'template-modern',
    defaultRatio: '3:4',
    padding: 0,
    contentFontSize: 18,
    lineHeight: 1.7,
    background: 'linear-gradient(135deg, #f8956f 0%, #ec6d47 100%)',
    cardBackground: 'transparent',
    textColor: '#2c2c2c',
    accentColor: '#3a3a3a',
    titleColor: '#1a1a1a',
    author: { show: false },
    watermark: { show: true, text: '赚钱就是把时代的杠杆拉满', position: 'bottom-center' },
    pageNumber: { show: false, format: 'number' }
  },
  elegant: {
    name: '每天学习',
    className: 'template-elegant',
    defaultRatio: '3:4',
    padding: 32,
    contentFontSize: 20,
    lineHeight: 1.8,
    background: '#f5f5f5',
    cardBackground: 'transparent',
    textColor: '#000000',
    accentColor: '#9e9e9e',
    titleColor: '#000000',
    author: { show: true, avatarSize: 36, nicknameColor: '#2d3436', usernameColor: '#636e72' },
    watermark: { show: true, text: '每天学习一个AI技巧', position: 'top-left' },
    pageNumber: { show: true, format: 'number' }
  },
  scholarly: {
    name: '书香墨韵',
    className: 'template-scholarly',
    defaultRatio: '3:4',
    padding: 48,
    contentFontSize: 20,
    lineHeight: 1.48,
    background: '#fbfbf7',
    cardBackground: 'transparent',
    textColor: '#000000',
    accentColor: '#111111',
    titleColor: '#111111',
    author: { show: true, avatarSize: 58, nicknameColor: '#111111', usernameColor: '#555555' },
    watermark: { show: false, text: '', position: 'none' },
    pageNumber: { show: true, format: 'single' },
    time: { show: true, format: 'MM/DD' }
  },
  teaching: {
    name: '教学卡片',
    className: 'template-teaching',
    defaultRatio: '3:4',
    padding: 8,
    contentFontSize: 22,
    lineHeight: 1.7,
    background: '#3C67B0',
    cardBackground: '#ffffff',
    textColor: '#2d3436',
    accentColor: '#5a6c7d',
    titleColor: '#2c3e50',
    author: { show: true, avatarSize: 64, nicknameColor: 'transparent', usernameColor: 'transparent' },
    watermark: { show: true, text: '林书知识库', position: 'bottom-left' },
    pageNumber: { show: true, format: 'number' }
  }
}

marked.setOptions({
  gfm: true,
  breaks: false,
  mangle: false,
  headerIds: false
})

export function extractTitle(markdown, fallback = '未命名文章') {
  const frontmatterTitle = markdown.match(/^---[\s\S]*?\ntitle:\s*(.+?)\n[\s\S]*?---/)
  if (frontmatterTitle?.[1]) return frontmatterTitle[1].trim().replace(/^["']|["']$/g, '')
  const heading = markdown.match(/^\s*#\s+(.+)$/m)
  if (heading?.[1]) return heading[1].trim()
  return fallback.replace(/\.(md|markdown|txt)$/i, '')
}

export function stripFrontmatter(markdown) {
  return markdown.replace(/^---[\s\S]*?---\s*/, '')
}

export function markdownToHtml(markdown) {
  return marked.parse(markdown || '')
}

export function splitMarkdown(markdown) {
  const clean = stripFrontmatter(markdown)
    .replace(/^\s*#\s+.+$/m, '')
    .trim()

  const pages = []
  let currentManual = []

  for (const line of clean.split(/\r?\n/)) {
    if (line.trim() === '---') {
      pages.push(currentManual.join('\n').trim())
      currentManual = []
    } else {
      currentManual.push(line)
    }
  }
  pages.push(currentManual.join('\n').trim())

  return pages.map(section => splitBlocks(section)).filter(section => section.length > 0)
}

function splitBlocks(section) {
  const lines = section.split(/\r?\n/)
  const blocks = []
  let buffer = []
  let inFence = false
  let paragraphId = 0

  const flush = () => {
    const text = buffer.join('\n').trim()
    if (text) {
      const units = splitBlockIntoUnits(text, paragraphId)
      blocks.push(...units)
      paragraphId += 1
    }
    buffer = []
  }

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      buffer.push(line)
      inFence = !inFence
      if (!inFence) flush()
      continue
    }

    if (!inFence && line.trim() === '') {
      flush()
      continue
    }

    buffer.push(line)
  }

  flush()
  return blocks
}

function splitBlockIntoUnits(text, id) {
  if (!isSplittableParagraph(text)) {
    return [{ text, group: `block-${id}`, merge: false }]
  }

  const sentences = text
    .replace(/\s*\n\s*/g, '')
    .match(/[^。！？!?；;]+[。！？!?；;]?|.+$/g)
    ?.map(item => item.trim())
    .filter(Boolean) || [text]

  if (sentences.length <= 1) {
    return [{ text, group: `paragraph-${id}`, merge: false }]
  }

  return sentences.map(sentence => ({
    text: sentence,
    group: `paragraph-${id}`,
    merge: true
  }))
}

function isSplittableParagraph(text) {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (trimmed.includes('\n')) return false
  if (/^\s{0,3}#{1,6}\s/.test(trimmed)) return false
  if (/^\s*([-*+]|\d+\.)\s+/.test(trimmed)) return false
  if (/^\s*>/.test(trimmed)) return false
  if (/^\s*```/.test(trimmed)) return false
  if (/^\s*\|/.test(trimmed)) return false
  if (/^\s*</.test(trimmed)) return false
  return /[。！？!?；;]/.test(trimmed) && trimmed.length > 40
}

function renderUnits(units) {
  const blocks = []
  let paragraph = null

  const flushParagraph = () => {
    if (paragraph) {
      blocks.push(paragraph.text)
      paragraph = null
    }
  }

  for (const unit of units) {
    if (unit.merge) {
      if (!paragraph || paragraph.group !== unit.group) {
        flushParagraph()
        paragraph = { group: unit.group, text: unit.text }
      } else {
        paragraph.text += unit.text
      }
      continue
    }

    flushParagraph()
    blocks.push(unit.text)
  }

  flushParagraph()
  return blocks.join('\n\n')
}

export async function waitForAssets(root = document) {
  try {
    await document.fonts?.ready
  } catch {}

  const images = Array.from(root.querySelectorAll?.('img') || [])
  await Promise.all(images.map(img => {
    if (img.complete) return undefined
    return new Promise(resolve => {
      img.onload = resolve
      img.onerror = resolve
    })
  }))
}

export function createMeasurer(config) {
  const ratio = ratios[config.ratio] || ratios['3:4']
  const template = templates[config.template] || templates.modern
  const card = document.createElement('div')
  card.className = `export-card ${template.className}`
  card.style.width = `${ratio.width}px`
  card.style.height = `${ratio.height}px`
  card.style.setProperty('--card-padding', `${config.padding}px`)
  card.style.setProperty('--content-size', `${config.contentFontSize}px`)
  card.style.setProperty('--line-height', String(config.lineHeight))
  card.style.setProperty('--outer-bg', config.background)
  card.style.setProperty('--card-bg', template.cardBackground)
  card.style.setProperty('--text-color', config.textColor)
  card.style.setProperty('--accent-color', template.accentColor)
  card.style.position = 'fixed'
  card.style.left = '-10000px'
  card.style.top = '0'
  card.style.visibility = 'hidden'
  card.innerHTML = measurementMarkup(config.template)
  document.body.appendChild(card)

  const titleEl = card.querySelector('[data-title]')
  const contentEl = card.querySelector('.card-content')
  const watermarkEl = card.querySelector('[data-watermark]')
  const pageEl = card.querySelector('[data-page]')

  return {
    fits(blocks, pageIndex, totalHint = 1) {
      if (titleEl) titleEl.textContent = pageIndex === 0 ? config.title : ''
      card.classList.toggle('is-continuation', pageIndex > 0)
      if (watermarkEl) watermarkEl.textContent = config.watermark || ''
      if (pageEl) pageEl.textContent = config.showPageNumber ? `${pageIndex + 1} / ${totalHint}` : ''
      contentEl.innerHTML = markdownToHtml(renderUnits(blocks) || '&nbsp;')
      return contentEl.scrollHeight <= contentEl.clientHeight
    },
    destroy() {
      card.remove()
    }
  }
}

function measurementMarkup(templateKey) {
  if (templateKey === 'modern') {
    return `
      <div class="modern-knowledge">
        <div class="modern-knowledge__image"><div class="modern-knowledge__placeholder">图片占位区域<br>建议尺寸: 480x350px<br>可替换为封面插图</div></div>
        <div class="modern-knowledge__body">
          <h1 class="modern-knowledge__title" data-title></h1>
          <main class="modern-knowledge__desc markdown-body card-content"></main>
          <div class="modern-knowledge__footer"><div class="modern-knowledge__divider"></div><p class="modern-knowledge__signature">-- <span data-watermark></span> --</p></div>
        </div>
      </div>
    `
  }
  if (templateKey === 'teaching') {
    return `
      <div class="teaching-layer">
        <header class="teaching-titlebar"><div class="teaching-avatar">M</div><h1 data-title></h1></header>
        <main class="teaching-content markdown-body card-content"></main>
        <footer class="teaching-footer"><span data-watermark></span><span data-page></span></footer>
      </div>
    `
  }
  if (templateKey === 'scholarly') {
    return `
      <div class="scholarly-post">
        <header class="scholarly-author"><div class="author-avatar"></div><div><div data-author-name></div><div data-author-user></div></div></header>
        <main class="scholarly-content markdown-body card-content"></main>
        <span class="scholarly-date"></span>
        <span class="scholarly-page" data-page></span>
      </div>
    `
  }
  return `
    <div class="generic-card">
      <h1 class="generic-title" data-title></h1>
      <main class="generic-content markdown-body card-content"></main>
      <footer class="generic-footer"><div class="generic-author"><span class="author-avatar"></span><span data-author-name></span><span data-author-user></span></div><div><span data-watermark></span><span data-page></span></div></footer>
    </div>
  `
}

export function paginateMarkdown(markdown, config) {
  const manualSections = splitMarkdown(markdown)
  const measurer = createMeasurer(config)
  const pages = config.template === 'elegant' ? [''] : []

  try {
    for (const section of manualSections) {
      let current = []
      for (const block of section) {
        const candidate = [...current, block]
        if (candidate.length === 1 || measurer.fits(candidate, pages.length, pages.length + 1)) {
          current = candidate
          continue
        }

        pages.push(renderUnits(current))
        current = [block]
      }
      if (current.length) pages.push(renderUnits(current))
    }
  } finally {
    measurer.destroy()
  }

  return pages.length ? pages : ['']
}
