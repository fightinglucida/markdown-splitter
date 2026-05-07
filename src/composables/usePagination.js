import { ref, nextTick } from 'vue'
import { marked } from 'marked'

export function usePagination(config, currentThemeConfig) {
  const cardChunks = ref([''])
  let paginationToken = 0
  let appMounted = false
  let measurementCard = null

  const setMounted = () => { appMounted = true }

  const renderMarkdown = (text) => marked.parse(text || '')

  const teardown = () => {
    if (measurementCard?.parentNode) measurementCard.parentNode.removeChild(measurementCard)
    measurementCard = null
  }

  const buildTester = (selector, mutateCard) => {
    const sourceCard = document.querySelector('.card-fixed-container')
    if (!sourceCard) return null
    teardown()
    measurementCard = sourceCard.cloneNode(true)
    Object.assign(measurementCard.style, {
      position: 'absolute', visibility: 'hidden', pointerEvents: 'none',
      left: '-99999px', top: '0', transform: 'none', margin: '0', zIndex: '-1'
    })
    measurementCard.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'))
    document.body.appendChild(measurementCard)
    if (typeof mutateCard === 'function') mutateCard(measurementCard)
    return measurementCard.querySelector(selector)
  }

  const prepareMetrics = (selector, mutateCard) => {
    const live = document.querySelector(`.card-fixed-container ${selector}`)
    if (!live) return null
    const tester = buildTester(selector, mutateCard)
    if (!tester) return null
    tester.innerHTML = '&nbsp;'
    tester.style.width = `${live.clientWidth}px`
    return { tester, pageHeight: tester.clientHeight }
  }

  const splitByManual = (text) => {
    const sections = []; let cur = []
    text.split('\n').forEach(line => {
      if (line.trim() === '---') { sections.push(cur.join('\n')); cur = [] }
      else cur.push(line)
    })
    sections.push(cur.join('\n'))
    return sections.length ? sections : ['']
  }

  // 注意：limit 直接用于高度对比，不设置 tester.style.height（避免干扰 flex 布局）
  const makeFits = (tester, limit) => (text) => {
    tester.innerHTML = renderMarkdown(text?.trim() ? text : '&nbsp;')
    return tester.scrollHeight <= limit
  }

  const splitSection = (section, tester, limit) => {
    const fits = makeFits(tester, limit)
    const lines = section.split('\n')
    const chunks = []; let start = 0
    while (start < lines.length) {
      let lo = 1, hi = lines.length - start, best = 0
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2)
        if (fits(lines.slice(start, start + mid).join('\n'))) { best = mid; lo = mid + 1 }
        else hi = mid - 1
      }
      if (best === 0) best = 1
      chunks.push(lines.slice(start, start + best).join('\n'))
      start += best
    }
    return chunks.length ? chunks : ['']
  }

  const takeFirst = (section, tester, limit) => {
    const fits = makeFits(tester, limit)
    const lines = section.split('\n')
    let lo = 1, hi = lines.length, best = 0
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (fits(lines.slice(0, mid).join('\n'))) { best = mid; lo = mid + 1 }
      else hi = mid - 1
    }
    if (best === 0) best = 1
    return { first: lines.slice(0, best).join('\n'), rest: lines.slice(best).join('\n') }
  }

  const paginateModern = async (raw, token) => {
    await nextTick()
    if (token !== paginationToken) return
    const m1 = prepareMetrics('.modern-knowledge__desc', null)
    if (!m1) { cardChunks.value = [raw]; teardown(); return }
    const sections = splitByManual(raw)
    const result = []
    let firstIdx = sections.findIndex(s => s?.trim())
    if (firstIdx === -1) { result.push(''); teardown(); cardChunks.value = result; return }
    for (let i = 0; i < firstIdx; i++) result.push('')
    const { first, rest } = takeFirst(sections[firstIdx], m1.tester, m1.pageHeight)
    result.push(first)
    teardown()
    const remaining = []
    if (rest?.trim()) remaining.push(rest)
    if (firstIdx + 1 < sections.length) remaining.push(...sections.slice(firstIdx + 1))
    const m2 = prepareMetrics('.modern-knowledge__desc', card => {
      const title = card.querySelector('.modern-knowledge__title')
      if (title) title.style.display = 'none'
      const img = card.querySelector('.modern-knowledge__image')
      if (img) img.style.display = 'none'
      const desc = card.querySelector('.modern-knowledge__desc')
      if (desc) { desc.style.height = 'auto'; desc.style.flex = '1 1 auto' }
    })
    if (!m2) { if (token !== paginationToken) return; cardChunks.value = result.length ? result : ['']; return }
    try {
      remaining.forEach(sec => {
        if (!sec.trim()) { result.push(''); return }
        result.push(...splitSection(sec, m2.tester, m2.pageHeight))
      })
    } finally { teardown() }
    if (token !== paginationToken) return
    cardChunks.value = result.length ? result : ['']
  }

  const paginate = async () => {
    if (!appMounted) return
    const token = ++paginationToken
    const raw = config.value.markdownInput || ''
    if (!raw.trim()) { cardChunks.value = ['']; teardown(); return }
    if (config.value.theme === 'modern') { await paginateModern(raw, token); return }
    await nextTick()
    if (token !== paginationToken) return
    const m = prepareMetrics('.markdown-body', null)
    if (!m) { cardChunks.value = [raw]; teardown(); return }
    const sections = splitByManual(raw)
    const result = []
    try {
      sections.forEach(sec => {
        if (!sec.trim()) { result.push(''); return }
        result.push(...splitSection(sec, m.tester, m.pageHeight))
      })
    } finally { teardown() }
    if (token !== paginationToken) return
    cardChunks.value = result.length ? result : ['']
  }

  return { cardChunks, paginate, setMounted, renderMarkdown }
}
