<template>
  <div class="flex justify-between items-center">
    <span class="text-xs text-slate-400">{{ label }}</span>
    <div class="flex items-center gap-2">
      <input
        type="range"
        :value="value"
        :min="min"
        :max="max"
        :step="step"
        @input="$emit('input', $event.target.value)"
        class="w-20 accent-indigo-600"
      />
      <span class="text-xs font-mono text-slate-300 w-14 text-right">{{ displayValue }}{{ unit }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  label:    String,
  value:    Number,
  min:      { type: Number, default: 0 },
  max:      { type: Number, default: 100 },
  step:     { type: Number, default: 1 },
  unit:     { type: String, default: 'px' },
  decimals: { type: Number, default: 0 }
})
defineEmits(['input'])
const displayValue = computed(() =>
  props.decimals > 0 ? Number(props.value).toFixed(props.decimals) : props.value
)
</script>
