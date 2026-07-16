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
            <div
              v-for="(file, index) in files"
              :key="file.path || file.name"
              :class="['file-item', index === activeIndex ? 'active' : '']"
            >
              <button class="file-select" @click="selectFile(index)">
                <span>{{ file.name }}</span>
                <span>{{ index + 1 }}</span>
              </button>
              <button class="file-remove" title="删除" @click="removeFile(index)">删除</button>
            </div>
          </div>
        </section>

        <section class="control-section">
          <label class="label">{{ titleInputLabel }}</label>
          <input v-model="config.title" class="field title-field" :placeholder="titleInputPlaceholder" />
        </section>

        <section v-if="capabilities.subtitle" class="control-section">
          <label class="label">{{ capabilities.subtitle.label }}</label>
          <input value="Deepseek | 提效 | 知识卡片" class="field" disabled />
        </section>

        <section v-if="capabilities.coverImage" class="control-section">
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
          <div class="section-head markdown-section-head">
            <label class="label">正文内容</label>
            <div class="markdown-normalize-actions">
              <button
                class="normalize-action primary"
                :disabled="exporting || !draftMarkdown.trim()"
                title="规范当前正文中的列表、标题、段落和空白"
                @click="normalizeCurrentMarkdown"
              >一键规范</button>
              <button
                v-if="files.length > 1"
                class="normalize-action"
                :disabled="exporting"
                title="规范当前已导入的全部 Markdown 文件"
                @click="normalizeAllMarkdownFiles"
              >全部文件</button>
              <button
                v-if="normalizationBackup"
                class="normalize-action undo"
                :disabled="exporting"
                title="撤销最近一次规范化操作"
                @click="undoMarkdownNormalization"
              >撤销</button>
            </div>
          </div>
          <div class="hint markdown-format-hint">支持 Markdown / --- 手动分页 · 富文本粘贴会自动转换</div>
          <textarea
            ref="markdownInput"
            v-model="draftMarkdown"
            class="textarea"
            placeholder="在此输入 Markdown..."
            @paste="handleMarkdownPaste"
          ></textarea>
        </section>

        <section v-if="authorCapabilities.enabled" class="control-section">
          <div class="section-head">
            <label class="label">{{ authorCapabilities.label || '作者信息' }}</label>
            <label v-if="authorCapabilities.toggle !== false" class="switch"><input v-model="config.showAuthor" type="checkbox"><span></span></label>
          </div>
          <div v-if="authorEditorVisible" class="author-editor">
            <button v-if="authorCapabilities.avatar" class="avatar-picker" @click="selectAvatar">
              <img :src="authorImage" />
            </button>
            <div v-if="authorCapabilities.nickname || authorCapabilities.username" class="author-fields">
              <input v-if="authorCapabilities.nickname" v-model="config.authorNickname" class="field" placeholder="用户昵称" />
              <input v-if="authorCapabilities.username" v-model="config.authorUsername" class="field" placeholder="用户名 @xxx" />
            </div>
          </div>
          <div v-if="authorEditorVisible && authorCapabilities.social" class="social-grid">
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

        <section v-if="capabilities.time" class="control-section">
          <div class="section-head">
            <label class="label">时间标签</label>
            <label class="switch"><input v-model="config.showTime" type="checkbox"><span></span></label>
          </div>
        </section>

        <section v-if="capabilities.pageNumber" class="control-section">
          <div class="section-head">
            <label class="label">页码标签</label>
            <label class="switch"><input v-model="config.showPageNumber" type="checkbox"><span></span></label>
          </div>
        </section>

        <section v-if="capabilities.watermark?.enabled" class="control-section">
          <div class="section-head">
            <label class="label">{{ capabilities.watermark.label || '水印设置' }}</label>
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
          <div
            :class="[
              'theme-preview',
              key === 'layeredNote' ? 'layered-note-theme-preview' : '',
              key === 'stackedPaper' ? 'stacked-paper-theme-preview' : ''
            ]"
            :style="{ background: item.background }"
          >
            <template v-if="key === 'layeredNote'">
              <div class="layered-note-preview-sheet back"></div>
              <div class="layered-note-preview-sheet middle"></div>
              <div class="layered-note-preview-sheet front">
                <span class="layered-note-preview-title"></span>
                <span class="layered-note-preview-avatar"></span>
                <span class="layered-note-preview-copy"></span>
              </div>
            </template>
            <template v-else-if="key === 'stackedPaper'">
              <div class="stacked-paper-preview-sheet back"></div>
              <div class="stacked-paper-preview-sheet middle"></div>
              <div class="stacked-paper-preview-sheet front">
                <span class="stacked-paper-preview-time"></span>
                <span class="stacked-paper-preview-text"></span>
                <span class="stacked-paper-preview-avatar"></span>
                <span class="stacked-paper-preview-name"></span>
                <span class="stacked-paper-preview-title"></span>
              </div>
            </template>
            <template v-else>
              <div class="preview-line title"></div>
              <div class="preview-body">
                <span></span><span></span><span></span>
              </div>
            </template>
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
          <div v-if="overflowPages.length" class="overflow-alert">第 {{ overflowPages.join('、') }} 张内容超出画布</div>
          <div v-if="missingImages.length" class="overflow-alert">有 {{ missingImages.length }} 张正文图片未找到</div>
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
                        <span class="author-stack">
                          <strong>{{ config.authorNickname }}</strong>
                          <em>{{ config.authorUsername }}</em>
                        </span>
                      </span>
                      <span v-else-if="config.showWatermark">{{ config.watermark }}</span>
                      <span v-if="config.showPageNumber">{{ pageLabel(index) }}</span>
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
                    <span class="scholarly-date" v-if="capabilities.time && config.showTime">{{ currentTime }}</span>
                    <span class="scholarly-page" v-if="config.showPageNumber">{{ pageLabel(index) }}</span>
                  </div>
                </template>

                <template v-else-if="config.template === 'layeredNote'">
                  <div class="layered-note-stack">
                    <div class="layered-note-sheet">
                      <header class="layered-note-header">
                        <h1 class="layered-note-title">{{ renderTitle }}</h1>
                        <div class="layered-note-author">
                          <div class="layered-note-avatar"><img :src="authorImage" /></div>
                          <div class="layered-note-author-copy">
                            <strong>{{ config.authorNickname }}</strong>
                            <div class="layered-note-byline">
                              <span v-if="config.authorUsername">{{ config.authorUsername }}</span>
                            </div>
                          </div>
                        </div>
                      </header>
                      <main class="layered-note-content markdown-body card-content" v-html="markdownToHtml(page)"></main>
                    </div>
                    <span v-if="config.showPageNumber" class="layered-note-page">{{ pageLabel(index) }}</span>
                  </div>
                </template>

                <template v-else-if="config.template === 'stackedPaper'">
                  <div class="stacked-paper-stage">
                    <div class="stacked-paper-sheet">
                      <time v-if="config.showTime" class="stacked-paper-time">{{ currentTime }}</time>
                      <main class="stacked-paper-content markdown-body card-content" v-html="markdownToHtml(page)"></main>
                      <footer class="stacked-paper-footer">
                        <div class="stacked-paper-author">
                          <div class="stacked-paper-avatar"><img :src="authorImage" /></div>
                          <strong>{{ config.authorNickname }}</strong>
                        </div>
                        <h1 class="stacked-paper-title">{{ renderTitle }}</h1>
                      </footer>
                    </div>
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
          <button class="btn ghost reset-template-btn" @click="resetCurrentTemplate">恢复当前模板默认值</button>
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

        <section v-if="capabilities.background" class="control-section">
          <label class="label">背景配色</label>
          <div class="bg-grid">
            <button
              v-for="bg in activeBackgrounds"
              :key="bg"
              :class="['bg-swatch', config.background === bg ? 'active' : '']"
              :style="{ background: bg }"
              @click="config.background = bg"
              :aria-label="`切换背景色为 ${bg}`"
              :title="bg"
            ></button>
          </div>
          <label v-if="['layeredNote', 'stackedPaper'].includes(config.template)" class="background-custom-row">
            <span>自定义底色</span>
            <input v-model="customBackgroundColor" type="color" class="color-input" />
          </label>
        </section>

        <section class="control-section setting-grid">
          <label class="label">容器设置</label>
          <div v-if="capabilities.padding" class="range-row"><div class="range-line"><span>外层边距</span><span>{{ config.padding }}px</span></div><input v-model.number="config.padding" type="range" min="0" max="72" class="range-input" /></div>
          <div class="range-row"><div class="range-line"><span>缩放比例</span><span>{{ config.previewScale }}%</span></div><input v-model.number="config.previewScale" type="range" min="25" max="120" class="range-input" /></div>
        </section>

        <section class="control-section setting-grid">
          <label class="label">排版设置</label>
          <label v-if="capabilities.titleFont" class="label compact-label">标题字体</label>
          <select v-if="capabilities.titleFont" v-model="config.titleFontFamily" class="select">
            <option v-for="font in fontOptions" :key="`title-${font.value}`" :value="font.value">
              {{ font.label }}
            </option>
          </select>
          <label v-if="capabilities.contentFont" class="label compact-label">正文字体</label>
          <select v-if="capabilities.contentFont" v-model="config.contentFontFamily" class="select">
            <option v-for="font in fontOptions" :key="`content-${font.value}`" :value="font.value">
              {{ font.label }}
            </option>
          </select>
          <div class="font-actions">
            <button class="btn ghost font-refresh" @click="loadCustomFonts(true)">刷新字体</button>
            <button class="btn ghost font-refresh" @click="openFontDir">打开目录</button>
          </div>
          <div class="range-row"><div class="range-line"><span>内容字号</span><span>{{ config.contentFontSize }}px</span></div><input v-model.number="config.contentFontSize" type="range" min="12" max="34" class="range-input" /></div>
          <div class="range-row"><div class="range-line"><span>行高</span><span>{{ config.lineHeight }}</span></div><input v-model.number="config.lineHeight" type="range" min="1.2" max="2.2" step="0.05" class="range-input" /></div>
          <div class="range-row"><div class="range-line"><span>正文图片高度</span><span>{{ config.imageMaxHeight }}%</span></div><input v-model.number="config.imageMaxHeight" type="range" min="20" max="75" step="1" class="range-input" /></div>
          <label v-if="capabilities.textColor" class="label">字体颜色</label>
          <input v-if="capabilities.textColor" v-model="config.textColor" type="color" class="color-input" />
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
          <div v-if="batchReport" class="batch-report">
            <div>本次批量：成功 {{ batchReport.success.length }} 个，失败 {{ batchReport.failed.length }} 个</div>
            <div v-if="batchReport.reportFile">失败清单：{{ batchReport.reportFile }}</div>
            <div v-if="batchReport.failed.length" class="batch-fail-list">
              <div v-for="item in batchReport.failed.slice(0, 8)" :key="item.name">
                {{ item.name }}：{{ item.error }}
              </div>
              <div v-if="batchReport.failed.length > 8">还有 {{ batchReport.failed.length - 8 }} 个失败项，详见清单文件</div>
            </div>
          </div>
        </section>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as htmlToImage from 'html-to-image'
