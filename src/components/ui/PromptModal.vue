<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import Modal from './Modal.vue'

interface Props {
  modelValue: boolean
  title: string
  message?: string
  defaultValue?: string
  placeholder?: string
  danger?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  danger: false,
  placeholder: '',
  defaultValue: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [value: string]
  cancel: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref(props.defaultValue)

watch(() => props.modelValue, (visible) => {
  if (visible) {
    inputValue.value = props.defaultValue
    nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
    })
  }
})

function onConfirm() {
  emit('update:modelValue', false)
  emit('confirm', inputValue.value)
}

function onCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    onConfirm()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    onCancel()
  }
}
</script>

<template>
<Modal
  :model-value="modelValue"
  :title="title"
  :danger="danger"
  @update:model-value="$emit('update:modelValue', $event)"
>
  <p v-if="message" class="modal-message">{{ message }}</p>
  <input
    ref="inputRef"
    v-model="inputValue"
    type="text"
    class="modal-input"
    :placeholder="placeholder"
    @keydown="onKeydown"
  />
  
  <div class="modal-actions">
    <button type="button" class="btn btn-secondary" @click="onCancel">Cancel</button>
    <button type="button" class="btn btn-primary" @click="onConfirm">Save</button>
  </div>
</Modal>
</template>

<style scoped>
.modal-message {
  margin: 0 0 var(--space-md);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.modal-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.modal-input:focus {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}
</style>