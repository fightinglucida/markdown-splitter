<template>
  <aside class="w-72 sidebar-bg border-l border-color flex flex-col shrink-0 overflow-y-auto no-scrollbar">
    <div class="p-4 border-b border-color">
      <h3 class="text-xs font-bold text-indigo-500 uppercase tracking-widest">属性设置</h3>
    </div>

    <div class="p-4 space-y-5">

      <!-- 画布比例 -->
      <div>
        <label class="text-[10px] text-slate-500 uppercase font-bold block mb-3">画布比例</label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="(r, key) in ratios" :key="key"
            @click="patch('ratio', key)"
            :class="['bg-black/40 border-2 rounded-lg p-3 transition-all hover:bg-black/60',
              config.ratio === key ? 'border-indigo-500 bg-indigo-500/20' : 'border-color']"
            :title="r.label"
          >
            <div class="w-full flex items-center justify-center">
              <div class="border-2 border-slate-400 rounded-sm"
                :style="{ aspectRatio: r.cssRatio, width: key.includes('16')||key.includes('21') ? '22px' : '18px', maxHeight: '30px' }"
                :class="config.ratio === key ? 'border-indigo-400' : ''"
              ></div>
            </div>
            <div class="text-[9px] text-center mt-1.5 font-medium" :class="config.ratio === key ? 'text-indigo-300' : 'text-slate-500'">{{ r.label }}</div>
          </button>
        </div>
      </div>

      <!-- 背景配色 — 修复：用 outline 替代 border，避免透明边框漏出底色 -->
      <div>
        <label class="text-[10px] text-slate-500 uppercase font-bold block mb-3">背景配色</label>
        <div class="grid grid-cols-7 gap-1.5">
          <button
            v-for="bg in backgrounds" :key="bg.value"
            @click="patch('background', bg.value)"
            :style="{ background: bg.value }"
            :class="['w-full aspect-square rounded-lg transition-all hover:scale-105',
              config.background === bg.value
                ? 'outline outline-2 outline-offset-1 outline-indigo-500'
                : 'outline-none']"
          ></button>
        </div>
      </div>

      <!-- 容器设置 -->
      <div class="space-y-3">
        <label class="text-[10px] text-slate-500 uppercase font-bold block">容器设置</label>
        <SliderRow label="外层边距" :value="config.padding" :min="0" :max="60" @input="patch('padding', +$event)" />
        <SliderRow label="圆角" :value="config.borderRadius" :min="0" :max="40" @input="patch('borderRadius', +$event)" />
        <SliderRow label="缩放比例" :value="canvasScale" :min="30" :max="100" unit="%" @input="$emit('update:canvasScale', +$event)" />
      </div>

      <!-- 字体设置（主题开启 fontEditable 时显示，仅字体和颜色） -->
      <div v-if="!themeConfig.content?.editable && themeConfig.content?.fontEditable" class="space-y-3">
        <label class="text-[10px] text-slate-500 uppercase font-bold block">字体设置</label>

        <!-- 字体 -->
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-400">字体</span>
          <select
            :value="config.fontFamily"
            @change="patch('fontFamily', $event.target.value)"
            class="bg-black/40 border border-color rounded px-2 py-1 text-xs text-slate-300 outline-none focus:border-indigo-500 max-w-[160px]"
          >
            <option v-for="f in fonts" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>
        </div>

        <!-- 字体颜色 -->
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-400">字体颜色</span>
          <div class="flex items-center gap-2">
            <div class="relative w-7 h-7 rounded border border-color overflow-hidden cursor-pointer hover:border-indigo-400 transition">
              <input
                type="color"
                :value="currentTextColor"
                @input="patchColor($event.target.value)"
                class="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-none bg-transparent"
              />
            </div>
            <span class="text-[10px] text-slate-500 font-mono uppercase">{{ currentTextColor }}</span>
            <button
              v-if="config._overrideColor"
              @click="patchColor(null)"
              class="text-[10px] text-slate-500 hover:text-indigo-400 transition"
              title="重置为主题默认"
            >↺</button>
          </div>
        </div>
      </div>

      <!-- 排版设置（主题允许编辑时才显示） -->
      <div v-if="themeConfig.content?.editable" class="space-y-3">
        <label class="text-[10px] text-slate-500 uppercase font-bold block">排版设置</label>

        <!-- 字体 -->
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-400">字体</span>
          <select
            :value="config.fontFamily"
            @change="patch('fontFamily', $event.target.value)"
            class="bg-black/40 border border-color rounded px-2 py-1 text-xs text-slate-300 outline-none focus:border-indigo-500 max-w-[160px]"
          >
            <option v-for="f in fonts" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>
        </div>

        <!-- 文字对齐 -->
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-400">对齐</span>
          <div class="flex gap-1">
            <button
              v-for="a in alignments" :key="a.value"
              @click="patch('textAlign', a.value)"
              :class="['p-1.5 rounded border transition-all text-xs',
                config.textAlign === a.value ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-color bg-black/40 text-slate-400 hover:border-indigo-400']"
              :title="a.label"
            >{{ a.icon }}</button>
          </div>
        </div>

        <!-- 内容字号 -->
        <SliderRow label="内容字号" :value="contentFontSize" :min="12" :max="24" unit="px" @input="patchFontSize(+$event)" />

        <!-- 行高 -->
        <SliderRow label="行高" :value="contentLineHeight" :min="1.2" :max="2.2" :step="0.05" unit="x" :decimals="2" @input="patchLineHeight(+$event)" />

        <!-- 字体颜色 -->
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-400">字体颜色</span>
          <div class="flex items-center gap-2">
            <div class="relative w-7 h-7 rounded border border-color overflow-hidden cursor-pointer hover:border-indigo-400 transition">
              <input
                type="color"
                :value="currentTextColor"
                @input="patchColor($event.target.value)"
                class="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-none bg-transparent"
              />
            </div>
            <span class="text-[10px] text-slate-500 font-mono uppercase">{{ currentTextColor }}</span>
            <button
              v-if="config._overrideColor"
              @click="patchColor(null)"
              class="text-[10px] text-slate-500 hover:text-indigo-400 transition"
              title="重置为主题默认"
            >↺</button>
          </div>
        </div>
      </div>

      <!-- 导出设置 -->
      <div class="space-y-3">
        <label class="text-[10px] text-slate-500 uppercase font-bold block">导出画质</label>
        <div class="flex gap-2">
          <button
            v-for="r in pixelRatios" :key="r.value"
            @click="$emit('update:exportPixelRatio', r.value)"
            :class="['flex-1 py-1.5 text-[10px] rounded border transition',
              exportPixelRatio === r.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-color text-slate-400 hover:border-indigo-500']"
          >{{ r.label }}</button>
        </div>
      </div>

    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { ratios, fonts } from '@/data/constants'