import {
  extractTitle,
  markdownToHtml,
  paginateMarkdown,
  ratios,
  templateCapabilities,
  templates,
  waitForAssets
} from './cardEngine'
import { getSocial, socialIcons } from './socialIcons'
import {
  createNormalizationStats,
  formatNormalizationSummary,
  htmlToMarkdown,
  mergeNormalizationStats,
  normalizeMarkdown
} from './markdownNormalizer'

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
const APP_STATE_KEY = 'markdown-card-app-state'
const APP_STATE_VERSION = 3
const STARTUP_TEMPLATE = 'scholarly'
const systemFontOptions = [
  { label: '默认 (跟随模板)', value: '' },
  { label: '微软雅黑', value: '"Microsoft YaHei", "PingFang SC", sans-serif' },
  { label: '宋体', value: 'SimSun, "Songti SC", serif' },
  { label: '黑体', value: 'SimHei, "Microsoft YaHei", sans-serif' },
  { label: '楷体', value: 'KaiTi, "Kaiti SC", serif' },
  { label: '等宽', value: '"JetBrains Mono", Consolas, "Microsoft YaHei", monospace' },
  { label: 'Arial', value: 'Arial, "Microsoft YaHei", sans-serif' }
]
const loadedFontFamilies = new Set()
const templateScopedKeys = [
  'ratio',
  'watermark',
  'showWatermark',
  'coverImage',
  'showAuthor',
  'showTime',
  'timeFormat',
  'background',
  'textColor',
  'padding',
  'contentFontSize',
  'lineHeight',
  'imageMaxHeight',
  'titleFontFamily',
  'contentFontFamily',
  'showPageNumber'
]

