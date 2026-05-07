<template>
  <!-- ===== Teaching / layered 主题 ===== -->
  <div
    v-if="themeConfig.author?.position === 'top-left'"
    class="relative z-10 flex-1 flex flex-col"
    :style="{
      padding: config.padding + 'px',
      background: innerBackground,
      borderRadius: (config.borderRadius > 0 ? Math.max(0, config.borderRadius - 10) : 0) + 'px'
    }"
  >
    <!-- 标题行（头像 + 标题） -->
    <div
      :style="{
        backgroundColor: themeConfig.title.backgroundColor || 'transparent',
        padding: themeConfig.title.padding || '18px 22px',
        borderRadius: themeConfig.title.borderRadius || '0',
      }"
      class="flex items-center gap-3"
    >
      <div
        v-if="config.showAuthor"
        :style="{ width: themeConfig.author.avatarSize, height: themeConfig.author.avatarSize }"
        class="rounded-full border-3 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0"
      >
        <img v-if="config.authorAvatar" :src="config.authorAvatar" class="w-full h-full object-cover" />
        <div v-else-if="config.socialIcon" class="w-full h-full flex items-center justify-center" :style="{ backgroundColor: getSocialColor(config.socialIcon) }">
          <img :src="getSocialImgUrl(config.socialIcon)" :alt="config.socialIcon" class="w-4/5 h-4/5 object-contain" />
        </div>
        <span v-else :style="{ color: themeConfig.author.nicknameColor }" class="font-bold text-xl">{{ config.authorNickname?.charAt(0) }}</span>
      </div>
      <h1
        v-if="themeConfig.title.show && config.title && isFirstPage"
        :style="titleStyle"
        class="leading-tight tracking-tight flex-1"
      >{{ config.title }}</h1>
    </div>

    <!-- 内容区 -->
    <div
      class="markdown-body flex-1 overflow-hidden shadow-md"
      :style="{ ...contentStyle, marginTop: themeConfig.content.marginTop || '0', position: 'relative', zIndex: 20 }"
      v-html="html"
    ></div>

    <!-- 底部页脚 -->
    <div class="mt-auto pt-4 flex items-center justify-between relative z-30">
      <div v-if="config.showWatermark && themeConfig.watermark.position === 'bottom-left'"
        class="flex items-center gap-1.5"
        :style="{ opacity: themeConfig.watermark.opacity }">
        <span :style="{ fontSize: themeConfig.watermark.fontSize, color: themeConfig.watermark.color }" class="uppercase tracking-widest font-bold">{{ config.watermarkText }}</span>
      </div>
      <span v-if="config.showPageNumber && themeConfig.watermark.position === 'bottom-left'"
        :style="{ fontSize: themeConfig.pageNumber.fontSize, color: themeConfig.pageNumber.color }"
        class="font-mono font-medium bg-white/80 px-2 py-0.5 rounded-full">{{ pageLabel }}</span>
    </div>
  </div>

  <!-- ===== Modern 知识库主题 ===== -->
  <div v-else-if="config.theme === 'modern'" class="relative z-10 flex-1 flex flex-col">
    <div class="modern-knowledge">
      <!-- 封面图（仅第一页） -->
      <div v-if="isFirstPage" class="modern-knowledge__image">
        <img v-if="config.coverImage" :src="config.coverImage" class="w-full h-full object-cover" />
        <div v-else class="modern-knowledge__placeholder">图片占位区域&#10;建议尺寸: 480×350px&#10;可替换为封面插图</div>
      </div>

      <div class="modern-knowledge__body">
        <h1
          v-if="isFirstPage && themeConfig.title.show && config.title"
          :style="titleStyle"
          class="modern-knowledge__title"
        >{{ config.title }}</h1>

        <div
          class="modern-knowledge__desc markdown-body"
          :style="contentStyle"
          v-html="html"
        ></div>

        <div class="modern-knowledge__footer" v-if="config.showWatermark">
          <div class="modern-knowledge__divider"></div>
          <p class="modern-knowledge__signature"
            :style="{ fontSize: themeConfig.watermark.fontSize, color: themeConfig.watermark.color, opacity: themeConfig.watermark.opacity }">
            —— {{ config.watermarkText }} ——
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ===== 通用主题（dark/elegant/scholarly/vibrant） ===== -->
  <div v-else class="relative z-10 flex-1 flex flex-col" :style="{ padding: config.padding + 'px' }">
    <h1
      v-if="themeConfig.title.show && config.title && isFirstPage"
      :style="titleStyle"
      class="leading-tight tracking-tight"
    >{{ config.title }}</h1>

    <div
      class="markdown-body flex-1 overflow-hidden"
      :style="contentStyle"
      v-html="html"
    ></div>

    <!-- 页脚 -->
    <div class="mt-auto pt-5 flex items-center justify-between">
      <!-- 左侧：作者 + 时间 -->
      <div class="flex items-center gap-3">
        <div v-if="config.showAuthor && themeConfig.author.position !== 'top-left'" class="flex items-center gap-3">
          <div
            :style="{ width: themeConfig.author.avatarSize, height: themeConfig.author.avatarSize }"
            class="rounded-full border-2 border-white shadow-sm bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            <img v-if="config.authorAvatar" :src="config.authorAvatar" class="w-full h-full object-cover" />
            <div v-else-if="config.socialIcon" class="w-full h-full flex items-center justify-center" :style="{ backgroundColor: getSocialColor(config.socialIcon) }">
              <img :src="getSocialImgUrl(config.socialIcon)" :alt="config.socialIcon" class="w-4/5 h-4/5 object-contain" />
            </div>
            <span v-else :style="{ color: themeConfig.author.nicknameColor }" class="font-bold text-sm">{{ config.authorNickname?.charAt(0) }}</span>
          </div>
          <div class="flex flex-col">
            <span :style="{ fontSize: themeConfig.author.nicknameSize, color: themeConfig.author.nicknameColor }" class="font-bold leading-none mb-1">{{ config.authorNickname }}</span>
            <div class="flex items-center gap-2">
              <span :style="{ fontSize: themeConfig.author.usernameSize, color: themeConfig.author.usernameColor }" class="font-medium">{{ config.authorUsername }}</span>
              <template v-if="config.showTime">
                <span :style="{ fontSize: themeConfig.time.fontSize, color: themeConfig.time.color }">•</span>
                <span :style="{ fontSize: themeConfig.time.fontSize, color: themeConfig.time.color }" class="font-medium">{{ currentTime }}</span>
              </template>
            </div>
          </div>
        </div>
        <span v-if="!config.showAuthor && config.showTime" :style="{ fontSize: themeConfig.time.fontSize, color: themeConfig.time.color }" class="font-medium">{{ currentTime }}</span>
      </div>

      <!-- 右侧：水印 + 页码 -->
      <div v-if="themeConfig.watermark.position === 'bottom-right'" class="flex flex-col items-end gap-1">
        <div v-if="config.showWatermark" class="flex items-center gap-1.5" :style="{ opacity: themeConfig.watermark.opacity }">
          <span :style="{ fontSize: themeConfig.watermark.fontSize, color: themeConfig.watermark.color }" class="uppercase tracking-widest font-bold">{{ config.watermarkText }}</span>
        </div>
        <span v-if="config.showPageNumber" :style="{ fontSize: themeConfig.pageNumber.fontSize, color: themeConfig.pageNumber.color }" class="font-mono font-medium bg-slate-100/50 px-2 py-0.5 rounded-full">{{ pageLabel }}</span>
      </div>

      <!-- 左水印 + 右页码（teaching fallback） -->
      <template v-if="themeConfig.watermark.position === 'bottom-left'">
        <div v-if="config.showWatermark" class="flex items-center gap-1.5" :style="{ opacity: themeConfig.watermark.opacity }">
          <span :style="{ fontSize: themeConfig.watermark.fontSize, color: themeConfig.watermark.color }" class="uppercase tracking-widest font-bold">{{ config.watermarkText }}</span>
        </div>
        <span v-if="config.showPageNumber" :style="{ fontSize: themeConfig.pageNumber.fontSize, color: themeConfig.pageNumber.color }" class="font-mono font-medium bg-white/80 px-2 py-0.5 rounded-full">{{ pageLabel }}</span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { socialIcons } from '@/data/socialIcons'

