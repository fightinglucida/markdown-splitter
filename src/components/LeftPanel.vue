<template>
  <aside class="w-80 sidebar-bg border-r border-color flex flex-col shrink-0">
    <!-- 品牌区 -->
    <div class="px-5 py-4 border-b border-color flex items-center gap-3 shrink-0">
      <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow">
        <span class="text-white font-bold text-sm">M2</span>
      </div>
      <div>
        <h1 class="text-sm font-bold text-white">Markdown2Card</h1>
        <p class="text-[10px] text-slate-400">专业卡片生成工具</p>
      </div>
    </div>

    <!-- 标签栏 -->
    <TabBar v-model="activeTab" />

    <!-- 面板内容（可滚动） -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <ContentPanel
        v-if="activeTab === 'content'"
        :config="config"
        :themeConfig="themeConfig"
        @update:config="$emit('update:config', $event)"
        @clear-cover="$emit('update:config', { ...config, coverImage: '' })"
      />
      <div v-else class="overflow-y-auto flex-1 no-scrollbar">
        <ThemePanel
          :themes="themes"
          :activeTheme="config.theme"
          @apply="$emit('apply-theme', $event)"
        />
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from './TabBar.vue'
import ContentPanel from './ContentPanel.vue'
import ThemePanel from './ThemePanel.vue'

defineProps({
  config: Object,
  themeConfig: Object,
  themes: Object
})
defineEmits(['update:config', 'apply-theme'])

const activeTab = ref('content')
</script>
