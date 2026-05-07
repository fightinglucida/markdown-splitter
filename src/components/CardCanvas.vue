<template>
  <main class="flex-1 main-bg overflow-auto flex flex-col">

    <!-- 顶部工具栏 -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-color shrink-0">
      <div class="flex items-center gap-3">
        <span class="text-slate-400 text-sm">共 {{ cardChunks.length }} 张卡片</span>
        <span v-if="isExporting" class="text-indigo-400 text-sm animate-pulse">导出中...</span>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="cardChunks.length === 1"
          @click="$emit('download-single')"
          :disabled="isExporting"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition text-sm font-medium text-white"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7-7 7-7-7"/></svg>
          导出图片
        </button>
        <button
          v-else
          @click="$emit('export-zip')"
          :disabled="isExporting"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition text-sm font-medium text-white"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7-7 7-7-7"/></svg>
          批量导出 ZIP
        </button>
      </div>
    </div>

    <!-- 卡片画布区域 -->
    <div class="flex-1 overflow-auto p-8">
      <div ref="cardsContainerRef" class="flex flex-wrap gap-8 justify-center items-start">
        <div
          v-for="(chunk, i) in cardChunks" :key="i"
          class="card-scale-wrapper"
          :style="cardWrapperStyle"
        >
          <CardItem
            :config="config"
            :themeConfig="themeConfig"
            :outerBackground="outerBackground"
            :innerBackground="innerBackground"
            :chunk="chunk"
            :index="i"
            :totalPages="cardChunks.length"
            :canvasScale="canvasScale"
          />
        </div>
      </div>
    </div>

  </main>
</template>

<script setup>
import { computed } from 'vue'
import { ratios } from '@/data/constants'
import CardItem from './CardItem.vue'

const props = defineProps({
  config: Object,
  themeConfig: Object,
  outerBackground: String,
  innerBackground: String,
  cardChunks: Array,
  canvasScale: Number,
  isExporting: Boolean
})
defineEmits(['download-single', 'export-zip'])

// 为每张卡片的包装器预留缩放后的显示空间
const cardWrapperStyle = computed(() => {
  const r = ratios[props.config.ratio]
  const scale = props.canvasScale / 100
  return {
    width:  Math.round(r.width  * scale) + 'px',
    height: Math.round(r.height * scale) + 'px',
    position: 'relative'
  }
})
</script>
