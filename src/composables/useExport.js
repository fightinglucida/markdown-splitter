import { ref } from 'vue'
import * as htmlToImage from 'html-to-image'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export function useExport(cardChunks) {
  const isExporting = ref(false)
  const exportPixelRatio = ref(1.5) // 1x / 1.5x / 2x
  let cachedFontEmbedCSS = null

  // 启动时预热字体 CSS，后续所有导出复用
  const prewarmFonts = async () => {
    const node = document.querySelector('.card-fixed-container')
    if (!node || typeof htmlToImage.getFontEmbedCSS !== 'function') return
    try {
      cachedFontEmbedCSS = await htmlToImage.getFontEmbedCSS(node)
    } catch (e) {
      console.warn('字体预热失败，将逐次 inline', e)
    }
  }

  // 1×1 透明占位图，当图片无法内联时用于替换，防止 html-to-image 再次 fetch 跨域 URL
  const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

  // 将图片 URL 转为 base64 data URL
  // 优先级：直接 fetch → 同源 Pages Function 代理 → weserv.nl → corsproxy.io → 占位图
  const srcToDataUrl = async (src) => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src

    const tryFetch = async (url, opts = {}) => {
      try {
        const resp = await fetch(url, { cache: 'force-cache', ...opts })
        if (resp.ok) return await blobToDataUrl(await resp.blob())
      } catch {}
      return null
    }

    // 1. 直接 fetch（同源 / 支持 CORS 的图片）
    const direct = await tryFetch(src, { mode: 'cors' })
    if (direct) return direct

    // 2. 同源代理（Cloudflare Pages Function，生产环境可靠）
    const sameOriginProxy = await tryFetch(`/img-proxy?url=${encodeURIComponent(src)}`)
    if (sameOriginProxy) return sameOriginProxy

    // 3. weserv.nl（专用图片 CDN 代理，稳定可靠）
    const weserv = await tryFetch(`https://images.weserv.nl/?url=${encodeURIComponent(src)}`)
    if (weserv) return weserv

    // 4. corsproxy.io
    const corsproxy = await tryFetch(`https://corsproxy.io/?${encodeURIComponent(src)}`)
    if (corsproxy) return corsproxy

    // 5. allorigins
    const allorigins = await tryFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`)
    if (allorigins) return allorigins

    // 所有方法失败：返回透明占位图，避免 html-to-image 触碰跨域 URL 导致崩溃
    console.warn('[export] 无法内联图片，使用占位图：', src)
    return PLACEHOLDER
  }

  // 把节点内所有 <img> 替换为 data URL，并等待图片真正加载完成，返回还原函数
  const inlineImages = async (node) => {
    const imgs = Array.from(node.querySelectorAll('img'))
    if (!imgs.length) return () => {}
    const origSrcs = imgs.map(img => img.getAttribute('src') || img.src)
    const dataUrls = await Promise.all(origSrcs.map(src => srcToDataUrl(src)))

    // 设置新 src 并等待每张图片加载完成（decode 比 requestAnimationFrame 更可靠）
    await Promise.all(imgs.map((img, i) => new Promise(resolve => {
      const onDone = () => resolve()
      img.onload = onDone
      img.onerror = onDone
      img.src = dataUrls[i]
      // 如果是 data URL 且已完成，浏览器不会触发 load 事件
      if (img.complete) resolve()
    })))

    // 等待浏览器完成渲染
    await new Promise(requestAnimationFrame)
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
        ...(cachedFontEmbedCSS ? { fontEmbedCSS: cachedFontEmbedCSS } : {})
      })
    } finally {
      node.style.transform = origTransform
      node.style.transition = origTransition
      restoreImages()
    }
  }

  const downloadSingle = async (index) => {
    const node = document.getElementById(`card-${index}`)
    if (!node) return
    try {
      const blob = await captureBlob(node)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.download = `card-${index + 1}.png`
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('单张导出失败', e)
    }
  }

  const exportAllAsZip = async () => {
    isExporting.value = true
    const zip = new JSZip()
    try {
      // 并行捕获所有卡片
      const results = await Promise.all(
        cardChunks.value.map(async (_, i) => {
          const node = document.getElementById(`card-${i}`)
          if (!node) return null
          const blob = await captureBlob(node)
          return blob ? { name: `card-${i + 1}.png`, blob } : null
        })
      )
      results.filter(Boolean).forEach(({ name, blob }) => zip.file(name, blob))
      // PNG 已压缩，STORE 模式跳过二次压缩，更快
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