const files = ref([
  { name: '示例.md', path: '', baseDir: '', content: demoMarkdown }
])
const activeIndex = ref(0)
const outputDir = ref('')
const pages = ref([])
const overflowPages = ref([])
const missingImages = ref([])
const exporting = ref(false)
const statusText = ref('准备就绪')
const draftMarkdown = ref(demoMarkdown)
const resolvedMarkdown = ref(demoMarkdown)
const activeTab = ref('themes')
const presetName = ref('')
const savedPresets = ref(loadSavedPresets())
const customFonts = ref([])
const customFontDir = ref('')
const templateSettings = ref({})
const batchReport = ref(null)
const markdownInput = ref(null)
const appStateReady = ref(false)
const now = ref(new Date())
const normalizationBackup = ref(null)
let appStateSaveTimer = 0
let overflowCheckTimer = 0
let markdownResolveRunId = 0
let clockTimer = 0
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
const layeredNoteBackgrounds = [
  '#f52245',
  '#ff5a5f',
  '#e14b71',
  '#ef6a3a',
  '#e6a23c',
  '#6c4ab6',
  '#246bce',
  '#168b82',
  '#2f7d55',
  '#27272a'
]
const stackedPaperBackgrounds = [
  '#70de89',
  '#4ecb71',
  '#84cc16',
  '#eab308',
  '#f59e0b',
  '#f97316',
  '#ff6b57',
  '#ef4444',
  '#f52245',
  '#ec4899',
  '#d946ef',
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#14b8a6',
  '#8b5e3c',
  '#64748b',
  '#27272a',
  '#eee6d8'
]

const config = reactive({
  template: STARTUP_TEMPLATE,
  ratio: templates.scholarly.defaultRatio,
  title: '',
  watermark: templates.scholarly.watermark.text,
  showWatermark: false,
  coverImage: '',
  authorNickname: '林书lucida',
  authorUsername: '@fightingLucida',
  authorAvatar: '',
  socialIcon: 'avatar-2',
  showAuthor: true,
  showTime: false,
  timeFormat: 'YYYY-MM-DD',
  background: templates.scholarly.background,
  textColor: templates.scholarly.textColor,
  previewScale: 54,
  exportScale: 2,
  padding: templates.scholarly.padding,
  contentFontSize: templates.scholarly.contentFontSize,
  lineHeight: templates.scholarly.lineHeight,
  imageMaxHeight: 42,
  titleFontFamily: '',
  contentFontFamily: '',
  showPageNumber: true
})

