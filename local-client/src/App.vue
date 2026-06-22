<template>
  <div class="app-shell">
    <aside class="panel left-panel">
      <div class="brand-block">
        <div class="brand-mark">M2</div>
        <div>
          <h1 class="brand-title">Markdown2Card</h1>
          <p class="brand-subtitle">专业卡片生成工具</p>
        </div>
      </div>

      <div class="tabs">
        <button :class="['tab-btn', activeTab === 'content' ? 'active' : '']" @click="activeTab = 'content'">内容</button>
        <button :class="['tab-btn', activeTab === 'themes' ? 'active' : '']" @click="activeTab = 'themes'">模板</button>
      </div>

      <div v-if="activeTab === 'content'" class="left-scroll">
        <section class="control-section">
          <label class="label">文件</label>
          <div class="button-row">
            <button class="btn" @click="openFiles">选择文件</button>
            <button class="btn" @click="openFolder">选择文件夹</button>
          </div>
          <div class="status">已载入 {{ files.length }} 个 Markdown 文件</div>
          <div class="file-list compact" v-if="files.length">
            <button
              v-for="(file, index) in files"
              :key="file.path || file.name"
              :class="['file-item', index === activeIndex ? 'active' : '']"
              @click="selectFile(index)"
            >
              <span>{{ file.name }}</span>
              <span>{{ index + 1 }}</span>
            </button>
          </div>
        </section>

        <section class="control-section">
          <label class="label">标题 (必填)</label>
          <input v-model="config.title" class="field title-field" placeholder="输入文章标题..." />
        </section>

        <section v-if="config.template === 'elegant'" class="control-section">
          <label class="label">副标题</label>
          <input value="Deepseek | 提效 | 知识卡片" class="field" disabled />
        </section>

        <section v-if="config.template === 'modern' || config.template === 'elegant'" class="control-section">
          <label class="label">封面图片 (仅第一页)</label>
          <div class="cover-control">
            <button class="cover-box" @click="selectCover">
              <img v-if="config.coverImage" :src="config.coverImage" />
              <span v-else>点击上传<br>封面图</span>
            </button>
            <button class="btn ghost" v-if="config.coverImage" @click="config.coverImage = ''">移除封面</button>
            <span class="hint">建议比例 4:3</span>
          </div>
        </section>

        <section class="control-section markdown-section">
          <div class="section-head">
            <label class="label">正文内容</label>
            <span class="hint">支持 Markdown / --- 手动分页</span>
          </div>
          <textarea v-model="draftMarkdown" class="textarea" placeholder="在此输入 Markdown..."></textarea>
        </section>

        <section v-if="template.author?.show !== false" class="control-section">
          <div class="section-head">
            <label class="label">作者信息</label>
            <label class="switch"><input v-model="config.showAuthor" type="checkbox"><span></span></label>
          </div>
          <div v-if="config.showAuthor" class="author-editor">
            <button class="avatar-picker" @click="selectAvatar">
              <img :src="authorImage" />
            </button>
            <div class="author-fields">
              <input v-model="config.authorNickname" class="field" placeholder="用户昵称" />
              <input v-model="config.authorUsername" class="field" placeholder="用户名 @xxx" />
            </div>
          </div>
          <div v-if="config.showAuthor" class="social-grid">
            <button
              v-for="item in socialIcons"
              :key="item.icon"
              :class="['social-btn', config.socialIcon === item.icon ? 'active' : '']"
              :style="{ backgroundColor: item.color }"
              @click="selectSocialIcon(item.icon)"
              :title="item.name"
            >
              <img :src="item.imgUrl" />
            </button>
          </div>
        </section>

        <section class="control-section">
          <div class="section-head">
            <label class="label">时间标签</label>
            <label class="switch"><input v-model="config.showTime" type="checkbox"><span></span></label>
          </div>
        </section>

        <section class="control-section">
          <div class="section-head">
            <label class="label">页码标签</label>
            <label class="switch"><input v-model="config.showPageNumber" type="checkbox"><span></span></label>
          </div>
        </section>

        <section class="control-section">
          <div class="section-head">
            <label class="label">水印设置</label>
            <label class="switch"><input v-model="config.showWatermark" type="checkbox"><span></span></label>
          </div>
          <input v-if="config.showWatermark" v-model="config.watermark" class="field" placeholder="输入水印文字" />
        </section>
      </div>

      <div v-else class="theme-grid">
        <button
          v-for="(item, key) in templates"
          :key="key"
          :class="['theme-card', config.template === key ? 'active' : '']"
          @click="applyTemplate(key)"
        >
          <div class="theme-preview" :style="{ background: item.background }">
            <div class="preview-line title"></div>
            <div class="preview-body">
              <span></span><span></span><span></span>
            </div>
          </div>
          <span>{{ item.name }}</span>
        </button>
      </div>
    </aside>

    <main class="workspace">
      <header class="toolbar">
        <div>
          <div class="toolbar-title">{{ renderTitle }}</div>
          <div class="brand-subtitle">共 {{ pages.length }} 张卡片</div>
        </div>
        <div class="button-row">
          <button class="btn" @click="repaginate">重新分页</button>
          <button class="btn primary" :disabled="!canExport || exporting" @click="exportCurrent">
            导出当前文章
          </button>
          <button class="btn primary" :disabled="!files.length || !outputDir || exporting" @click="exportBatch">
            批量导出
          </button>
        </div>
      </header>

      <div class="canvas-scroll" @wheel.ctrl.prevent="handlePreviewWheel">
        <div class="cards-grid">
          <div
            v-for="(page, index) in pages"
            :key="`${activeIndex}-${index}-${config.template}-${config.ratio}`"
            class="card-frame"
            :style="frameStyle"
          >
            <div class="card-preview-scale" :style="previewCardStyle">
              <article
                :id="`render-card-${index}`"
                :class="['export-card', template.className, index > 0 ? 'is-continuation' : '']"
                :style="cardStyle"
              >
                <template v-if="config.template === 'modern'">
                  <div class="modern-knowledge">
                    <div v-if="index === 0" class="modern-knowledge__image">
                      <img v-if="config.coverImage" :src="config.coverImage" class="theme-cover-img" />
                      <div v-else class="modern-knowledge__placeholder">图片占位区域<br>建议尺寸: 480x350px<br>可替换为封面插图</div>
                    </div>
                    <div class="modern-knowledge__body">
                      <h1 v-if="index === 0" class="modern-knowledge__title">{{ renderTitle }}</h1>
                      <main class="modern-knowledge__desc markdown-body card-content" v-html="markdownToHtml(page)"></main>
                      <div class="modern-knowledge__footer" v-if="config.showWatermark && config.watermark">
                        <div class="modern-knowledge__divider"></div>
                        <p class="modern-knowledge__signature">-- {{ config.watermark }} --</p>
                      </div>
                    </div>
                  </div>
                </template>

                <template v-else-if="config.template === 'elegant'">
                  <div v-if="index === 0" class="dailylearn-cover">
                    <div v-if="config.showWatermark" class="dailylearn-cover__slogan">{{ config.watermark }}</div>
                    <div class="dailylearn-cover__image">
                      <img v-if="config.coverImage" :src="config.coverImage" class="dailylearn-cover__img" />
                      <div v-else class="dailylearn-cover__placeholder">在左侧上传封面插图</div>
                    </div>
                    <h1 class="dailylearn-cover__title">{{ renderTitle }}</h1>
                    <p class="dailylearn-cover__subtitle">Deepseek | 提效 | 知识卡片</p>
                  </div>
                  <div v-else class="elegant-content-page">
                    <main class="elegant-content markdown-body card-content" v-html="markdownToHtml(page)"></main>
                    <footer class="elegant-footer">
                      <span class="author-inline" v-if="config.showAuthor">
                        <span class="author-avatar small"><img :src="authorImage" /></span>
                        <span>{{ config.authorNickname }}</span>
                        <span>{{ config.authorUsername }}</span>
                      </span>
                      <span v-else-if="config.showWatermark">{{ config.watermark }}</span>
                      <span v-if="config.showPageNumber">{{ index + 1 }} / {{ pages.length }}</span>
                    </footer>
                  </div>
                </template>

                <template v-else-if="config.template === 'teaching'">
                  <div class="teaching-layer">
                    <header v-if="index === 0" class="teaching-titlebar">
                      <div class="teaching-avatar"><img :src="authorImage" /></div>
                      <h1>{{ renderTitle }}</h1>
                    </header>
                    <main class="teaching-content markdown-body card-content" v-html="markdownToHtml(page)"></main>
                    <footer class="teaching-footer">
                      <span v-if="config.showWatermark">{{ config.watermark }}</span>
                      <span v-if="config.showPageNumber">{{ index + 1 }} / {{ pages.length }}</span>
                    </footer>
                  </div>
                </template>

                <template v-else-if="config.template === 'scholarly'">
                  <div class="scholarly-post">
                    <header v-if="index === 0 && config.showAuthor" class="scholarly-author">
                      <div class="author-avatar scholarly-avatar"><img :src="authorImage" /></div>
                      <div class="scholarly-author-text">
                        <span class="scholarly-nickname">{{ config.authorNickname }}</span>
                        <span class="scholarly-username">{{ config.authorUsername }}</span>
                      </div>
                    </header>
                    <main class="scholarly-content markdown-body card-content" v-html="markdownToHtml(page)"></main>
                    <span class="scholarly-date" v-if="config.showTime">{{ currentTime }}</span>
                    <span class="scholarly-page" v-if="config.showPageNumber">{{ pageLabel(index) }}</span>
                  </div>
                </template>

                <template v-else>
                  <div class="generic-card">
                    <h1 v-if="index === 0" class="generic-title">{{ renderTitle }}</h1>
                    <main class="generic-content markdown-body card-content" v-html="markdownToHtml(page)"></main>
                    <footer class="generic-footer">
                      <div class="generic-author" v-if="config.showAuthor">
                        <span class="author-avatar small"><img :src="authorImage" /></span>
                        <span class="generic-author-text">
                          <strong>{{ config.authorNickname }}</strong>
                          <em>{{ config.authorUsername }}<template v-if="config.showTime"> · {{ currentTime }}</template></em>
                        </span>
                      </div>
                      <span v-else-if="config.showTime" class="generic-time">{{ currentTime }}</span>
                      <div class="generic-mark">
                        <span v-if="config.showWatermark">{{ config.watermark }}</span>
                        <span v-if="config.showPageNumber">{{ pageLabel(index) }}</span>
                      </div>
                    </footer>
                  </div>
                </template>
              </article>
            </div>
          </div>
        </div>
      </div>
    </main>

    <aside class="panel right-panel">
      <div class="properties-title">属性设置</div>
      <div class="properties-scroll">
        <section class="control-section preset-section">
          <label class="label">预设管理</label>
          <div class="preset-save-row">
            <input v-model="presetName" class="field" placeholder="预设名称" />
            <button class="btn primary" @click="savePreset">保存</button>
          </div>
          <div class="preset-list" v-if="savedPresets.length">
            <div v-for="preset in savedPresets" :key="preset.id" class="preset-item">
              <button class="preset-load" @click="loadPreset(preset)">{{ preset.name }}</button>
              <button class="preset-delete" @click="deletePreset(preset.id)">删除</button>
            </div>
          </div>
          <div v-else class="status">暂无预设</div>
        </section>

        <section class="control-section">
          <label class="label">画布比例</label>
          <div class="ratio-grid">
            <button
              v-for="(item, key) in ratios"
              :key="key"
              :class="['ratio-btn', config.ratio === key ? 'active' : '']"
              @click="config.ratio = key"
            >
              <span class="ratio-shape" :style="ratioShapeStyle(key)"></span>
              <em>{{ item.label }}</em>
            </button>
          </div>
        </section>

        <section class="control-section">
          <label class="label">背景配色</label>
          <div class="bg-grid">
            <button
              v-for="bg in backgrounds"
              :key="bg"
              :class="['bg-swatch', config.background === bg ? 'active' : '']"
              :style="{ background: bg }"
              @click="config.background = bg"
            ></button>
          </div>
        </section>

        <section class="control-section setting-grid">
          <label class="label">容器设置</label>
          <div class="range-row"><div class="range-line"><span>外层边距</span><span>{{ config.padding }}px</span></div><input v-model.number="config.padding" type="range" min="0" max="72" class="range-input" /></div>
          <div class="range-row"><div class="range-line"><span>缩放比例</span><span>{{ config.previewScale }}%</span></div><input v-model.number="config.previewScale" type="range" min="25" max="120" class="range-input" /></div>
        </section>

        <section class="control-section setting-grid">
          <label class="label">排版设置</label>
          <div class="range-row"><div class="range-line"><span>内容字号</span><span>{{ config.contentFontSize }}px</span></div><input v-model.number="config.contentFontSize" type="range" min="12" max="34" class="range-input" /></div>
          <div class="range-row"><div class="range-line"><span>行高</span><span>{{ config.lineHeight }}</span></div><input v-model.number="config.lineHeight" type="range" min="1.2" max="2.2" step="0.05" class="range-input" /></div>
          <label class="label">字体颜色</label>
          <input v-model="config.textColor" type="color" class="color-input" />
        </section>

        <section class="control-section">
          <label class="label">导出画质</label>
          <div class="quality-row">
            <button :class="['quality-btn', config.exportScale === 1 ? 'active' : '']" @click="config.exportScale = 1">1x (快)</button>
            <button :class="['quality-btn', config.exportScale === 1.5 ? 'active' : '']" @click="config.exportScale = 1.5">1.5x (均衡)</button>
            <button :class="['quality-btn', config.exportScale === 2 ? 'active' : '']" @click="config.exportScale = 2">2x (精细)</button>
          </div>
        </section>

        <section class="control-section">
          <label class="label">输出文件夹</label>
          <button class="btn" @click="selectOutput">选择输出位置</button>
          <div class="status">{{ outputDir || '尚未选择' }}</div>
          <div class="status">{{ statusText }}</div>
        </section>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import * as htmlToImage from 'html-to-image'
