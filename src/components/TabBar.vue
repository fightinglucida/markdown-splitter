<template>
  <div class="flex border-b border-color">
    <button
      v-for="tab in tabs" :key="tab.id"
      @click="$emit('update:modelValue', tab.id)"
      :class="['flex-1 py-3 text-sm font-medium transition',
        modelValue === tab.id ? 'tab-active' : 'text-slate-400 hover:text-slate-200']"
    >{{ tab.label }}</button>
  </div>
</template>

<script setup>
defineProps({ modelValue: String })
defineEmits(['update:modelValue'])
const tabs = [
  { id: 'content', label: '内容' },
  { id: 'themes',  label: '模板' }
]
</script>
