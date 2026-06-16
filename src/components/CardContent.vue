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
    <!-- 标题行（头像 + 标题），仅第一页显示 -->
    <div
      v-if="isFirstPage"
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
          <img
            :src="getSocialImgUrl(config.socialIcon)"
            :alt="config.socialIcon"
            :class="getSocialIsAvatar(config.socialIcon) ? 'w-full h-full object-cover' : 'w-4/5 h-4/5 object-contain'"
          />
        </div>
        <span v-else :style="{ color: themeConfig.author.nicknameColor }" class="font-bold text-xl">{{ config.authorNickname?.charAt(0) }}</span>
      </div>
      <h1
        v-if="themeConfig.title.show && config.title"
        :style="titleStyle"
        class="leading-tight tracking-tight flex-1"
      >{{ config.title }}</h1>
    </div>

    <!-- 内容区 -->
    <div
      class="markdown-body flex-1 overflow-hidden shadow-md"
      :style="teachingContentStyle"
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

  <!-- ===== 每天学习 (elegant) 主题 ===== -->
  <div v-else-if="config.theme === 'elegant'" class="relative z-10 flex-1 flex flex-col" :style="{ padding: config.padding + 'px' }">
    <!-- 封面页 -->
    <template v-if="isFirstPage">
      <div class="dailylearn-cover">
        <!-- 顶部标语 -->
        <div
          v-if="config.showWatermark && config.watermarkText"
          class="dailylearn-cover__slogan"
          :style="elegantSloganStyle"
        >{{ config.watermarkText }}</div>

        <!-- 封面图 -->
        <div class="dailylearn-cover__image" :style="elegantImageWrapStyle">
          <img v-if="config.coverImage" :src="config.coverImage" style="max-width:100%;max-height:100%;object-fit:contain;display:block" />
          <div v-else class="dailylearn-cover__placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>在左侧上传封面插图</span>
          </div>
        </div>

        <!-- 主标题 -->
        <h1 class="dailylearn-cover__title" :style="elegantTitleStyle">{{ config.title }}</h1>

        <!-- 副标题 -->
        <p v-if="config.subtitle" class="dailylearn-cover__subtitle" :style="elegantSubtitleStyle">{{ config.subtitle }}</p>
      </div>
    </template>

    <!-- 正文页（第2页起） -->
    <template v-else>
      <div
        class="markdown-body flex-1 overflow-hidden"
        :style="contentStyle"
        v-html="html"
      ></div>

      <!-- 页脚 -->
      <div class="mt-auto pt-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div v-if="config.showAuthor" class="flex items-center gap-3">
            <div
              :style="{ width: themeConfig.author.avatarSize, height: themeConfig.author.avatarSize }"
              class="rounded-full border-2 border-white shadow-sm bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0"
            >
              <img v-if="config.authorAvatar" :src="config.authorAvatar" class="w-full h-full object-cover" />
              <div v-else-if="config.socialIcon" class="w-full h-full flex items-center justify-center" :style="{ backgroundColor: getSocialColor(config.socialIcon) }">
                <img
                  :src="getSocialImgUrl(config.socialIcon)"
                  :alt="config.socialIcon"
                  :class="getSocialIsAvatar(config.socialIcon) ? 'w-full h-full object-cover' : 'w-4/5 h-4/5 object-contain'"
                />
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

        <div class="flex flex-col items-end gap-1">
          <span v-if="config.showPageNumber" :style="{ fontSize: themeConfig.pageNumber.fontSize, color: themeConfig.pageNumber.color }" class="font-mono font-medium bg-slate-100/50 px-2 py-0.5 rounded-full">{{ pageLabel }}</span>
        </div>
      </div>
    </template>
  </div>

  <!-- ===== 通用主题（dark/scholarly/vibrant） ===== -->
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
              <img
                :src="getSocialImgUrl(config.socialIcon)"
                :alt="config.socialIcon"
                :class="getSocialIsAvatar(config.socialIcon) ? 'w-full h-full object-cover' : 'w-4/5 h-4/5 object-contain'"
              />
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
const getSocialIsAvatar = (icon) => !!socialIcons.find(s => s.icon === icon)?.isAvatar

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

// Teaching 主题内容区样式：非首页时充满整个内层，去掉 marginTop，圆角变为全圆角
const teachingContentStyle = computed(() => {
  const base = { ...contentStyle.value, position: 'relative', zIndex: 20 }
  if (props.isFirstPage) {
    base.marginTop = props.themeConfig.content.marginTop || '0'
  } else {
    base.marginTop = '0'
    base.borderRadius = props.themeConfig.content.borderRadius?.replace('0 0', '16px 16px') || '16px'
  }
  return base
})

// 每天学习主题封面图片外框样式
const elegantImageWrapStyle = computed(() => ({
  border: `${props.config.imgBorderWidth || '4'}px ${props.config.imgBorderStyle || 'dashed'} ${props.config.imgBorderColor || '#d0d0d0'}`,
  borderRadius: (props.config.imgBorderRadius || '0') + 'px',
  padding: '4px'
}))

// 每天学习主题标语样式
const elegantSloganStyle = computed(() => ({  fontSize: props.config.sloganFontSize || '50px',
  color: props.config.sloganColor || '#1f1f1f',
  marginTop: props.config.sloganMarginTop || '4px',
  marginBottom: props.config.sloganMarginBottom || '20px'
}))

// 每天学习主题封面标题样式
const elegantTitleStyle = computed(() => {
  const t = props.themeConfig.title
  return {
    fontSize: props.config.titleFontSize || '43px',
    fontFamily: props.config.fontFamily || t.fontFamily,
    fontWeight: t.fontWeight || '900',
    color: props.config.titleColor || '#000000',
    textAlign: 'center',
    marginTop: props.config.titleMarginTop || '30px',
    marginBottom: props.config.titleMarginBottom || '4px',
    lineHeight: '1.15',
    letterSpacing: '-0.01em'
  }
})

// 每天学习主题封面副标题样式
const elegantSubtitleStyle = computed(() => ({
  fontSize: props.config.subtitleFontSize || '26px',
  color: props.config.subtitleColor || '#1f1f1f',
  marginTop: props.config.subtitleMarginTop || '30px'
}))
</script>