import {
  extractTitle,
  markdownToHtml,
  paginateMarkdown,
  ratios,
  templates,
  waitForAssets
} from './cardEngine'
import { getSocial, socialIcons } from './socialIcons'

const demoMarkdown = `# 本地批量生成卡片

这个客户端会读取本地 Markdown 文件，并按照右侧设置的模板自动分页。

## 核心能力

- 支持多文件批量处理
- 支持 1:1、3:4、4:3、9:16、16:9
- 支持水印、页码、背景和字号
- 导出为多张 PNG 图片

---

## 手动分页

单独一行 \`---\` 会作为手动分页符。

> 第一版先跑通本地生成链路，后续可以继续增加模板包、ZIP 打包和本地 API。`

const api = window.localCardApi

const files = ref([
  { name: '示例.md', path: '', content: demoMarkdown }
])
const activeIndex = ref(0)
const outputDir = ref('')
const pages = ref([])
const exporting = ref(false)
const statusText = ref('准备就绪')
const draftMarkdown = ref(demoMarkdown)
const activeTab = ref('content')
const presetName = ref('')
const savedPresets = ref(loadSavedPresets())
const backgrounds = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(to top, #5f72bd 0%, #9b23ea 100%)',
  'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
  '#0f172a',
  '#1e293b',
  '#000000',
  '#ffffff',
  '#f8fafc',
  '#e2e8f0',
  '#f5f5f5',
  '#fbfbf7'
]