const props = defineProps({
  config: Object,
  themeConfig: Object,
  innerBackground: String,
  html: String,
  isFirstPage: Boolean,
  pageIndex: Number,
  totalPages: Number
})

const getSocialColor = (icon) => socialIcons.find(s => s.icon === icon)?.color || '#fff'
const getSocialImgUrl = (icon) => socialIcons.find(s => s.icon === icon)?.imgUrl || ''

const currentTime = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  if (props.config.timeFormat === 'YYYY-MM-DD') return `${y}-${m}-${d}`
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
})

const pageLabel = computed(() => {
  return props.config.pageNumberFormat === 'number'
    ? `${props.pageIndex + 1} / ${props.totalPages}`
    : `Page ${props.pageIndex + 1}`
})

const titleStyle = computed(() => {
  const t = props.themeConfig.title
  return {
    fontSize: t.fontSize,
    fontFamily: t.fontFamily,
    fontWeight: t.fontWeight,
    color: props.config._overrideColor || t.color,
    textAlign: t.textAlign,
    marginBottom: t.marginBottom,
    letterSpacing: t.letterSpacing || 'normal',
    lineHeight: t.lineHeight || '1.3',
    ...(t.borderTop ? { borderTop: t.borderTop } : {}),
    ...(t.borderBottom ? { borderBottom: t.borderBottom } : {}),
    ...(t.padding ? { padding: t.padding } : {})
  }
})

const contentStyle = computed(() => {
  const c = props.themeConfig.content
  return {
    fontSize: props.config._overrideFontSize || c.fontSize,
    fontFamily: props.config.fontFamily || c.fontFamily || 'inherit',
    fontWeight: c.fontWeight || 'normal',
    color: props.config._overrideColor || c.color,
    textAlign: props.config.textAlign || c.textAlign || 'left',
    lineHeight: props.config._overrideLineHeight || c.lineHeight,
    letterSpacing: c.letterSpacing || 'normal',
    backgroundColor: c.backgroundColor,
    backdropFilter: c.backdropFilter,
    padding: c.padding,
    borderRadius: c.borderRadius,
    boxShadow: c.backgroundColor && c.backgroundColor !== 'transparent' ? '0 8px 24px rgba(0,0,0,0.08)' : 'none',
    border: c.backgroundColor && c.backgroundColor !== 'transparent' ? '1px solid rgba(255,255,255,0.08)' : 'none'
  }
})
</script>
