<template>
  <div class="flex-1 overflow-y-auto p-4 no-scrollbar">

    <!-- 标题 -->
    <div class="pb-3">
      <label class="text-[10px] text-slate-500 uppercase font-bold block mb-2">标题 (必填)</label>
      <input
        :value="config.title"
        @input="$emit('update:config', { ...config, title: $event.target.value })"
        type="text"
        class="w-full bg-black/20 border border-color rounded-lg px-3 py-2 text-sm font-bold text-white focus:ring-1 focus:ring-indigo-500 outline-none"
        placeholder="输入文章标题..."
      />
    </div>

    <!-- 封面图（仅 modern 主题） -->
    <div v-if="config.theme === 'modern'" class="pb-3">
      <label class="text-[10px] text-slate-500 uppercase font-bold block mb-2">封面图片 (仅第一页, 4:3)</label>
      <div class="flex items-center gap-3">
        <label class="cursor-pointer shrink-0">
          <input type="file" accept="image/*" @change="handleCoverUpload" class="hidden" />
          <div class="w-32 aspect-[4/3] rounded-lg border border-color bg-black/20 overflow-hidden flex items-center justify-center hover:border-indigo-500 transition">
            <img v-if="config.coverImage" :src="config.coverImage" class="w-full h-full object-cover" />
            <span v-else class="text-xs text-slate-400 text-center px-2">点击上传<br/>封面图</span>
          </div>
        </label>
        <button v-if="config.coverImage" @click="$emit('clear-cover')" class="px-3 py-2 text-xs rounded border border-color text-slate-300 hover:border-indigo-500 hover:text-white transition">移除封面</button>
        <span class="text-[10px] text-slate-500">建议比例 4:3</span>
      </div>
    </div>

    <!-- 正文 Markdown -->
    <div class="flex-1 flex flex-col min-h-[200px] pb-3">
      <div class="flex items-center justify-between mb-2">
        <label class="text-[10px] text-slate-500 uppercase font-bold">正文内容</label>
        <span class="text-[9px] text-slate-600">支持粘贴 / 拖入本地图片</span>
      </div>
      <textarea
        ref="textareaRef"
        :value="config.markdownInput"
        @input="$emit('update:config', { ...config, markdownInput: $event.target.value })"
        @paste="handleImagePaste"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="handleImageDrop"
        :class="['flex-1 w-full bg-black/20 border rounded-lg p-4 text-sm font-mono focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-slate-300 min-h-[200px] transition-colors',
          isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-color']"
        placeholder="在此输入 Markdown...&#10;&#10;插入本地图片：直接粘贴或拖入图片文件"
      ></textarea>
    </div>

    <!-- 作者信息 -->
    <div v-if="themeConfig.author?.editable" class="py-3 border-t border-color">
      <div class="flex justify-between items-center mb-3">
        <label class="text-[10px] text-slate-500 uppercase font-bold">作者信息</label>
        <ToggleSwitch :modelValue="config.showAuthor" @update:modelValue="patch('showAuthor', $event)" />
      </div>
      <div v-if="config.showAuthor" class="space-y-3">
        <div class="flex gap-3 items-start">
          <label class="cursor-pointer shrink-0">
            <input type="file" accept="image/*" @change="handleAvatarUpload" class="hidden" />
            <div class="w-14 h-14 rounded-full border-2 border-color bg-black/40 flex items-center justify-center overflow-hidden hover:border-indigo-500 transition">
              <img v-if="config.authorAvatar" :src="config.authorAvatar" class="w-full h-full object-cover" />
              <div v-else-if="config.socialIcon" class="w-full h-full flex items-center justify-center" :style="{ backgroundColor: getSocialColor(config.socialIcon) }">
                <img :src="getSocialImgUrl(config.socialIcon)" :alt="config.socialIcon" class="w-4/5 h-4/5 object-contain" />
              </div>
              <span v-else class="text-lg">👤</span>
            </div>
          </label>
          <div class="flex-1 space-y-2">
            <input :value="config.authorNickname" @input="patch('authorNickname', $event.target.value)" type="text" class="w-full bg-black/40 border border-color rounded px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500" placeholder="用户昵称" />
            <input :value="config.authorUsername" @input="patch('authorUsername', $event.target.value)" type="text" class="w-full bg-black/40 border border-color rounded px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500" placeholder="用户名 @xxx" />
          </div>
        </div>
        <!-- 社交图标选择 -->
        <div class="grid grid-cols-7 gap-1.5">
          <button
            v-for="s in socialIcons" :key="s.icon"
            @click="selectSocial(s.icon)"
            :class="['p-1.5 rounded border-2 transition-all', config.socialIcon === s.icon ? 'border-indigo-400 scale-110' : 'border-transparent hover:border-indigo-400/60']"
            :style="{ backgroundColor: s.color }"
            :title="s.name"
          >
            <img :src="s.imgUrl" :alt="s.name" class="w-5 h-5 object-contain" />
          </button>
        </div>
      </div>
    </div>

    <!-- 时间标签 -->
    <div v-if="themeConfig.time?.editable" class="py-3 border-t border-color">
      <div class="flex justify-between items-center mb-2">
        <label class="text-[10px] text-slate-500 uppercase font-bold">时间标签</label>
        <ToggleSwitch :modelValue="config.showTime" @update:modelValue="patch('showTime', $event)" />
      </div>
      <div v-if="config.showTime" class="flex gap-2 mt-2">
        <button @click="patch('timeFormat','YYYY-MM-DD')" :class="btnCls(config.timeFormat==='YYYY-MM-DD')">YYYY-MM-DD</button>
        <button @click="patch('timeFormat','datetime')" :class="btnCls(config.timeFormat==='datetime')">YYYY-MM-DD HH:MM</button>
      </div>
    </div>

    <!-- 页码 -->
    <div v-if="themeConfig.pageNumber?.editable" class="py-3 border-t border-color">
      <div class="flex justify-between items-center mb-2">
        <label class="text-[10px] text-slate-500 uppercase font-bold">页码标签</label>
        <ToggleSwitch :modelValue="config.showPageNumber" @update:modelValue="patch('showPageNumber', $event)" />
      </div>
      <div v-if="config.showPageNumber" class="flex gap-2 mt-2">
        <button @click="patch('pageNumberFormat','number')" :class="btnCls(config.pageNumberFormat==='number')">1 / n</button>
        <button @click="patch('pageNumberFormat','text')" :class="btnCls(config.pageNumberFormat==='text')">Page n</button>
      </div>
    </div>

    <!-- 水印 -->
    <div v-if="themeConfig.watermark?.editable" class="py-3 border-t border-color">
      <div class="flex justify-between items-center mb-3">
        <label class="text-[10px] text-slate-500 uppercase font-bold">水印设置</label>
        <ToggleSwitch :modelValue="config.showWatermark" @update:modelValue="patch('showWatermark', $event)" />
      </div>
      <input v-if="config.showWatermark" :value="config.watermarkText" @input="patch('watermarkText', $event.target.value)" type="text" class="w-full bg-black/40 border border-color rounded px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500" placeholder="输入水印文字" />
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { socialIcons } from '@/data/socialIcons'
import ToggleSwitch from './ToggleSwitch.vue'