const config = reactive({
  template: 'modern',
  ratio: '3:4',
  title: '',
  watermark: '林书知识库',
  showWatermark: true,
  coverImage: '',
  authorNickname: '林书lucida',
  authorUsername: '@fightingLucida',
  authorAvatar: '',
  socialIcon: 'avatar-2',
  showAuthor: true,
  showTime: false,
  timeFormat: 'YYYY-MM-DD',
  background: templates.modern.background,
  textColor: templates.modern.textColor,
  previewScale: 54,
  exportScale: 2,
  padding: templates.modern.padding,
  contentFontSize: templates.modern.contentFontSize,
  lineHeight: templates.modern.lineHeight,
  showPageNumber: true
})

const activeFile = computed(() => files.value[activeIndex.value] || files.value[0])
const template = computed(() => templates[config.template] || templates.modern)
const ratio = computed(() => ratios[config.ratio] || ratios['3:4'])
const renderTitle = computed(() => config.title.trim() || extractTitle(draftMarkdown.value, activeFile.value?.name || '未命名文章'))
const canExport = computed(() => pages.value.length > 0 && outputDir.value)
const selectedSocial = computed(() => getSocial(config.socialIcon))
const authorImage = computed(() => config.authorAvatar || selectedSocial.value.imgUrl)
const currentTime = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return config.timeFormat === 'MM/DD' ? `${m}月${d}日` : `${y}-${m}-${d}`
})
const pageLabel = (index) => {
  if (template.value.pageNumber?.format === 'single') return `${index + 1}`
  return `${index + 1} / ${pages.value.length}`
}