const activeFile = computed(() => files.value[activeIndex.value] || files.value[0])
const template = computed(() => templates[config.template] || templates.modern)
const capabilities = computed(() => templateCapabilities[config.template] || templateCapabilities.modern)
const authorCapabilities = computed(() => capabilities.value.author || { enabled: false })
const authorEditorVisible = computed(() => authorCapabilities.value.toggle === false || config.showAuthor)
const ratio = computed(() => ratios[config.ratio] || ratios['3:4'])
const renderTitle = computed(() => config.title.trim() || extractTitle(draftMarkdown.value, activeFile.value?.name || '未命名文章'))
const titleInputLabel = computed(() => capabilities.value.title?.label || '标题')
const titleInputPlaceholder = computed(() => capabilities.value.title?.render === false ? '输入导出文件名...' : '输入文章标题...')
const canExport = computed(() => pages.value.length > 0 && outputDir.value)
const selectedSocial = computed(() => getSocial(config.socialIcon))
const authorImage = computed(() => config.authorAvatar || selectedSocial.value.imgUrl)
const activeBackgrounds = computed(() => {
  if (config.template === 'layeredNote') return layeredNoteBackgrounds
  if (config.template === 'stackedPaper') return stackedPaperBackgrounds
  return backgrounds
})
const customBackgroundColor = computed({
  get: () => /^#[0-9a-f]{6}$/i.test(config.background) ? config.background : template.value.background,
  set: value => { config.background = value }
})
const fontOptions = computed(() => [
  ...systemFontOptions,
  ...customFonts.value.map(font => ({
    label: font.name,
    value: font.cssFamily
  }))
])
const currentTime = computed(() => {
  const current = now.value
  const y = current.getFullYear()
  const m = String(current.getMonth() + 1).padStart(2, '0')
  const d = String(current.getDate()).padStart(2, '0')
  const h = String(current.getHours()).padStart(2, '0')
  const minute = String(current.getMinutes()).padStart(2, '0')
  if (config.timeFormat === 'MM/DD') return `${m}月${d}日`
  if (config.timeFormat === 'YYYY年MM月DD日') return `${y}年${m}月${d}日`
  if (config.timeFormat === 'YYYY年MM月DD日 HH:mm') return `${y}年${m}月${d}日 ${h}:${minute}`
  return `${y}-${m}-${d}`
})
const pageLabel = (index) => {
  if (config.template === 'elegant') {
    return `${Math.max(1, index)} / ${Math.max(1, pages.value.length - 1)}`
  }
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
  '--card-height': `${ratio.value.height}px`,
  '--card-padding': `${config.padding}px`,
  '--content-size': `${config.contentFontSize}px`,
  '--line-height': String(config.lineHeight),
  '--image-max-height-ratio': String(config.imageMaxHeight / 100),
  '--outer-bg': config.background,
  '--card-bg': template.value.cardBackground,
  '--text-color': config.textColor,
  '--accent-color': template.value.accentColor,
  '--title-color': template.value.titleColor || config.textColor,
  '--author-name-color': template.value.author?.nicknameColor || config.textColor,
  '--author-user-color': template.value.author?.usernameColor || template.value.accentColor,
  ...(config.titleFontFamily ? { '--title-font-family': config.titleFontFamily } : {}),
  ...(config.contentFontFamily ? { '--content-font-family': config.contentFontFamily } : {})
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
    () => config.imageMaxHeight,
    () => config.titleFontFamily,
    () => config.contentFontFamily,
    () => config.showPageNumber
  ],
  () => repaginate(),
  { immediate: true }
)

watch(
  () => ({
    config: snapshotConfig(),
    templateSettings: snapshotTemplateSettings(),
    outputDir: outputDir.value
  }),
  () => scheduleSaveAppState(),
  { deep: true }
)

onMounted(async () => {
  clockTimer = window.setInterval(() => { now.value = new Date() }, 30_000)
  await loadCustomFonts()
  await restoreAppState()
  appStateReady.value = true
  await repaginate()
  await saveAppStateNow()
  window.addEventListener('beforeunload', saveAppStateNow)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', saveAppStateNow)
  window.clearTimeout(appStateSaveTimer)
  window.clearTimeout(overflowCheckTimer)
  window.clearInterval(clockTimer)
  saveAppStateNow()
})

async function repaginate() {
  await nextTick()
  const title = renderTitle.value
  const markdown = await prepareMarkdownForRender()
  if (markdown === null) return
  pages.value = paginateMarkdown(markdown, {
    ...config,
    title
  })
  await nextTick()
  scheduleOverflowCheck()
}

