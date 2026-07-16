import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
const CIRCLED_NUMBERS = new Map([
  ['①', 1], ['②', 2], ['③', 3], ['④', 4], ['⑤', 5],
  ['⑥', 6], ['⑦', 7], ['⑧', 8], ['⑨', 9], ['⑩', 10],
  ['❶', 1], ['❷', 2], ['❸', 3], ['❹', 4], ['❺', 5],
  ['❻', 6], ['❼', 7], ['❽', 8], ['❾', 9], ['❿', 10]
])

export function createNormalizationStats() {
  return {
    orderedLists: 0,
    unorderedLists: 0,
    headings: 0,
    quotes: 0,
    paragraphsMerged: 0,
    whitespaceFixed: 0,
    totalChanges: 0
  }
}

export function mergeNormalizationStats(target, source) {
  for (const key of Object.keys(createNormalizationStats())) {
    if (key === 'totalChanges') continue
    target[key] = (target[key] || 0) + (source?.[key] || 0)
  }
  target.totalChanges = Object.entries(target)
    .filter(([key]) => key !== 'totalChanges')
    .reduce((sum, [, value]) => sum + (Number(value) || 0), 0)
  return target
}

export function formatNormalizationSummary(stats, fileCount = 1) {
  const parts = []
  if (stats.orderedLists) parts.push(`有序列表 ${stats.orderedLists} 处`)
  if (stats.unorderedLists) parts.push(`项目符号 ${stats.unorderedLists} 处`)
  if (stats.headings) parts.push(`标题 ${stats.headings} 处`)
  if (stats.quotes) parts.push(`引用 ${stats.quotes} 处`)
  if (stats.paragraphsMerged) parts.push(`合并换行 ${stats.paragraphsMerged} 处`)
  if (stats.whitespaceFixed) parts.push(`空白修正 ${stats.whitespaceFixed} 处`)
  const prefix = fileCount > 1 ? `已规范 ${fileCount} 个文件` : '已规范当前正文'
  return parts.length ? `${prefix}：${parts.join('、')}` : `${prefix}：内容已经是规范格式`
}

function chineseNumberToInteger(value) {
  const digit = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
  if (!value) return 1
  if (!/[十百]/.test(value)) return Number([...value].map(char => digit[char] ?? '').join('')) || 1
  let total = 0
  let current = 0
  for (const char of value) {
    if (char === '百') {
      total += (current || 1) * 100
      current = 0
    } else if (char === '十') {
      total += (current || 1) * 10
      current = 0
    } else {
      current = digit[char] ?? current
    }
  }
  return total + current || 1
}

