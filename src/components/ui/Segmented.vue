<script setup lang="ts">
interface Item {
  value: string | number
  label: string
}

interface Props {
  modelValue: string | number
  items: Item[]
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>

<template>
  <div class="segmented" :class="props.class" role="group">
    <button
      v-for="item in props.items"
      :key="item.value"
      type="button"
      class="segment"
      :class="{ active: item.value === props.modelValue }"
      :aria-pressed="item.value === props.modelValue"
      :disabled="props.disabled"
      @click="emit('update:modelValue', item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
/* macOS segmented control: one capsule, the selected segment is a raised
   surface rather than a colored web toggle. */
.segmented {
  display: flex;
  padding: 1px;
  gap: 1px;
  border: 1px solid var(--hairline-2);
  border-radius: var(--r);
  background: var(--tint-hover);
  width: 100%;
}

.segment {
  flex: 1;
  min-width: 0;
  height: 24px;
  padding: 0 6px;
  border: none;
  border-radius: calc(var(--r) - 2px);
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  cursor: default;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background-color var(--transition-fast), box-shadow var(--transition-fast);
}

.segment:hover:not(.active):not(:disabled) {
  background: var(--tint-hover);
}

.segment.active {
  background: var(--surface);
  box-shadow: var(--shadow-md), 0 0 0 0.5px var(--hairline-2);
}

.segment:disabled {
  opacity: 0.45;
}
</style>