async function prepareMarkdownForRender() {
  const runId = ++markdownResolveRunId
  const markdown = draftMarkdown.value
  const baseDir = activeFile.value?.baseDir || ''

  if (!api?.resolveMarkdownImages) {
    resolvedMarkdown.value = markdown
    missingImages.value = []
    return markdown
  }

  try {
    const result = await api.resolveMarkdownImages({ markdown, baseDir })
    if (runId !== markdownResolveRunId) return null
    resolvedMarkdown.value = result?.markdown || markdown
    missingImages.value = Array.isArray(result?.missing) ? result.missing : []
    return resolvedMarkdown.value
  } catch {
    if (runId !== markdownResolveRunId) return null
    resolvedMarkdown.value = markdown
    missingImages.value = []
    return markdown
  }
}

function scheduleOverflowCheck() {
  window.clearTimeout(overflowCheckTimer)
  overflowCheckTimer = window.setTimeout(() => {
    checkOverflow()
  }, 160)
}

async function checkOverflow() {
  await nextTick()
  try {
    await waitForAssets(document)
  } catch {}
  await nextTick()

  const nextOverflowPages = []
  for (let i = 0; i < pages.value.length; i += 1) {
    const node = document.getElementById(`render-card-${i}`)
    const content = node?.querySelector('.card-content')
    if (!content) continue
    if (content.scrollHeight > content.clientHeight + 1) {
      nextOverflowPages.push(i + 1)
    }
  }
  overflowPages.value = nextOverflowPages
  return nextOverflowPages
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

function removeFile(index) {
  if (index < 0 || index >= files.value.length) return
  saveDraftToActiveFile()
  const removed = files.value[index]
  const wasActive = index === activeIndex.value
  const nextFiles = files.value.filter((_, fileIndex) => fileIndex !== index)
  files.value = nextFiles
  batchReport.value = null

  if (!nextFiles.length) {
    activeIndex.value = 0
    draftMarkdown.value = ''
    config.title = ''
    statusText.value = `已删除：${removed.name}`
    return
  }

  const nextIndex = wasActive
    ? Math.min(index, nextFiles.length - 1)
    : index < activeIndex.value
      ? activeIndex.value - 1
      : activeIndex.value
  activeIndex.value = nextIndex
  draftMarkdown.value = nextFiles[nextIndex]?.content || ''
  config.title = ''
  statusText.value = `已删除：${removed.name}`
}

function applyTemplate(key) {
  if (key === config.template) return
  rememberCurrentTemplateSettings()
  config.template = key
  applyTemplateSettings(key)
}

function defaultTemplateSettings(key) {
  const next = templates[key] || templates.modern
  const nextCapabilities = templateCapabilities[key] || templateCapabilities.modern
  return {
    ratio: next.defaultRatio,
    background: next.background,
    textColor: next.textColor,
    padding: next.padding,
    contentFontSize: next.contentFontSize,
    lineHeight: next.lineHeight,
    imageMaxHeight: 42,
    titleFontFamily: '',
    contentFontFamily: '',
    showAuthor: !!nextCapabilities.author?.enabled && next.author?.show !== false,
    showWatermark: !!nextCapabilities.watermark?.enabled && next.watermark?.show !== false,
    watermark: next.watermark?.text ?? config.watermark,
    showPageNumber: !!nextCapabilities.pageNumber && next.pageNumber?.show !== false,
    showTime: !!nextCapabilities.time && !!next.time?.show,
    timeFormat: next.time?.format || 'YYYY-MM-DD',
    coverImage: ''
  }
}

function captureTemplateSettings() {
  return Object.fromEntries(templateScopedKeys.map(key => [key, config[key]]))
}

function snapshotTemplateSettings() {
  return {
    ...templateSettings.value,
    [config.template]: captureTemplateSettings()
  }
}

function rememberCurrentTemplateSettings() {
  templateSettings.value = snapshotTemplateSettings()
}

function applyTemplateSettings(key, reset = false) {
  const defaults = defaultTemplateSettings(key)
  const remembered = !reset ? templateSettings.value[key] : null
  const nextCapabilities = templateCapabilities[key] || templateCapabilities.modern
  Object.assign(config, {
    ...defaults,
    ...(remembered || {})
  })
  if (!nextCapabilities.time) config.showTime = false
}

function resetCurrentTemplate() {
  const nextSettings = { ...templateSettings.value }
  delete nextSettings[config.template]
  templateSettings.value = nextSettings
  applyTemplateSettings(config.template, true)
  statusText.value = `已恢复 ${template.value.name} 默认设置`
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
    imageMaxHeight: config.imageMaxHeight,
    titleFontFamily: config.titleFontFamily,
    contentFontFamily: config.contentFontFamily,
    showPageNumber: config.showPageNumber
  }
}

function applyConfigSnapshot(value) {
  if (!value || typeof value !== 'object') return
  Object.assign(config, {
    ...snapshotConfig(),
    ...value
  })
  enforceTemplateCapabilities()
}

