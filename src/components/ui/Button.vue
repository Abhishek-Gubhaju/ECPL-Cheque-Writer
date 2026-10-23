<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outline',
  size: 'md',
  disabled: false,
  type: 'button'
})
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :class="['btn', `btn-${props.variant}`, `btn-${props.size}`, props.class]"
  >
    <slot />
  </button>
</template>

<style scoped>
/* A macOS push button: hairline bezel, flat surface, press state darkens.
   It never lifts, floats or glows — that is the web tell we are removing. */
.btn {
  height: 28px;
  padding: 0 var(--space-md);
  border: 1px solid var(--hairline-2);
  border-radius: var(--r);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-md);
  font-weight: 500;
  line-height: 1;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  cursor: default;
  box-shadow: var(--shadow-sm);
  transition: background-color var(--transition-fast), border-color var(--transition-fast),
    color var(--transition-fast);
}

.btn svg {
  flex-shrink: 0;
}

.btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.btn:active:not(:disabled) {
  background: var(--tint-pressed);
}

/* Primary — the single affirmative action in a view (accent fill) */
.btn-primary {
  background: var(--accent);
  border-color: transparent;
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}
.btn-primary:active:not(:disabled) {
  background: var(--accent-pressed);
}

/* Outline — the default neutral action */
.btn-outline:hover:not(:disabled) {
  background: var(--tint-hover);
}

/* Ghost — quiet tertiary action (Cancel, Fit) */
.btn-ghost {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  color: var(--accent);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--tint-hover);
}
.btn-ghost:active:not(:disabled) {
  background: var(--tint-pressed);
}

/* Danger — destructive, but text-only so it never shouts */
.btn-danger {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  color: var(--danger);
}
.btn-danger:hover:not(:disabled) {
  background: var(--color-danger-light);
}

/* Sizes */
.btn-sm {
  height: 24px;
  padding: 0 10px;
  font-size: var(--text-sm);
  gap: 4px;
}

.btn-lg {
  height: 34px;
  padding: 0 var(--space-lg);
  font-size: var(--text-lg);
}
</style>
