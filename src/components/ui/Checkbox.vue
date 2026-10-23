<script setup lang="ts">
interface Props {
  modelValue: boolean
  label: string
  disabled?: boolean
  class?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [event: Event]
}>()

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
  emit('change', event)
}
</script>

<template>
  <label class="checkbox-group" :class="props.class">
    <input
      :id="props.id"
      type="checkbox"
      :checked="modelValue"
      :disabled="props.disabled"
      @change="handleChange"
    />
    <span class="checkbox-label">{{ props.label }}</span>
  </label>
</template>

<style scoped>
/* A plain macOS checkbox row — no card, no border, no hover frame. */
.checkbox-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  cursor: default;
}

input[type='checkbox'] {
  width: 14px;
  height: 14px;
  margin: 0;
  flex-shrink: 0;
  cursor: default;
  accent-color: var(--accent);
}

.checkbox-label {
  font-size: var(--text-md);
  color: var(--text);
}

.checkbox-group:hover .checkbox-label {
  color: var(--text);
}
</style>
