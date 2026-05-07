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

  const captureBlob = async (node) => {
    const origTransform = node.style.transform
    const origTransition = node.style.transition
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
