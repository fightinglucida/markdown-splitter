import { cardMarkdownSections, renderCardTokens, waitForAssets } from './cardEngine.js'

// Keep lists, inline formatting and code fences intact until after Markdown parsing.
function notesSections(markdown) {
  return cardMarkdownSections(markdown).map(tokens => {
    const element = document.createElement('div')
    element.innerHTML = renderCardTokens(tokens)
    return Array.from(element.childNodes).filter(node =>
      node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.data.trim())
    )
  })
}

// Fit the rendered nodes in the same body used by the preview. If a block
// crosses a page boundary, reopen its formatting ancestors on the next page.
function fillNotesPages(card, sections) {
  const body = card.querySelector('.notes-body')
  const pages = []
  let wrappers = new Map()
  let hasContent = false

  function finishPage() {
    // A line that didn't fit may have opened an empty list item or paragraph.
    for (const wrapper of Array.from(wrappers.values()).reverse()) {
      if (!wrapper.firstElementChild && !wrapper.textContent.trim()) wrapper.remove()
    }
    if (hasContent) {
      pages.push(body.innerHTML)
      card.classList.add('is-continuation')
    }
    body.replaceChildren()
    wrappers = new Map()
    hasContent = false
  }

  function destination(ancestors) {
    let parent = body
    for (const source of ancestors) {
      if (!wrappers.has(source)) {
        const copy = source.cloneNode(false)
        parent.append(copy)
        wrappers.set(source, copy)
      }
      parent = wrappers.get(source)
    }
    return parent
  }

  function fits() {
    return body.scrollHeight <= body.clientHeight
  }

  function splitText(node, ancestors) {
    const chars = Array.from(node.data)
    let start = 0
    while (start < chars.length) {
      const text = document.createTextNode('')
      destination(ancestors).append(text)
      let low = start
      let high = chars.length
      while (low < high) {
        const mid = Math.ceil((low + high) / 2)
        text.data = chars.slice(start, mid).join('')
        if (fits()) low = mid
        else high = mid - 1
      }
      // Even a physically undersized body must make progress and report overflow.
      if (low === start && !hasContent) low++
      text.data = chars.slice(start, low).join('')
      hasContent ||= low > start
      start = low
      if (start < chars.length) finishPage()
    }
  }

  function place(node, ancestors) {
    destination(ancestors).append(node)
    if (!fits() && hasContent && (node.nodeName === 'LI' || node.nodeName === 'TR')) {
      node.remove()
      finishPage()
      destination(ancestors).append(node)
    }
    if (fits()) {
      hasContent ||= node.nodeType === Node.ELEMENT_NODE || !!node.textContent.trim()
      return
    }
    node.remove()
    if (node.nodeType === Node.TEXT_NODE) {
      splitText(node, ancestors)
    } else if (node.hasChildNodes()) {
      const children = Array.from(node.childNodes)
      if (node.tagName === 'OL') {
        // Explicit values survive reopening a list at a page boundary.
        let number = node.start
        for (const item of node.children) {
          if (item.tagName !== 'LI') continue
          if (item.hasAttribute('value')) number = item.value
          item.value = number++
        }
      }
      for (const child of children) place(child, [...ancestors, node])
    } else {
      if (hasContent) finishPage()
      destination(ancestors).append(node)
      hasContent = true
    }
  }

  for (const section of sections) {
    for (const block of section) place(block, [])
    finishPage()
  }
  return pages.length ? pages : ['']
}

export async function paginateNotes(markdown, measureCard) {
  const card = measureCard.cloneNode(true)
  document.body.append(card)
  try {
    const body = card.querySelector('.notes-body')
    const sections = notesSections(markdown)
    body.replaceChildren(...sections.flat())
    for (const img of body.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager'
    await waitForAssets(body)
    const wordCount = Array.from(body.textContent.replace(/\s/gu, '')).length
    card.querySelector('.notes-footer span:last-child').textContent = `字数:${wordCount}`
    body.replaceChildren()
    return { pages: fillNotesPages(card, sections), wordCount }
  } finally {
    card.remove()
  }
}