const frameStyle = computed(() => ({
  width: `${Math.round(ratio.value.width * config.previewScale / 100)}px`,
  height: `${Math.round(ratio.value.height * config.previewScale / 100)}px`
}))

const previewCardStyle = computed(() => ({
  transform: `scale(${config.previewScale / 100})`,
  transformOrigin: 'top left'
}))

const cardStyle = computed(() => ({
  width: `${ratio.value.width}px`,
  height: `${ratio.value.height}px`,
  '--card-padding': `${config.padding}px`,
  '--content-size': `${config.contentFontSize}px`,
  '--line-height': String(config.lineHeight),
  '--outer-bg': config.background,
  '--card-bg': template.value.cardBackground,
  '--text-color': config.textColor,
  '--accent-color': template.value.accentColor,
  '--title-color': template.value.titleColor || config.textColor,
  '--author-name-color': template.value.author?.nicknameColor || config.textColor,
  '--author-user-color': template.value.author?.usernameColor || template.value.accentColor
}))

watch(activeIndex, () => {
  draftMarkdown.value = activeFile.value?.content || ''
  config.title = ''
})

watch(draftMarkdown, (value) => {
  saveDraftToActiveFile(value)
})

watch(
  [
    draftMarkdown,
    () => config.template,
    () => config.ratio,
    () => config.title,
    () => config.watermark,
    () => config.showWatermark,
    () => config.coverImage,
    () => config.showAuthor,
    () => config.authorNickname,
    () => config.authorUsername,
    () => config.authorAvatar,
    () => config.socialIcon,
    () => config.showTime,
    () => config.background,
    () => config.textColor,
    () => config.padding,
    () => config.contentFontSize,
    () => config.lineHeight,
    () => config.showPageNumber
  ],
  () => repaginate(),
  { immediate: true }
)