const props = defineProps({
  config: Object,
  themeConfig: Object
})
const emit = defineEmits(['update:config', 'clear-cover'])

const textareaRef = ref(null)
const isDragging = ref(false)

const patch = (key, val) => emit('update:config', { ...props.config, [key]: val })

const btnCls = (active) =>
  ['flex-1 py-1.5 text-[10px] rounded border transition',
    active ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-color text-slate-400 hover:border-indigo-500'
  ].join(' ')

const getSocialColor = (icon) => socialIcons.find(s => s.icon === icon)?.color || '#fff'
const getSocialImgUrl = (icon) => socialIcons.find(s => s.icon === icon)?.imgUrl || ''

const cropToSquare = (file) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      canvas.getContext('2d').drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
})

const handleAvatarUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  const dataUrl = await cropToSquare(file)
  patch('authorAvatar', dataUrl)
  patch('socialIcon', '')
}

const handleCoverUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => patch('coverImage', ev.target.result)
  reader.readAsDataURL(file)
  e.target.value = ''
}

const selectSocial = (icon) => {
  patch('socialIcon', icon)
  patch('authorAvatar', '')
}

// 图片文件 → data URL，插入 markdown 语法到光标位置
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = (e) => resolve(e.target.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const insertImageAtCursor = async (file) => {
  if (!file || !file.type.startsWith('image/')) return
  const dataUrl = await fileToDataUrl(file)
  const el = textareaRef.value
  if (!el) return
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? el.value.length
  const md = `![图片](${dataUrl})`
  const newVal = el.value.slice(0, start) + md + el.value.slice(end)
  patch('markdownInput', newVal)
  // 恢复光标到插入内容之后
  setTimeout(() => {
    el.focus()
    el.setSelectionRange(start + md.length, start + md.length)
  }, 0)
}

const handleImagePaste = async (e) => {
  const items = Array.from(e.clipboardData?.items || [])
  const imgItem = items.find(i => i.type.startsWith('image/'))
  if (!imgItem) return
  e.preventDefault()
  await insertImageAtCursor(imgItem.getAsFile())
}

const handleImageDrop = async (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  const imgFile = files.find(f => f.type.startsWith('image/'))
  if (!imgFile) return
  await insertImageAtCursor(imgFile)
}
</script>