import { backgrounds } from '@/data/backgrounds'
import SliderRow from './SliderRow.vue'

const props = defineProps({
  config: Object,
  themeConfig: Object,
  canvasScale: Number,
  exportPixelRatio: Number
})
const emit = defineEmits(['update:config', 'update:canvasScale', 'update:exportPixelRatio'])

const patch = (key, val) => emit('update:config', { ...props.config, [key]: val })

const alignments = [
  { value: 'left',   icon: '≡', label: '左对齐' },
  { value: 'center', icon: '☰', label: '居中' },
  { value: 'right',  icon: '≡', label: '右对齐' }
]

const pixelRatios = [
  { label: '1x (快)',   value: 1   },
  { label: '1.5x (均衡)', value: 1.5 },
  { label: '2x (精细)', value: 2   }
]

// 字号/行高：优先读取 config 里的覆写值，没有则读主题默认值
const contentFontSize = computed(() => {
  if (props.config._overrideFontSize) return parseInt(props.config._overrideFontSize, 10) || 16
  return parseInt(props.themeConfig?.content?.fontSize || '16px', 10) || 16
})
const contentLineHeight = computed(() => {
  if (props.config._overrideLineHeight) return parseFloat(props.config._overrideLineHeight) || 1.7
  return parseFloat(props.themeConfig?.content?.lineHeight || '1.7') || 1.7
})

const patchFontSize = (val) => {
  // 同步到 config，由 App 层传递给 themeConfig 覆写
  emit('update:config', { ...props.config, _overrideFontSize: `${val}px` })
}
const patchLineHeight = (val) => {
  emit('update:config', { ...props.config, _overrideLineHeight: String(val) })
}
const currentTextColor = computed(() => {
  return props.config._overrideColor || props.themeConfig?.content?.color || '#ffffff'
})
const patchColor = (val) => {
  const updated = { ...props.config }
  if (val === null) {
    delete updated._overrideColor
  } else {
    updated._overrideColor = val
  }
  emit('update:config', updated)
}
</script>
