<script setup lang="ts">
interface Option {
  value: string
  label: string
}

interface Props {
  modelValue: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
  class?: string
  id?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  options: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [event: Event]
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}

function handleChange(event: Event) {
  emit('change', event)
}
</script>

<template>
  <div class="form-group" :class="props.class">
    <label v-if="props.label" :for="props.id" class="form-label">{{ props.label }}</label>
    <div class="control">
      <select
        :id="props.id"
        :value="modelValue"
        :disabled="props.disabled"
        @input="handleInput"
        @change="handleChange"
        class="form-control"
      >
        <option v-if="props.placeholder" value="" disabled>{{ props.placeholder }}</option>
        <option v-for="opt in props.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <span class="chevron" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
.form-group {
  margin-bottom: var(--space-md);
}

.control {
  position: relative;
  display: block;
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  margin-bottom: var(--space-xs);
  color: var(--text-2);
}

/* macOS popup button: flat surface, hairline bezel, small chevron. */
.form-control {
  width: 100%;
  height: 28px;
  padding: 0 24px 0 8px;
  font-size: var(--text-md);
  font-family: inherit;
  border: 1px solid var(--hairline-2);
  border-radius: var(--r);
  outline: none;
  color: var(--text);
  background-color: var(--surface);
  appearance: none;
  -webkit-appearance: none;
  cursor: default;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-control:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}

.form-control:disabled {
  background-color: var(--tint-hover);
  color: var(--text-3);
}

.chevron {
  position: absolute;
  right: 9px;
  top: 50%;
  width: 5px;
  height: 5px;
  border-right: 1.5px solid var(--text-2);
  border-bottom: 1.5px solid var(--text-2);
  transform: translateY(-70%) rotate(45deg);
  pointer-events: none;
}

/* Inspector rows: label left, popup right (macOS Settings style). */
:global(.inspector) .section-body .form-group {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 116px;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

:global(.inspector) .section-body .row-2 .form-group,
:global(.inspector) .section-body .row-3 .form-group {
  display: block;
}

:global(.inspector) .section-body .form-group > .form-label {
  margin-bottom: 0;
  font-weight: 400;
  color: var(--text-2);
}
</style>
