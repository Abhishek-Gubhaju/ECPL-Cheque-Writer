<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title: string
  defaultOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: true
})

const open = ref(props.defaultOpen)
</script>

<template>
  <div class="section" :class="{ open }">
    <button class="section-header" type="button" @click="open = !open">
      <span class="section-title">{{ title }}</span>
      <span class="section-chevron" :class="{ flipped: open }">▾</span>
    </button>
    <Transition name="group">
      <div v-show="open" class="section-body">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* An inspector group, not a card: a quiet uppercase header row followed by
   hairline-separated label/control rows. */
.section {
  border-bottom: 1px solid var(--hairline);
}

.section:last-child {
  border-bottom: none;
}

.section-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 10px var(--space-md) 4px;
  background: transparent;
  border: none;
  cursor: default;
  font-family: inherit;
}

.section-title {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-3);
}

.section-chevron {
  font-size: 9px;
  color: var(--text-3);
  transform: rotate(-90deg);
  transition: transform var(--transition-fast);
}

.section-chevron.flipped {
  transform: rotate(0deg);
}

.section-body {
  padding: 4px var(--space-md) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.group-enter-active,
.group-leave-active {
  transition: opacity var(--transition-fast);
}

.group-enter-from,
.group-leave-to {
  opacity: 0;
}
</style>
