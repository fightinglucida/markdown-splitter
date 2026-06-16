<template>
  <div class="flex h-screen overflow-hidden bg-slate-900 text-white">

    <!-- 左侧内容面板 -->
    <LeftPanel
      :config="config"
      :themeConfig="currentThemeConfig"
      :themes="themes"
      @update:config="onConfigUpdate"
      @apply-theme="applyTheme"
    />

    <!-- 中央卡片画布 -->
    <CardCanvas
      ref="cardCanvasRef"
      :config="config"
      :themeConfig="currentThemeConfig"
      :outerBackground="outerBackground"
      :innerBackground="innerBackground"
      :cardChunks="cardChunks"
      :canvasScale="canvasScale"
      :isExporting="isExporting"
      @download-single="downloadSingle(0)"
      @export-zip="exportAllAsZip()"
    />

    <!-- 右侧属性面板 -->
    <PropertiesPanel
      :config="config"
      :themeConfig="currentThemeConfig"
      :canvasScale="canvasScale"
      :exportPixelRatio="exportPixelRatio"
      @update:config="onConfigUpdate"
      @update:canvasScale="canvasScale = $event"
      @update:exportPixelRatio="exportPixelRatio = $event"
    />

  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import LeftPanel from './components/LeftPanel.vue'
import CardCanvas from './components/CardCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import { useTheme } from './composables/useTheme'
import { usePagination } from './composables/usePagination'
import { useExport } from './composables/useExport'

// ─── 全局配置 ───────────────────────────────────────────────
const config = ref({
  title: '探索流光卡片 Pro',
  markdownInput: `## 什么是流光卡片

流光卡片是一款专注于知识分享的**卡片生成工具**，让你的内容以最优雅的方式呈现。

## 核心特性

- **多种主题模板** — 6种精心设计的视觉风格
- **智能自动分页** — 内容超出自动切换到下一张
- **一键批量导出** — 支持高清 PNG 和 ZIP 打包
- **丰富排版控制** — 字体、字号、行高自由调整

## 使用技巧

在正文中使用 \`---\` 手动分页，让你对内容布局有完全的掌控。

> 知识的价值在于分享，美观的呈现让分享更有感染力。

支持完整的 **Markdown** 语法，包括表格、代码块等高级元素。`,
  coverImage: '',
  subtitle: '',
  titleFontSize: '',
  titleColor: '',
  titleMarginTop: '',
  titleMarginBottom: '',
  subtitleFontSize: '',
  subtitleColor: '',
  subtitleMarginTop: '',
  sloganFontSize: '',
  sloganColor: '',
  sloganMarginTop: '',
  sloganMarginBottom: '',
  imgBorderWidth: '',
  imgBorderStyle: '',
  imgBorderColor: '',
  imgBorderRadius: '',
  showAuthor: true,
  authorNickname: '林书lucida',
  authorUsername: '@fightingLucida',
  authorAvatar: '',
  socialIcon: 'avatar-2',
  showTime: false,
  timeFormat: 'YYYY-MM-DD',
  showPageNumber: true,
  pageNumberFormat: 'number',
  showWatermark: true,
  watermarkText: '林书知识库',
  ratio: '1:1',
  theme: 'modern',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: 32,
  borderRadius: 24,
  fontFamily: 'Inter',
  textAlign: 'left',
  _overrideFontSize: null,
  _overrideLineHeight: null
})

const canvasScale = ref(80)
const cardCanvasRef = ref(null)

// ─── 组合式 API ─────────────────────────────────────────────
const { themes, currentThemeConfig, applyTheme: applyThemeBase, outerBackground, innerBackground, loadExternalThemes } = useTheme(config, canvasScale)
const { cardChunks, paginate, setMounted } = usePagination(config, currentThemeConfig)
const { isExporting, exportPixelRatio, prewarmFonts, downloadSingle, exportAllAsZip } = useExport(cardChunks)

// 主题切换（同时更新 config.theme 和 config.background）
const applyTheme = (themeKey) => {
  applyThemeBase(themeKey)
}

// 配置更新 → 原地 merge，保持响应式代理引用不变
const onConfigUpdate = (newConfig) => {
  Object.assign(config.value, newConfig)
}

// ─── 监听触发分页 ───────────────────────────────────────────
watch(
  [
    () => config.value.markdownInput,
    () => config.value.ratio,
    () => config.value.theme,
    () => config.value.padding,
    () => config.value.title,
    () => config.value.fontFamily,
    () => config.value.textAlign,
    () => config.value.showAuthor,
    () => config.value.showTime,
    () => config.value.showPageNumber,
    () => config.value.authorNickname,
    () => config.value.authorUsername,
    () => config.value.socialIcon,
    () => config.value.authorAvatar,
    () => config.value._overrideFontSize,
    () => config.value._overrideLineHeight
  ],
  () => { nextTick(() => paginate()) },
  { flush: 'post' }
)

// ─── 挂载初始化 ─────────────────────────────────────────────
onMounted(async () => {
  await loadExternalThemes()
  // 应用初始主题，将比例/padding 等同步到 config
  applyTheme(config.value.theme)
  await nextTick()
  setMounted()
  paginate()
  prewarmFonts()
})
</script>