function enforceTemplateCapabilities(key = config.template) {
  const nextCapabilities = templateCapabilities[key] || templateCapabilities.modern
  if (!nextCapabilities.time) config.showTime = false
  if (!nextCapabilities.pageNumber) config.showPageNumber = false
  if (!nextCapabilities.watermark?.enabled) config.showWatermark = false
  if (!nextCapabilities.author?.enabled) config.showAuthor = false
}

function normalizeTemplateSettings(value) {
  if (!value || typeof value !== 'object') return {}
  const normalized = {}
  for (const key of Object.keys(templates)) {
    if (value[key] && typeof value[key] === 'object') {
      normalized[key] = Object.fromEntries(
        templateScopedKeys
          .filter(settingKey => Object.prototype.hasOwnProperty.call(value[key], settingKey))
          .map(settingKey => [settingKey, value[key][settingKey]])
      )
    }
  }
  return normalized
}

function snapshotAppState() {
  return {
    version: APP_STATE_VERSION,
    config: snapshotConfig(),
    templateSettings: snapshotTemplateSettings(),
    outputDir: outputDir.value
  }
}

async function restoreAppState() {
  let state = null
  try {
    if (api?.loadAppState) {
      state = await api.loadAppState()
    } else {
      const raw = localStorage.getItem(APP_STATE_KEY)
      state = raw ? JSON.parse(raw) : null
    }
  } catch {
    state = null
  }

  if (!state || typeof state !== 'object') return
  templateSettings.value = normalizeTemplateSettings(state.templateSettings)
  if ((Number(state.version) || 0) < 3 && templateSettings.value.layeredNote) {
    templateSettings.value.layeredNote.showPageNumber = true
  }
  const restoredConfig = { ...(state.config || {}) }
  delete restoredConfig.template
  applyConfigSnapshot(restoredConfig)
  config.template = STARTUP_TEMPLATE
  applyTemplateSettings(STARTUP_TEMPLATE)
  if (typeof state.outputDir === 'string') outputDir.value = state.outputDir
}

function scheduleSaveAppState() {
  if (!appStateReady.value) return
  window.clearTimeout(appStateSaveTimer)
  appStateSaveTimer = window.setTimeout(() => {
    saveAppStateNow()
  }, 250)
}

async function saveAppStateNow() {
  if (!appStateReady.value) return
  const state = snapshotAppState()
  try {
    if (api?.saveAppState) {
      await api.saveAppState(state)
    } else {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify(state))
    }
  } catch {
    // Keep the UI responsive even if a large data URL exceeds storage limits.
  }
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
  rememberCurrentTemplateSettings()
  applyConfigSnapshot(preset.config)
  rememberCurrentTemplateSettings()
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

async function registerCustomFont(font) {
  if (!font?.family || !font?.dataUrl || loadedFontFamilies.has(font.family)) return true
  if (typeof FontFace === 'undefined' || !document.fonts) return false
  const face = new FontFace(font.family, `url(${font.dataUrl})`)
  await face.load()
  document.fonts.add(face)
  loadedFontFamilies.add(font.family)
  return true
}

async function loadCustomFonts(manual = false) {
  if (!api?.listFonts) return
  try {
    const result = await api.listFonts()
    customFontDir.value = result?.dir || ''
    const nextFonts = []
    for (const font of result?.fonts || []) {
      try {
        await registerCustomFont(font)
        nextFonts.push({
          ...font,
          cssFamily: `"${font.family}", "Microsoft YaHei", "PingFang SC", sans-serif`
        })
      } catch {
        // Skip broken font files while keeping the rest available.
      }
    }
    customFonts.value = nextFonts
    try {
      await document.fonts?.ready
    } catch {}
    if (manual) statusText.value = `已加载 ${nextFonts.length} 个本地字体`
    if (appStateReady.value) await repaginate()
  } catch (error) {
    if (manual) statusText.value = `字体加载失败：${error.message || error}`
  }
}

function cssString(value) {
  return JSON.stringify(String(value || ''))
}

function fontFormatFromDataUrl(dataUrl) {
  const mime = String(dataUrl || '').match(/^data:([^;,]+)/)?.[1]?.toLowerCase() || ''
  if (mime.includes('woff2')) return 'woff2'
  if (mime.includes('woff')) return 'woff'
  if (mime.includes('opentype') || mime.includes('otf')) return 'opentype'
  return 'truetype'
}

function selectedCustomFonts() {
  const selectedFamilies = `${config.titleFontFamily}\n${config.contentFontFamily}`
  return customFonts.value.filter(font => (
    font?.family && font?.dataUrl && selectedFamilies.includes(font.family)
  ))
}

let exportFontCssCacheKey = ''
let exportFontCssCacheValue = ''

function buildCustomFontEmbedCss(fonts = selectedCustomFonts()) {
  const cacheKey = fonts.map(font => `${font.family}:${font.dataUrl.length}`).join('|')
  if (cacheKey === exportFontCssCacheKey) return exportFontCssCacheValue

  exportFontCssCacheKey = cacheKey
  exportFontCssCacheValue = fonts
    .map(font => {
      const family = cssString(font.family)
      const source = cssString(font.dataUrl)
      const format = cssString(fontFormatFromDataUrl(font.dataUrl))
      return `@font-face{font-family:${family};src:url(${source}) format(${format});font-weight:normal;font-style:normal;font-display:block;}`
    })
    .join('\n')
  return exportFontCssCacheValue
}

