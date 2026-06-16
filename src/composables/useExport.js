import { ref } from 'vue'
import * as htmlToImage from 'html-to-image'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export function useExport(cardChunks) {
  const isExporting = ref(false)
  const exportPixelRatio = ref(1) // 1x / 1.5x / 2x
  const imageDataUrlCache = new Map()
  const imageDataUrlInflight = new Map()

  // Wait for page fonts only. Embedding all @font-face files is very slow here because local TTFs are large.
  const prewarmFonts = async () => {
    try {
      await document.fonts?.ready
    } catch (e) {
      console.warn('字体加载等待失败，继续导出', e)
    }
  }

  const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

  const withTimeout = (ms) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    return { signal: controller.signal, done: () => clearTimeout(timer) }
  }

  const srcToDataUrl = async (src) => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src
    if (imageDataUrlCache.has(src)) return imageDataUrlCache.get(src)
    if (imageDataUrlInflight.has(src)) return imageDataUrlInflight.get(src)

    const load = (async () => {
      const tryFetch = async (url, opts = {}, timeoutMs = 3000) => {
        const timeout = withTimeout(timeoutMs)
        try {
          const resp = await fetch(url, { cache: 'force-cache', signal: timeout.signal, ...opts })
          if (resp.ok) return await blobToDataUrl(await resp.blob())
        } catch {}
        finally {
          timeout.done()
        }
        return null
      }

      const direct = await tryFetch(src, { mode: 'cors' }, 2500)
      if (direct) return direct

      const sameOriginProxy = await tryFetch(`/img-proxy?url=${encodeURIComponent(src)}`, {}, 3500)
      if (sameOriginProxy) return sameOriginProxy

      const weserv = await tryFetch(`https://images.weserv.nl/?url=${encodeURIComponent(src)}`, {}, 2500)
      if (weserv) return weserv

      const corsproxy = await tryFetch(`https://corsproxy.io/?${encodeURIComponent(src)}`, {}, 2500)
      if (corsproxy) return corsproxy

      const allorigins = await tryFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`, {}, 2500)
      if (allorigins) return allorigins

      console.warn('[export] 无法内联图片，使用占位图：', src)
      return PLACEHOLDER
    })()

    imageDataUrlInflight.set(src, load)
    try {
      const dataUrl = await load
      imageDataUrlCache.set(src, dataUrl)
      return dataUrl
    } finally {
      imageDataUrlInflight.delete(src)
    }
  }

  const setImageSrcAndWait = (img, src) => new Promise(resolve => {
    const onDone = () => resolve()
    img.onload = onDone
    img.onerror = onDone
    img.src = src
    if (img.complete) resolve()
  })

  const inlineImages = async (node) => {
    const imgs = Array.from(node.querySelectorAll('img'))
    if (!imgs.length) return () => {}

    const origSrcs = imgs.map(img => img.getAttribute('src') || img.src)
    const uniqueSrcs = [...new Set(origSrcs)]
    const dataUrlEntries = await Promise.all(uniqueSrcs.map(async src => [src, await srcToDataUrl(src)]))
    const dataUrlBySrc = new Map(dataUrlEntries)

    await Promise.all(imgs.map((img, i) => setImageSrcAndWait(img, dataUrlBySrc.get(origSrcs[i]) || origSrcs[i])))
    await new Promise(requestAnimationFrame)

    return () => { imgs.forEach((img, i) => { img.src = origSrcs[i] }) }
  }

  const captureBlob = async (node) => {
    const origTransform = node.style.transform
    const origTransition = node.style.transition
    const restoreImages = await inlineImages(node)
    try {
      node.style.transition = 'none'
      node.style.transform = 'scale(1)'
      void node.offsetHeight
      await new Promise(requestAnimationFrame)
      return await htmlToImage.toBlob(node, {
        quality: 1,
        pixelRatio: exportPixelRatio.value,
        cacheBust: false,
        skipFonts: true
      })
    } finally {
      node.style.transform = origTransform
      node.style.transition = origTransition
      restoreImages()
    }
  }

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.download = filename
    a.href = url
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const downloadSingle = async (index) => {
    if (isExporting.value) return
    const node = document.getElementById(`card-${index}`)
    if (!node) return
    isExporting.value = true
    try {
      const blob = await captureBlob(node)
      if (blob) downloadBlob(blob, `card-${index + 1}.png`)
    } catch (e) {
      console.error('单张导出失败', e)
    } finally {
      isExporting.value = false
    }
  }

  const runWithConcurrency = async (items, limit, worker) => {
    const results = new Array(items.length)
    let cursor = 0
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const current = cursor++
        results[current] = await worker(items[current], current)
      }
    })
    await Promise.all(workers)
    return results
  }

  const exportAllAsZip = async () => {
    if (isExporting.value) return
    isExporting.value = true
    const zip = new JSZip()
    try {
      const items = cardChunks.value.map((_, i) => i)
      const results = await runWithConcurrency(items, 2, async (i) => {
        const node = document.getElementById(`card-${i}`)
        if (!node) return null
        const blob = await captureBlob(node)
        return blob ? { name: `card-${i + 1}.png`, blob } : null
      })

      results.filter(Boolean).forEach(({ name, blob }) => zip.file(name, blob))
      const content = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
      saveAs(content, 'markdown2card.zip')
    } catch (e) {
      console.error('批量导出失败', e)
    } finally {
      isExporting.value = false
    }
  }

  return { isExporting, exportPixelRatio, prewarmFonts, downloadSingle, exportAllAsZip }
}
