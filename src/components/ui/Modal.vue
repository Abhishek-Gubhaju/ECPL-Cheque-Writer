<script setup lang="ts">
interface Props {
  modelValue: boolean
  title: string
  danger?: boolean
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  danger: false,
  width: '420px'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <Transition name="sheet">
    <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
      <div
        class="modal-box"
        :class="{ danger: props.danger }"
        :style="{ maxWidth: props.width }"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <h3>{{ props.title }}</h3>
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* macOS sheet: drops from the title bar over a 20% dim — not a floating
   web dialog with a 50% blackout. */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: var(--space-2xl) var(--space-lg) var(--space-lg);
  z-index: var(--z-modal);
  -webkit-backdrop-filter: blur(1px);
  backdrop-filter: blur(1px);
}

.modal-box {
  background: var(--panel-bg);
  border: 1px solid var(--hairline);
  padding: var(--space-lg);
  border-radius: var(--r-lg);
  width: 90%;
  max-width: 420px;
  box-shadow: var(--shadow-pop);
}

.modal-box h3 {
  margin: 0 0 var(--space-md) 0;
  color: var(--text);
  font-size: var(--text-md);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.modal-box.danger h3 {
  color: var(--danger);
}

.sheet-enter-active {
  transition: opacity var(--transition-normal);
}

.sheet-leave-active {
  transition: opacity var(--transition-fast);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-active .modal-box {
  animation: sheetDrop var(--transition-smooth);
}

@keyframes sheetDrop {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
