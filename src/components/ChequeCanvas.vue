<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  store, PX_PER_CM, selectField, moveField, moveGuide, removeGuide,
  setFieldText, fieldText, isFieldVisible, clamp, usesBox
} from '@/store'
import DateCells from './DateCells.vue'

interface Props {
  zoom: number // percent
}

const props = defineProps<Props>()

const emit = defineEmits<{
  fieldSelected: [id: string | null]
}>()

const canvasEl = ref<HTMLElement | null>(null)

const canvasStyle = computed(() => ({
  width: `${store.cheque.w * PX_PER_CM}px`,
  height: `${store.cheque.h * PX_PER_CM}px`
}))

const refStyle = computed(() => ({
  opacity: store.refOpacity,
  width: `${store.cheque.w * PX_PER_CM}px`,
  height: `${store.cheque.h * PX_PER_CM}px`
}))

function fieldStyle(f: { x: number; y: number }) {
  return {
    left: `${f.x * PX_PER_CM}px`,
    top: `${f.y * PX_PER_CM}px`
  }
}

/** Width/height "cell" box; a width turns the field into a wrapping multi-line cell. */
function cellBoxStyle(f: { w?: number; h?: number; lineH?: number }): Record<string, string> {
  return {
    ...(f.w ? {
      width: `${f.w * PX_PER_CM}px`,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      lineHeight: String(f.lineH ?? 1.3)
    } : {}),
    ...(f.h ? { height: `${f.h * PX_PER_CM}px` } : {})
  }
}

function crossingStyle() {
  return {
    transform: `rotate(${store.payeeRot}deg)`,
    ...(store.crossLines ? {
      borderTop: `${store.crossLineW}px solid #000`,
      borderBottom: `${store.crossLineW}px solid #000`,
      padding: '2px 0'
    } : {
      borderTop: 'none',
      borderBottom: 'none'
    })
  }
}

/** Convert a client-pixel delta into cm at the current zoom. */
function deltaCm(clientDelta: number): number {
  return clientDelta / (props.zoom / 100) / PX_PER_CM
}

/* ----- field dragging ----- */

type DragKind = 'field' | 'guide'
interface DragState {
  kind: DragKind
  id: string
  startX: number
  startY: number
  baseX: number // field.x or guide.pos (cm)
  baseY: number
  el?: HTMLElement
}
const drag = ref<DragState | null>(null)

function startFieldDrag(e: MouseEvent, id: string) {
  if (!store.editMode) return
  const f = store.fields.find(x => x.id === id)
  if (!f) return
  selectField(id)
  emit('fieldSelected', id)
  const el = e.currentTarget as HTMLElement
  drag.value = {
    kind: 'field', id,
    startX: e.clientX, startY: e.clientY,
    baseX: f.x, baseY: f.y,
    el
  }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', endDrag)
}

function startGuideDrag(e: MouseEvent, id: string) {
  const g = store.guides.find(x => x.id === id)
  if (!g) return
  e.stopPropagation()
  drag.value = {
    kind: 'guide', id,
    startX: e.clientX, startY: e.clientY,
    baseX: g.pos, baseY: g.pos
  }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', endDrag)
}

function onDragMove(e: MouseEvent) {
  const d = drag.value
  if (!d) return
  if (d.kind === 'field' && d.el) {
    // Clamp inside the cheque using the field's base-pixel size (transform does not affect offsetWidth)
    const wCm = d.el.offsetWidth / PX_PER_CM
    const hCm = d.el.offsetHeight / PX_PER_CM
    const nx = d.baseX + deltaCm(e.clientX - d.startX)
    const ny = d.baseY + deltaCm(e.clientY - d.startY)
    moveField(d.id, clamp(nx, 0, store.cheque.w - wCm), clamp(ny, 0, store.cheque.h - hCm))
  } else if (d.kind === 'guide') {
    const g = store.guides.find(x => x.id === d.id)
    if (!g) return
    const delta = g.type === 'h' ? e.clientY - d.startY : e.clientX - d.startX
    moveGuide(d.id, d.baseX + deltaCm(delta))
  }
}

function endDrag() {
  drag.value = null
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', endDrag)
}

/* ----- selection / editing ----- */

function onFieldClick(e: MouseEvent, id: string) {
  e.stopPropagation()
  selectField(id)
  emit('fieldSelected', id)
}

