<template>
  <!-- Toggle Switch -->
  <div class="relative inline-block w-8 h-4 align-middle select-none">
    <input
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
      class="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
      :class="modelValue ? 'translate-x-4 border-indigo-600' : 'border-slate-400'"
    />
    <label class="toggle-label block overflow-hidden h-4 rounded-full bg-slate-700 cursor-pointer"></label>
  </div>
</template>

<script setup>
defineProps({ modelValue: Boolean })
defineEmits(['update:modelValue'])
</script>