async function ensureExportFontsReady(fonts = selectedCustomFonts()) {
  if (!document.fonts) return

  const families = new Set()
  for (const font of fonts) {
    if (font?.family) families.add(font.family)
  }

  await Promise.all([...families].map(family => (
    document.fonts.load(`16px ${cssString(family)}`).catch(() => undefined)
  )))

  try {
    await document.fonts.ready
  } catch {}
}

async function openFontDir() {
  if (!api?.openFontDir) return
  try {
    const result = await api.openFontDir()
    if (result?.dir) customFontDir.value = result.dir
    statusText.value = result?.ok === false ? '字体目录打开失败' : '已打开字体目录'
  } catch (error) {
    statusText.value = `字体目录打开失败：${error.message || error}`
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
  batchReport.value = null
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
  batchReport.value = null
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

function normalizationContents() {
  saveDraftToActiveFile()
  return files.value.map(file => file.content)
}

async function normalizeCurrentMarkdown() {
  if (!draftMarkdown.value.trim()) return
  batchReport.value = null
  const before = normalizationContents()
  const result = normalizeMarkdown(draftMarkdown.value)
  if (result.markdown === draftMarkdown.value) {
    normalizationBackup.value = null
    statusText.value = formatNormalizationSummary(result.changes)
    return
  }

  draftMarkdown.value = result.markdown
  saveDraftToActiveFile(result.markdown)
  const after = files.value.map(file => file.content)
  normalizationBackup.value = { before, after, activeIndex: activeIndex.value }
  statusText.value = formatNormalizationSummary(result.changes)
  await repaginate()
}

async function normalizeAllMarkdownFiles() {
  if (!files.value.length) return
  batchReport.value = null
  const before = normalizationContents()
  const totals = createNormalizationStats()

  files.value = files.value.map(file => {
    const result = normalizeMarkdown(file.content)
    mergeNormalizationStats(totals, result.changes)
    return { ...file, content: result.markdown }
  })
  draftMarkdown.value = files.value[activeIndex.value]?.content || ''
  const after = files.value.map(file => file.content)

  if (before.every((content, index) => content === after[index])) {
    normalizationBackup.value = null
    statusText.value = formatNormalizationSummary(totals, files.value.length)
    return
  }

  normalizationBackup.value = { before, after, activeIndex: activeIndex.value }
  statusText.value = formatNormalizationSummary(totals, files.value.length)
  await repaginate()
}

async function undoMarkdownNormalization() {
  const backup = normalizationBackup.value
  if (!backup) return
  saveDraftToActiveFile()
  const contentsUnchanged = files.value.length === backup.after.length && files.value.every((file, index) => (
    file.content === backup.after[index]
  ))
  if (!contentsUnchanged) {
    normalizationBackup.value = null
    statusText.value = '规范后正文又被修改，已取消撤销以避免覆盖新内容'
    return
  }

  files.value = files.value.map((file, index) => ({ ...file, content: backup.before[index] ?? file.content }))
  activeIndex.value = Math.min(backup.activeIndex, Math.max(0, files.value.length - 1))
  draftMarkdown.value = files.value[activeIndex.value]?.content || ''
  normalizationBackup.value = null
  statusText.value = '已撤销最近一次 Markdown 规范化'
  await repaginate()
}

function missingImageMessage(prefix = '') {
  if (!missingImages.value.length) return ''
  const samples = missingImages.value.slice(0, 3).join('、')
  const more = missingImages.value.length > 3 ? ` 等 ${missingImages.value.length} 张` : ''
  return `${prefix}正文图片未找到：${samples}${more}`
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('图片读取失败'))
    reader.readAsDataURL(blob)
  })
}

function insertMarkdownAtCursor(markdown) {
  const textarea = markdownInput.value
  const current = draftMarkdown.value
  const start = typeof textarea?.selectionStart === 'number' ? textarea.selectionStart : current.length
  const end = typeof textarea?.selectionEnd === 'number' ? textarea.selectionEnd : start
  const before = current.slice(0, start)
  const after = current.slice(end)
  const prefix = before && !before.endsWith('\n') ? '\n\n' : ''
  const suffix = after && !after.startsWith('\n') ? '\n\n' : ''
  const insertion = `${prefix}${markdown}${suffix}`

  draftMarkdown.value = `${before}${insertion}${after}`
  saveDraftToActiveFile(draftMarkdown.value)

  nextTick(() => {
    const nextPosition = start + insertion.length
    textarea?.focus()
    textarea?.setSelectionRange(nextPosition, nextPosition)
  })
}