function onFieldDblClick(e: MouseEvent, id: string) {
  if (!store.editMode) return
  e.stopPropagation()
  const f = store.fields.find(x => x.id === id)
  if (!f) return
  const result = window.prompt(`Edit ${f.label}`, fieldText(f))
  if (result !== null) setFieldText(id, result)
}

function onCanvasClick() {
  selectField(null)
  emit('fieldSelected', null)
}

function onGuideDblClick(e: MouseEvent, id: string) {
  e.stopPropagation()
  removeGuide(id)
}

function isSelected(id: string): boolean {
  return store.editMode && store.selectedFieldId === id
}
</script>

<template>
  <div
    ref="canvasEl"
    class="cheque-canvas"
    :style="canvasStyle"
    @click="onCanvasClick"
  >
    <!-- reference image behind everything -->
    <img
      v-if="store.refImg"
      class="reference-image"
      :src="store.refImg"
      :style="refStyle"
      alt="Reference"
      draggable="false"
    />

    <!-- alignment guides -->
    <div
      v-for="g in store.guides"
      :key="g.id"
      class="guide"
      :class="[g.type, { dragging: drag?.kind === 'guide' && drag.id === g.id }]"
      :style="g.type === 'h'
        ? { top: `${g.pos * PX_PER_CM}px` }
        : { left: `${g.pos * PX_PER_CM}px` }"
      @mousedown="startGuideDrag($event, g.id)"
      @dblclick="onGuideDblClick($event, g.id)"
    />

    <!-- fields -->
    <div
      v-for="f in store.fields"
      v-show="isFieldVisible(f)"
      :key="f.id"
      class="field"
      :class="{
        selected: isSelected(f.id),
        editable: store.editMode,
        crossing: f.id === 'p-crossing'
      }"
      :style="[
        fieldStyle(f),
        f.id === 'p-crossing' ? crossingStyle() : {},
        cellBoxStyle(f)
      ]"
      @mousedown="startFieldDrag($event, f.id)"
      @click="onFieldClick($event, f.id)"
      @dblclick="onFieldDblClick($event, f.id)"
    >
      <span class="field-tag">{{ f.label }}</span>
      <DateCells
        v-if="usesBox(f) && f.box"
        :text="fieldText(f)"
        :box="f.box"
        :field-id="f.id"
        :font-size="f.fontSize"
        :style="{
          fontFamily: f.fontFamily,
          fontWeight: f.fontWeight,
          fontSize: `${f.fontSize}px`
        }"
      />
      <span
        v-else
        class="field-text"
        :style="{
          fontSize: `${f.fontSize}px`,
          fontFamily: f.fontFamily,
          fontWeight: f.fontWeight,
          lineHeight: String(f.lineH ?? 1.3)
        }"
      >{{ fieldText(f) }}</span>
    </div>
  </div>
</template>

<style scoped>
.cheque-canvas {
  position: relative;
  background-color: #fff;
  background-image: radial-gradient(circle, #c9cdd4 0.8px, transparent 0.8px);
  background-size: 18.8976px 18.8976px; /* 0.5 cm grid */
  border: 1px solid var(--color-border);
  overflow: hidden;
  user-select: none;
  cursor: default;
}

.reference-image {
  position: absolute;
  left: 0;
  top: 0;
  object-fit: fill;
  pointer-events: none;
  z-index: 1;
}

.guide {
  position: absolute;
  z-index: 5;
  background: #ef4444;
  cursor: grab;
}

.guide.dragging {
  cursor: grabbing;
}

.guide.h {
  left: 0;
  width: 100%;
  height: 1px;
}

.guide.v {
  top: 0;
  height: 100%;
  width: 1px;
}

.field {
  position: absolute;
  z-index: 2;
  white-space: nowrap;
  color: #111;
  cursor: default;
  /* Top-anchored column: Y = top edge of line 1; extra lines grow downward only */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.field.editable {
  cursor: grab;
}

.field.editable:active {
  cursor: grabbing;
}

.field.crossing {
  white-space: nowrap;
  font-weight: bold;
  z-index: 3;
}

.field-text {
  display: inline-block;
  line-height: 1.3;
}

.field-tag {
  position: absolute;
  top: -15px;
  left: 0;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #dbe1ea;
  border-radius: 3px;
  padding: 0 4px;
  height: 13px;
  line-height: 12px;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: 4;
  white-space: nowrap;
}

.field.editable .field-tag {
  opacity: 1;
}

.field.selected::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 1.5px solid var(--color-primary);
  border-radius: 3px;
  pointer-events: none;
}

.field.selected .field-tag {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
</style>
