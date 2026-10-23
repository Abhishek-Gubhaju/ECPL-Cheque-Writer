<script setup lang="ts">
import { computed } from 'vue'
import DateCells from './DateCells.vue'
import { store, isFieldVisible, usesBox, fieldText, type FieldDef } from '@/store'

/** bordered=false omits the selection border; transparent=true leaves the
 *  paper's own design (a pre-printed cheque leaf) untouched by the print copy. */
const props = withDefaults(defineProps<{ bordered?: boolean; transparent?: boolean }>(), {
  bordered: true,
  transparent: false
})

/** Visible fields only — driven by store, never by DOM measurement. */
const visibleFields = computed(() =>
  store.fields.filter(f => isFieldVisible(f))
)

/** Overlay geometry: purely from store values in cm. No getBoundingClientRect, no zoom.
 * Match PrinterWorkspace exactly — transform-origin is center center so the
 * rotation pivot matches the canvas preview. */
const overlayStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${store.printer.x}cm`,
  top: `${store.printer.y}cm`,
  width: `${store.cheque.w}cm`,
  height: `${store.cheque.h}cm`,
  transform: `rotate(${store.printer.rot}deg)`,
  transformOrigin: 'center center',
  overflow: 'visible',
  background: props.transparent ? 'transparent' : 'rgba(255, 255, 255, 0.97)',
}))

/** Per-field style: coordinates and typography from store, in cm/px. */
function fieldStyle(f: FieldDef): Record<string, string> {
  const style: Record<string, string> = {
    position: 'absolute',
    left: `${f.x}cm`,
    top: `${f.y}cm`,
    fontSize: `${f.fontSize}px`,
    fontFamily: f.fontFamily,
    fontWeight: f.fontWeight,
    color: '#000',
    overflow: 'visible',
  }
  if (f.w) {
    style.width = `${f.w}cm`
    style.whiteSpace = 'normal'
    style.wordWrap = 'break-word'
    style.lineHeight = String(f.lineH ?? 1.3)
  }
  if (f.h) {
    style.height = `${f.h}cm`
  }
  return style
}

/** Crossing style: rotation + border rules from store. */
const crossingStyle = computed(() => {
  const f = store.fields.find(x => x.id === 'p-crossing')
  if (!f) return {}
  return {
    ...fieldStyle(f),
    transform: `rotate(${store.payeeRot}deg)`,
    transformOrigin: 'center center',
    ...(store.crossLines ? {
      borderTop: `${store.crossLineW}px solid #000`,
      borderBottom: `${store.crossLineW}px solid #000`,
      padding: '2px 0'
    } : { borderTop: 'none', borderBottom: 'none' })
  }
})
</script>

<template>
  <div class="cheque-overlay" :class="{ bordered }" :style="overlayStyle">
    <div
      v-for="f in visibleFields"
      :key="f.id"
      class="overlay-field"
      :style="f.id === 'p-crossing' ? crossingStyle : fieldStyle(f)"
    >
      <DateCells
        v-if="usesBox(f) && f.box"
        :text="fieldText(f)"
        :box="f.box"
        :field-id="f.id"
        :font-size="f.fontSize"
      />
      <span v-else>{{ fieldText(f) }}</span>
    </div>
  </div>
</template>

<style scoped>
.cheque-overlay {
  position: absolute;
  background: rgba(255, 255, 255, 0.97);
  box-sizing: border-box;
  transform-origin: center center;
  cursor: move;
  z-index: 2;
}

.cheque-overlay.bordered {
  border: 2px solid var(--color-primary);
}

.overlay-field {
  position: absolute;
  font-family: var(--font-mono);
  font-weight: bold;
  color: #000;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
</style>