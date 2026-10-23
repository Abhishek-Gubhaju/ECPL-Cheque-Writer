<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  type?: 'text' | 'number' | 'date' | 'password'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  min?: string | number
  max?: string | number
  step?: string | number
  class?: string
  id?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  input: [event: Event]
  change: [event: Event]
}>()

/** Native-style steppers are only meaningful for plain numeric fields. */
const showStepper = computed(() => props.type === 'number' && props.step !== 'any')

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  let value: string | number = target.value
  if (props.type === 'number') value = target.valueAsNumber
  emit('update:modelValue', value)
  emit('input', event)
}

function decimalPlaces(n: number): number {
  const s = String(n)
  const dot = s.indexOf('.')
  return dot === -1 ? 0 : s.length - dot - 1
}

/** Step the value up/down like a macOS stepper, respecting min/max/step. */
function stepBy(direction: 1 | -1) {
  const rawStep = Number(props.step ?? 1)
  const step = isFinite(rawStep) && rawStep > 0 ? rawStep : 1
  const current = Number(props.modelValue)
  const base = isFinite(current) ? current : 0

  let next = base + direction * step
  next = Number(next.toFixed(Math.min(6, Math.max(decimalPlaces(step), decimalPlaces(base)))))

  const min = props.min === undefined || props.min === '' ? -Infinity : Number(props.min)
  const max = props.max === undefined || props.max === '' ? Infinity : Number(props.max)
  if (isFinite(min)) next = Math.max(min, next)
  if (isFinite(max)) next = Math.min(max, next)

  emit('update:modelValue', next)
}
</script>

<template>
  <div class="form-group" :class="props.class">
    <label v-if="props.label" :for="props.id" class="form-label">{{ props.label }}</label>
    <div class="control">
      <input
        :id="props.id"
        :type="props.type"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :readonly="props.readonly"
        :min="props.min"
        :max="props.max"
        :step="props.step"
        :value="modelValue"
        @input="handleInput"
        @change="$emit('change', $event)"
        class="form-control"
        :class="{ 'with-stepper': showStepper }"
      />
      <span v-if="showStepper" class="stepper-stack" aria-hidden="true">
        <button type="button" class="stepper up" tabindex="-1" @click="stepBy(1)" />
        <button type="button" class="stepper down" tabindex="-1" @click="stepBy(-1)" />
      </span>
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

.form-control {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  font-size: var(--text-md);
  font-family: inherit;
  border: 1px solid var(--hairline-2);
  border-radius: var(--r);
  outline: none;
  color: var(--text);
  background-color: var(--surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-control::placeholder {
  color: var(--text-3);
}

.form-control:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}

.form-control:disabled {
  background-color: var(--tint-hover);
  color: var(--text-3);
  cursor: default;
}

.form-control::selection {
  background: var(--accent-tint-strong);
}

.form-control.with-stepper {
  padding-right: 24px;
}

/* Steppers — macOS shows these only while the field is hovered/focused. */
.stepper-stack {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 20px;
  height: calc(100% - 2px);
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast);
}

.control:hover .stepper-stack,
.control:focus-within .stepper-stack {
  opacity: 1;
  pointer-events: auto;
}

.stepper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: default;
}

.stepper:hover:not(:disabled) {
  background: var(--tint-hover);
}

.stepper:active {
  background: var(--tint-pressed);
}

.stepper::before {
  content: '';
  border-left: 3.5px solid transparent;
  border-right: 3.5px solid transparent;
  border-bottom: 4px solid var(--text-2);
}

.stepper.down::before {
  border-bottom: none;
  border-top: 4px solid var(--text-2);
}

/* ==========================================================================
   Inspector rows — inside the side panel, a label/control pair reads like a
   macOS Settings row (label left, control right). Fields that live in a
   multi-column row keep their stacked layout.
   ========================================================================== */

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

:global(.inspector) .section-body .row-2 .form-group > .form-label,
:global(.inspector) .section-body .row-3 .form-group > .form-label {
  margin-bottom: var(--space-xs);
}
</style>