function normalizeFullWidthDigits(value) {
  return String(value || '').replace(/[０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
}

function visibleLength(value) {
  return String(value || '').replace(/[*_`~\[\]()]/g, '').trim().length
}

function isChineseNumberMarker(value) {
  return /^\s*[一二两三四五六七八九十百]+\s*[、．。]/.test(value)
}

function isLikelyChineseHeading(lines, index, content) {
  if (visibleLength(content) > 34) return false
  const previousBlank = index === 0 || !String(lines[index - 1] || '').trim()
  if (!previousBlank) return false
  let nextIndex = index + 1
  while (nextIndex < lines.length && !String(lines[nextIndex] || '').trim()) nextIndex += 1
  if (nextIndex >= lines.length) return true
  const next = String(lines[nextIndex] || '')
  return !isChineseNumberMarker(next) && !/^\s*(?:\d+\s*[、．。.)）]|[（(]\d+[）)]|[①-⑩❶-❿])/.test(next)
}

function isProtectedBlockLine(trimmed) {
  if (!trimmed) return false
  if (/^\|.*\|$/.test(trimmed)) return true
  if (/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(trimmed)) return true
  if (/^<\/?[a-zA-Z][^>]*>/.test(trimmed)) return true
  if (/^\[[^\]]+\]:\s*\S+/.test(trimmed)) return true
  if (/^!\[[^\]]*\]\([\s\S]+\)$/.test(trimmed)) return true
  if (/^\$\$/.test(trimmed)) return true
  return false
}

function joinParagraphText(previous, next) {
  if (!previous) return next
  if (!next) return previous
  const needsSpace = /[A-Za-z0-9,.;:!?)]$/.test(previous) || /^[A-Za-z0-9([]/.test(next)
  return `${previous}${needsSpace ? ' ' : ''}${next}`
}

function normalizeListLine(line, lines, index, previousList, stats) {
  const expanded = normalizeFullWidthDigits(line)
  const leading = expanded.match(/^\s*/)?.[0].replace(/\t/g, '   ') || ''
  const source = expanded.slice(leading.length)
  let match

  match = source.match(/^(\d{1,3})\.\s+(.+)$/)
  if (match) return { text: `${leading}${Number(match[1])}. ${match[2].trim()}`, family: 'arabic', indent: leading.length, changed: false }

  match = source.match(/^(\d{1,3})\s*[、．。)）]\s*(.+)$/)
  if (match) {
    stats.orderedLists += 1
    return { text: `${leading}${Number(match[1])}. ${match[2].trim()}`, family: 'arabic', indent: leading.length, changed: true }
  }

  match = source.match(/^[（(]\s*(\d{1,3})\s*[）)]\s*(.+)$/)
  if (match) {
    const indent = previousList
      ? previousList.family === 'parenthesized' ? previousList.indent : previousList.indent + 3
      : leading.length
    stats.orderedLists += 1
    return { text: `${' '.repeat(indent)}${Number(match[1])}. ${match[2].trim()}`, family: 'parenthesized', indent, changed: true }
  }

  match = source.match(/^([①②③④⑤⑥⑦⑧⑨⑩❶❷❸❹❺❻❼❽❾❿])\s*(.+)$/)
  if (match) {
    const indent = previousList
      ? previousList.family === 'circled' ? previousList.indent : previousList.indent + 3
      : leading.length
    stats.orderedLists += 1
    return { text: `${' '.repeat(indent)}${CIRCLED_NUMBERS.get(match[1])}. ${match[2].trim()}`, family: 'circled', indent, changed: true }
  }

  match = source.match(/^([一二两三四五六七八九十百]+)\s*[、．。]\s*(.+)$/)
  if (match) {
    if (!leading && isLikelyChineseHeading(lines, index, match[2])) {
      stats.headings += 1
      return { text: `## ${match[1]}、${match[2].trim()}`, family: 'heading', indent: 0, changed: true, heading: true }
    }
    stats.orderedLists += 1
    return { text: `${leading}${chineseNumberToInteger(match[1])}. ${match[2].trim()}`, family: 'chinese', indent: leading.length, changed: true }
  }

  match = source.match(/^([-+*])\s+(.+)$/)
  if (match) return { text: `${leading}${match[1]} ${match[2].trim()}`, family: 'bullet', indent: leading.length, changed: false }

  match = source.match(/^([•●○▪▫◆◇►▶‣⁃·※★☆])\s*(.+)$/)
  if (match) {
    stats.unorderedLists += 1
    return { text: `${leading}- ${match[2].trim()}`, family: 'bullet', indent: leading.length, changed: true }
  }

  return null
}

function finalizeStats(stats) {
  stats.totalChanges = Object.entries(stats)
    .filter(([key]) => key !== 'totalChanges')
    .reduce((sum, [, value]) => sum + (Number(value) || 0), 0)
  return stats
}

export function normalizeMarkdown(input, options = {}) {
  const stats = createNormalizationStats()
  const warnings = []
  const original = String(input || '')
  const normalizedNewlines = original.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  if (normalizedNewlines !== original) stats.whitespaceFixed += 1
  const lines = normalizedNewlines.split('\n')
  const output = []
  let paragraph = ''
  let inFence = false
  let fenceMarker = ''
  let inFrontmatter = lines[0]?.trim() === '---'
  let previousList = null
  let lastType = 'start'

  const pushBlank = () => {
    if (output.length && output[output.length - 1] !== '') output.push('')
  }

  const flushParagraph = () => {
    if (!paragraph) return
    if (lastType === 'list') pushBlank()
    output.push(paragraph)
    paragraph = ''
    lastType = 'paragraph'
  }

  const pushBlockLine = (line, type = 'block') => {
    flushParagraph()
    if (lastType !== type && lastType !== 'start') pushBlank()
    output.push(line)
    lastType = type
    previousList = null
  }

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index]
    const withoutInvisible = raw.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').replace(/\u00A0/g, ' ')
    const trailingTrimmed = withoutInvisible.replace(/[ \t]+$/g, '')
    const hadHardBreak = / {2,}$/.test(withoutInvisible)
    const cleaned = hadHardBreak ? `${trailingTrimmed}  ` : trailingTrimmed
    if (cleaned !== raw && !inFence && !inFrontmatter) stats.whitespaceFixed += 1
    const trimmed = cleaned.trim()

    if (inFrontmatter) {
      output.push(cleaned)
      if (index > 0 && trimmed === '---') {
        inFrontmatter = false
        lastType = 'frontmatter'
        pushBlank()
      }
      continue
    }

    if (inFence) {
      output.push(raw)
      if (trimmed.startsWith(fenceMarker.repeat(3)) && !trimmed.slice(3).trim()) {
        inFence = false
        fenceMarker = ''
        lastType = 'code'
        pushBlank()
      }
      continue
    }

    const fence = trimmed.match(/^(`{3,}|~{3,})/)
    if (fence) {
      flushParagraph()
      if (lastType !== 'start') pushBlank()
      inFence = true
      fenceMarker = fence[1][0]
      output.push(cleaned)
      continue
    }

    if (!trimmed) {
      flushParagraph()
      pushBlank()
      previousList = null
      continue
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      pushBlockLine(trimmed, 'divider')
      pushBlank()
      continue
    }

    if (/^( {4}|\t)/.test(raw)) {
      pushBlockLine(raw, 'indented-code')
      continue
    }

    if (isProtectedBlockLine(trimmed)) {
      pushBlockLine(cleaned, /^\|/.test(trimmed) ? 'table' : 'protected')
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s*(.+)$/)
    if (heading) {
      const next = `${heading[1]} ${heading[2].trim()}`
      if (next !== trimmed) stats.whitespaceFixed += 1
      pushBlockLine(next, 'heading')
      pushBlank()
      continue
    }

    const chapterHeading = trimmed.match(/^(第[一二两三四五六七八九十百0-9]+[章节篇部分]|(?:Part|Chapter)\s+\d+)\s*[:：、.-]?\s*(.*)$/i)
    if (chapterHeading && visibleLength(trimmed) <= 38 && (index === 0 || !lines[index - 1]?.trim())) {
      pushBlockLine(`## ${chapterHeading[1]}${chapterHeading[2] ? ` ${chapterHeading[2].trim()}` : ''}`, 'heading')
      stats.headings += 1
      pushBlank()
      continue
    }

    const quote = trimmed.match(/^[＞>]\s*(.+)$/)
    if (quote) {
      const next = `> ${quote[1].trim()}`
      if (next !== trimmed) stats.quotes += 1
      pushBlockLine(next, 'quote')
      continue
    }

    const list = normalizeListLine(cleaned, lines, index, previousList, stats)
    if (list?.heading) {
      pushBlockLine(list.text, 'heading')
      pushBlank()
      continue
    }
    if (list) {
      flushParagraph()
      if (!['list', 'start'].includes(lastType)) pushBlank()
      output.push(list.text)
      lastType = 'list'
      previousList = list
      continue
    }

    const plain = trimmed.replace(/\t+/g, ' ')
    if (plain !== trimmed) stats.whitespaceFixed += 1
    if (lastType === 'list') flushParagraph()
    if (hadHardBreak) {
      flushParagraph()
      output.push(`${plain}  `)
      lastType = 'hardbreak'
      previousList = null
      continue
    }
    if (paragraph) {
      paragraph = joinParagraphText(paragraph, plain)
      stats.paragraphsMerged += 1
    } else {
      paragraph = plain
    }
    previousList = null
  }

  flushParagraph()
  while (output[0] === '') output.shift()
  while (output[output.length - 1] === '') output.pop()
  const markdown = output.join('\n').replace(/\n{3,}/g, '\n\n')
  finalizeStats(stats)

  if (inFence) warnings.push({ line: lines.length, message: '检测到未闭合的代码块，已保留原始内容' })
  if (options.ensureFinalNewline && markdown) return { markdown: `${markdown}\n`, changes: stats, warnings }
  return { markdown, changes: stats, warnings }
}

function createTurndownService() {
  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**'
  })
  service.use(gfm)
  service.remove(['script', 'style', 'noscript', 'meta', 'link'])
  service.addRule('preserveImages', {
    filter: 'img',
    replacement(_content, node) {
      const src = node.getAttribute('src') || ''
      if (!src) return ''
      const alt = (node.getAttribute('alt') || '图片').replace(/[\[\]]/g, '')
      const title = node.getAttribute('title')
      return `![${alt}](${src}${title ? ` "${title.replace(/"/g, '\\"')}"` : ''})`
    }
  })
  return service
}

export function htmlToMarkdown(html) {
  const source = String(html || '').trim()
  if (!source) return ''
  const service = createTurndownService()
  let safeHtml = source
  if (typeof DOMParser !== 'undefined') {
    const documentNode = new DOMParser().parseFromString(source, 'text/html')
    documentNode.querySelectorAll('script,style,noscript,meta,link').forEach(node => node.remove())
    safeHtml = documentNode.body.innerHTML
  }
  return normalizeMarkdown(service.turndown(safeHtml)).markdown
}
