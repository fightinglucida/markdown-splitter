<template>
  <div class="grid grid-cols-2 gap-3 p-4">
    <div
      v-for="(t, key) in themes" :key="key"
      @click="$emit('apply', key)"
      :class="['cursor-pointer rounded-lg border-2 p-3 transition-all',
        activeTheme === key ? 'border-indigo-600 bg-indigo-600/10' : 'border-transparent bg-black/20 hover:bg-black/40']"
    >
      <!-- 微型预览卡 -->
      <div
        class="aspect-[3/4] rounded mb-2 flex flex-col overflow-hidden relative p-2"
        :style="{ background: t.config.canvas.background }"
      >
        <div class="absolute inset-0 bg-black/5"></div>
        <!-- 标题线 -->
        <div class="relative z-10 w-full mb-2 px-1">
          <div class="h-1.5 rounded-full"
            :style="{ background: t.config.title.color, width: '65%', margin: t.config.title.textAlign === 'center' ? '0 auto' : '0' }"></div>
        </div>
        <!-- 内容线 -->
        <div
          class="relative z-10 w-full flex-1 rounded px-1 flex flex-col gap-1 pt-1"
          :style="{ background: t.config.content.backgroundColor }"
        >
          <div class="h-0.5 rounded-full" :style="{ background: t.config.content.color, opacity: 0.6, width: '90%' }"></div>
          <div class="h-0.5 rounded-full" :style="{ background: t.config.content.color, opacity: 0.5, width: '80%' }"></div>
          <div class="h-0.5 rounded-full" :style="{ background: t.config.content.color, opacity: 0.4, width: '85%' }"></div>
        </div>
        <!-- 底部 -->
        <div class="relative z-10 w-full mt-1.5 px-1 flex items-center justify-between">
          <div v-if="t.config.author.show" class="flex items-center gap-1">
            <div class="w-1.5 h-1.5 rounded-full" :style="{ background: t.config.author.nicknameColor }"></div>
            <div class="h-0.5 w-5 rounded" :style="{ background: t.config.author.nicknameColor, opacity: 0.7 }"></div>
          </div>
          <div class="h-0.5 w-3 rounded" :style="{ background: t.config.pageNumber.color, opacity: 0.6 }"></div>
        </div>
      </div>
      <!-- 文字信息 -->
      <div class="space-y-1">
        <div class="text-[11px] text-center font-medium text-slate-200">{{ t.name }}</div>
        <div class="text-[9px] text-center text-slate-400">{{ t.preview.description }}</div>
        <div class="flex flex-wrap gap-1 justify-center">
          <span v-for="f in t.preview.features" :key="f" class="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">{{ f }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  themes: Object,
  activeTheme: String
})
defineEmits(['apply'])
</script>