async function repaginate() {
  await nextTick()
  const title = renderTitle.value
  pages.value = paginateMarkdown(draftMarkdown.value, {
    ...config,
    title
  })
  await nextTick()
}

function handlePreviewWheel(event) {
  const next = config.previewScale + (event.deltaY < 0 ? 5 : -5)
  config.previewScale = Math.min(120, Math.max(25, next))
}

function saveDraftToActiveFile(value = draftMarkdown.value) {
  const file = files.value[activeIndex.value]
  if (file) file.content = value
}

function selectFile(index) {
  if (index === activeIndex.value) return
  saveDraftToActiveFile()
  activeIndex.value = index
}

function applyTemplate(key) {
  config.template = key
  applyTemplateDefaults(key)
}

function applyTemplateDefaults(key) {
  const next = templates[key] || templates.modern
  config.ratio = next.defaultRatio
  config.background = next.background
  config.textColor = next.textColor
  config.padding = next.padding
  config.contentFontSize = next.contentFontSize
  config.lineHeight = next.lineHeight
  config.showAuthor = next.author?.show !== false
  config.showWatermark = next.watermark?.show !== false
  config.watermark = next.watermark?.text ?? config.watermark
  config.showPageNumber = next.pageNumber?.show !== false
  config.showTime = !!next.time?.show
  config.timeFormat = next.time?.format || 'YYYY-MM-DD'
}

function snapshotConfig() {
  return {
    template: config.template,
    ratio: config.ratio,
    title: config.title,
    watermark: config.watermark,
    showWatermark: config.showWatermark,
    coverImage: config.coverImage,
    authorNickname: config.authorNickname,
    authorUsername: config.authorUsername,
    authorAvatar: config.authorAvatar,
    socialIcon: config.socialIcon,
    showAuthor: config.showAuthor,
    showTime: config.showTime,
    timeFormat: config.timeFormat,
    background: config.background,
    textColor: config.textColor,
    previewScale: config.previewScale,
    exportScale: config.exportScale,
    padding: config.padding,
    contentFontSize: config.contentFontSize,
    lineHeight: config.lineHeight,
    showPageNumber: config.showPageNumber
  }
}

function applyConfigSnapshot(value) {
  if (!value || typeof value !== 'object') return
  Object.assign(config, {
    ...snapshotConfig(),
    ...value
  })
}

