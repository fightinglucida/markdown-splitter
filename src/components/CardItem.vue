<template>
  <!-- 每张卡片的外壳（处理背景、外层圆角和阴影） -->
  <div
    :id="`card-${index}`"
    class="card-fixed-container overflow-hidden relative shadow-2xl"
    :style="cardShellStyle"
  >
    <!-- 外层背景 -->
    <div class="absolute inset-0 z-0" :style="{ background: outerBackground }"></div>

    <!-- 内层内容 -->
    <CardContent
      :config="config"
      :themeConfig="themeConfig"
      :innerBackground="innerBackground"
      :html="renderedHtml"
      :isFirstPage="index === 0"
      :pageIndex="index"
      :totalPages="totalPages"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import { ratios } from '@/data/constants'
import CardContent from './CardContent.vue'

const props = defineProps({
  config: Object,
  themeConfig: Object,
  outerBackground: String,
  innerBackground: String,
  chunk: String,   // usePagination 返回原始 Markdown 字符串
  index: Number,
  totalPages: Number,
  canvasScale: Number
})

const renderedHtml = computed(() => marked.parse(props.chunk || ''))

const cardShellStyle = computed(() => {
  const r = ratios[props.config.ratio]
  return {
    width: r.width + 'px',
    height: r.height + 'px',
    borderRadius: props.config.borderRadius + 'px',
    transform: `scale(${props.canvasScale / 100})`,
    transformOrigin: 'top center'
  }
})
</script>
