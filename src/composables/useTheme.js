import { ref, computed } from 'vue'
import { builtInThemes } from '@/data/themes'

export function useTheme(config, canvasScale) {
  const themes = ref({ ...builtInThemes })

  // 加载外部 JSON 主题（HTTP 协议下）
  const loadExternalThemes = async () => {
    if (window.location.protocol === 'file:') return
    const themeKeys = Object.keys(themes.value)
    await Promise.all(
      themeKeys.map(async (key) => {
        try {
          const res = await fetch(`/themes/${key}.json`, { cache: 'no-cache' })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data?.config) themes.value[key] = data
        } catch (e) {
          console.warn(`主题 ${key} 加载失败，使用内置配置`, e)
        }
      })
    )
  }

  const currentThemeConfig = computed(() => {
    return themes.value[config.value.theme]?.config || themes.value['modern']?.config || {}
  })

  const applyTheme = (key) => {
    const theme = themes.value[key]
    if (!theme) return
    const tc = theme.config

    config.value.theme = key
    if (tc.canvas.ratio) config.value.ratio = tc.canvas.ratio
    config.value.background = tc.canvas.background
    config.value.padding = tc.canvas.padding
    config.value.borderRadius = tc.canvas.borderRadius
    config.value.bgType = tc.canvas.bgType
    if (tc.canvas.canvasScale) canvasScale.value = tc.canvas.canvasScale

    config.value.fontSize = tc.content.fontSize
    config.value.fontFamily = tc.content.fontFamily
    config.value.color = tc.content.color
    config.value.textAlign = tc.content.textAlign

    config.value.showAuthor = tc.author.show
    config.value.showTime = tc.time.show
    config.value.showPageNumber = tc.pageNumber.show
    config.value.showWatermark = tc.watermark.show

    config.value.timeFormat = tc.time.format
    config.value.pageNumberFormat = tc.pageNumber.format
    config.value.watermarkText = tc.watermark.text
    if (key === 'scholarly') {
      config.value._overrideFontSize = null
      config.value._overrideLineHeight = null
      delete config.value._overrideColor
    }
    if (tc.author.show && !config.value.authorAvatar && !config.value.socialIcon) {
      config.value.socialIcon = 'avatar-2'
    }

    // 封面图仅 modern / elegant 主题保留；副标题、封面标题样式仅 elegant 主题保留
    if (key !== 'modern' && key !== 'elegant') config.value.coverImage = ''
    if (key !== 'elegant') {
      config.value.subtitle = ''
      config.value.titleFontSize = ''
      config.value.titleColor = ''
      config.value.titleMarginTop = ''
      config.value.titleMarginBottom = ''
      config.value.subtitleFontSize = ''
      config.value.subtitleColor = ''
      config.value.subtitleMarginTop = ''
      config.value.sloganFontSize = ''
      config.value.sloganColor = ''
      config.value.sloganMarginTop = ''
      config.value.sloganMarginBottom = ''
      config.value.imgBorderWidth = ''
      config.value.imgBorderStyle = ''
      config.value.imgBorderColor = ''
      config.value.imgBorderRadius = ''
    } else {
      // 切换到每天学习主题时，若副标题为空则填入默认值
      if (!config.value.subtitle) config.value.subtitle = 'Deepseek | 提效 | 知识卡片'
    }
  }

  const outerBackground = computed(() => {
    const cc = currentThemeConfig.value.canvas || {}
    return cc.backgroundTarget === 'inner'
      ? (cc.outerBackground || config.value.background)
      : config.value.background
  })

  const innerBackground = computed(() => {
    const cc = currentThemeConfig.value.canvas || {}
    return cc.backgroundTarget === 'inner'
      ? config.value.background
      : (cc.innerBackground || 'transparent')
  })

  return { themes, currentThemeConfig, applyTheme, outerBackground, innerBackground, loadExternalThemes }
}