function loadSavedPresets() {
  try {
    const raw = localStorage.getItem('markdown-card-presets')
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function persistPresets() {
  localStorage.setItem('markdown-card-presets', JSON.stringify(savedPresets.value))
}

function savePreset() {
  const fallbackName = `${template.value.name}预设`
  const name = (presetName.value || fallbackName).trim()
  const now = Date.now()
  const preset = {
    id: String(now),
    name,
    createdAt: now,
    config: snapshotConfig()
  }
  savedPresets.value = [
    preset,
    ...savedPresets.value.filter(item => item.name !== name)
  ].slice(0, 20)
  try {
    persistPresets()
    presetName.value = ''
    statusText.value = `已保存预设：${name}`
  } catch {
    savedPresets.value = savedPresets.value.filter(item => item.id !== preset.id)
    statusText.value = '预设保存失败：封面或头像文件过大'
  }
}

function loadPreset(preset) {
  applyConfigSnapshot(preset.config)
  statusText.value = `已加载预设：${preset.name}`
}

function deletePreset(id) {
  savedPresets.value = savedPresets.value.filter(item => item.id !== id)
  try {
    persistPresets()
    statusText.value = '已删除预设'
  } catch {
    statusText.value = '预设删除失败'
  }
}

function ratioShapeStyle(key) {
  const item = ratios[key]
  const wide = item.width > item.height
  return {
    aspectRatio: `${item.width} / ${item.height}`,
    width: wide ? '24px' : '18px',
    maxHeight: '30px'
  }
}

async function openFiles() {
  if (!api) return
  const selected = await api.openMarkdownFiles()
  if (!selected.length) return
  files.value = selected
  activeIndex.value = 0
  draftMarkdown.value = selected[0].content
  config.title = ''
}

async function openFolder() {
  if (!api) return
  const selected = await api.openMarkdownFolder()
  if (!selected.length) {
    statusText.value = '这个文件夹里没有找到 Markdown 文件'
    return
  }
  files.value = selected
  activeIndex.value = 0
  draftMarkdown.value = selected[0].content
  config.title = ''
}

async function selectOutput() {
  if (!api) return
  const dir = await api.selectOutputFolder()
  if (dir) outputDir.value = dir
}

async function selectCover() {
  if (!api) return
  const image = await api.openImage()
  if (image) config.coverImage = image
}

async function selectAvatar() {
  if (!api) return
  const image = await api.openImage()
  if (image) config.authorAvatar = image
}

function selectSocialIcon(icon) {
  config.socialIcon = icon
  config.authorAvatar = ''
}

async function captureImages() {
  await nextTick()
  await waitForAssets(document)

  const images = []
  for (let i = 0; i < pages.value.length; i += 1) {
    const node = document.getElementById(`render-card-${i}`)
    if (!node) continue
    await new Promise(resolve => requestAnimationFrame(resolve))
    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: config.exportScale,
      cacheBust: true,
      width: ratio.value.width,
      height: ratio.value.height,
      style: {
        transform: 'none',
        transformOrigin: 'top left'
      }
    })
    images.push({ dataUrl })
  }
  if (!images.length) {
    throw new Error('没有找到可导出的卡片节点')
  }
  return images
}

async function exportCurrent() {
  if (!api || !outputDir.value) return
  exporting.value = true
  statusText.value = '正在导出当前文章...'
  try {
    saveDraftToActiveFile()
    await repaginate()
    const images = await captureImages()
    const result = await api.saveImages({
      outputDir: outputDir.value,
      articleName: renderTitle.value,
      images,
      mode: 'flat'
    })
    statusText.value = `已导出 ${result.files.length} 张图片到 ${result.dir}`
  } catch (error) {
    statusText.value = `导出失败：${error.message || error}`
  } finally {
    exporting.value = false
  }
}

async function exportBatch() {
  if (!api || !outputDir.value || !files.value.length) return
  exporting.value = true
  saveDraftToActiveFile()
  const originalIndex = activeIndex.value
  try {
    for (let i = 0; i < files.value.length; i += 1) {
      activeIndex.value = i
      draftMarkdown.value = files.value[i].content
      config.title = ''
      statusText.value = `正在处理 ${i + 1} / ${files.value.length}：${files.value[i].name}`
      await repaginate()
      const title = renderTitle.value
      const images = await captureImages()
      await api.saveImages({
        outputDir: outputDir.value,
        articleName: title,
        images,
        mode: 'folder'
      })
    }
    statusText.value = `批量导出完成，共处理 ${files.value.length} 个文件`
  } catch (error) {
    statusText.value = `批量导出失败：${error.message || error}`
  } finally {
    activeIndex.value = originalIndex
    draftMarkdown.value = files.value[originalIndex]?.content || ''
    exporting.value = false
  }
}
</script>
