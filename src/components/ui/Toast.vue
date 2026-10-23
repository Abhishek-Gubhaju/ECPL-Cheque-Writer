<script lang="ts">
import { ref } from 'vue'

export interface ToastItem {
  id: number
  message: string
  background: string
}

// Module-level store so every useToast() caller shares one list —
// previously each call created its own ref and toasts never rendered.
const toasts = ref<ToastItem[]>([])
let toastId = 0

function remove(id: number) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) toasts.value.splice(index, 1)
}

export function useToast() {
  function show(message: string, background = 'var(--color-success)') {
    const id = ++toastId
    toasts.value.push({ id, message, background })
    setTimeout(() => {
      remove(id)
    }, 2600)
  }

  return {
    toasts,
    show,
    remove,
    success: (message: string) => show(message, 'var(--color-success)'),
    error: (message: string) => show(message, 'var(--color-danger)'),
    info: (message: string) => show(message, 'var(--color-primary)'),
    warning: (message: string) => show(message, 'var(--color-warning)')
  }
}
</script>

<script setup lang="ts">
const { toasts } = useToast()
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast">
        <span class="toast-dot" :style="{ background: toast.background }" />
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: calc(var(--titlebar-h) + var(--space-md));
  right: var(--space-md);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-sm);
  pointer-events: none;
}

/* Feedback reads as a system banner: blurred material, hairline, status dot. */
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  max-width: 340px;
  padding: 7px var(--space-md) 7px 10px;
  border-radius: var(--r);
  border: 1px solid var(--hairline);
  background: var(--toolbar-bg);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  box-shadow: var(--shadow-pop);
  color: var(--text);
  font-size: var(--text-md);
  font-weight: 500;
  pointer-events: auto;
}

.toast-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--green);
}

.toast-message {
  min-width: 0;
}

.toast-enter-active {
  transition: opacity var(--transition-normal), transform var(--transition-smooth);
}

.toast-leave-active {
  position: absolute;
  transition: opacity var(--transition-fast);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

.toast-move {
  transition: transform var(--transition-normal);
}
</style>