async function handleMarkdownPaste(event) {
  const clipboard = event.clipboardData
  const richHtml = clipboard?.getData('text/html') || ''
  const plainText = clipboard?.getData('text/plain') || ''
  const items = Array.from(event.clipboardData?.items || [])
  const imageItems = items.filter(item => item.kind === 'file' && item.type.startsWith('image/'))

  if (richHtml && plainText.trim()) {
    event.preventDefault()
    batchReport.value = null
    try {
      const markdown = htmlToMarkdown(richHtml)
      if (!markdown.trim()) throw new Error('富文本中没有可转换的正文')
      insertMarkdownAtCursor(markdown)
      statusText.value = '已将剪贴板富文本转换为规范 Markdown'
      await repaginate()
    } catch (error) {
      insertMarkdownAtCursor(normalizeMarkdown(plainText).markdown)
      statusText.value = `富文本结构转换失败，已按纯文本规范化：${error.message || error}`
      await repaginate()
    }
    return
  }

  if (!api?.saveTempImage) return
  if (!imageItems.length) return

  event.preventDefault()
  batchReport.value = null
  statusText.value = '正在缓存剪贴板图片...'

  try {
    const snippets = []
    for (const item of imageItems) {
      const file = item.getAsFile()
      if (!file) continue
      const dataUrl = await readBlobAsDataUrl(file)
      const result = await api.saveTempImage({ dataUrl })
      snippets.push(`![图片](${result.markdownPath})`)
    }

    if (!snippets.length) throw new Error('剪贴板里没有可读取的图片')
    insertMarkdownAtCursor(snippets.join('\n\n'))
    statusText.value = `已缓存并插入 ${snippets.length} 张图片`
    await repaginate()
  } catch (error) {
    statusText.value = `图片粘贴失败：${error.message || error}`
  }
}

async function captureImages() {
  await nextTick()
  const exportFonts = selectedCustomFonts()
  await ensureExportFontsReady(exportFonts)
  await waitForAssets(document)
  const fontEmbedCSS = buildCustomFontEmbedCss(exportFonts)

  const images = []
  for (let i = 0; i < pages.value.length; i += 1) {
    const node = document.getElementById(`render-card-${i}`)
    if (!node) continue
    await new Promise(resolve => requestAnimationFrame(resolve))
    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: config.exportScale,
      cacheBust: false,
      width: ratio.value.width,
      height: ratio.value.height,
      fontEmbedCSS,
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
  batchReport.value = null
  statusText.value = '正在导出当前文章...'
  try {
    saveDraftToActiveFile()
    await repaginate()
    const missingMessage = missingImageMessage()
    if (missingMessage) throw new Error(missingMessage)
    const overflowing = await checkOverflow()
    if (overflowing.length) {
      throw new Error(`第 ${overflowing.join('、')} 张卡片内容超出画布，请降低字号/行高或手动分页`)
    }
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
  batchReport.value = null
  saveDraftToActiveFile()
  const originalIndex = activeIndex.value
  const report = {
    success: [],
    failed: []
  }
  let batchSessionStarted = false
  try {
    if (api.beginBatchExport) {
      await api.beginBatchExport()
      batchSessionStarted = true
    }
    for (let i = 0; i < files.value.length; i += 1) {
      const file = files.value[i]
      try {
        activeIndex.value = i
        draftMarkdown.value = file.content
        config.title = ''
        statusText.value = `正在处理 ${i + 1} / ${files.value.length}：${file.name}`
        await repaginate()
        const title = renderTitle.value
        const missingMessage = missingImageMessage(`${title} 的`)
        if (missingMessage) throw new Error(missingMessage)
        const overflowing = await checkOverflow()
        if (overflowing.length) {
          throw new Error(`${title} 的第 ${overflowing.join('、')} 张卡片内容超出画布，请降低字号/行高或手动分页`)
        }
        const images = await captureImages()
        const result = await api.saveImages({
          outputDir: outputDir.value,
          articleName: title,
          images,
          mode: 'folder'
        })
        report.success.push({
          name: file.name,
          title,
          count: result.files.length,
          dir: result.dir
        })
      } catch (error) {
        report.failed.push({
          name: file.name,
          error: String(error.message || error)
        })
      }
    }

    let reportFile = ''
    if (report.failed.length && api.saveBatchReport) {
      const result = await api.saveBatchReport({
        outputDir: outputDir.value,
        report
      })
      reportFile = result?.filePath || ''
    }
    batchReport.value = { ...report, reportFile }
    statusText.value = report.failed.length
      ? `批量导出完成：成功 ${report.success.length} 个，失败 ${report.failed.length} 个`
      : `批量导出完成：成功 ${report.success.length} 个，失败 0 个`
  } catch (error) {
    statusText.value = `批量导出失败：${error.message || error}`
  } finally {
    if (batchSessionStarted && api.finishBatchExport) {
      try {
        await api.finishBatchExport({ report })
      } catch (error) {
        statusText.value = `批量文件下载失败：${error.message || error}`
      }
    }
    activeIndex.value = originalIndex
    draftMarkdown.value = files.value[originalIndex]?.content || ''
    exporting.value = false
  }
}
</script>
