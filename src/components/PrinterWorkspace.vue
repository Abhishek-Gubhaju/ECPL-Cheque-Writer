<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  store, selectedField, fitZoom, movePrinterXY, clamp,
  PX_PER_CM, round2, paperSize
} from '@/store'
import ChequeOverlay from './ChequeOverlay.vue'

const wsEl = ref<HTMLElement | null>(null)

/** The sheet actually being printed on — A4, cheque stock, or custom. */
const paper = computed(() => paperSize())

const a4Style = computed(() => ({
  width: `${paper.value.w * PX_PER_CM}px`,
  height: `${paper.value.h * PX_PER_CM}px`
}))

const zoomWrapStyle = computed(() => ({
  width: `${paper.value.w * PX_PER_CM}px`,
  height: `${paper.value.h * PX_PER_CM}px`,
  transform: `scale(${store.printer.zoom / 100})`,
  transformOrigin: 'top left'
}))

/** Layout box = scaled size so scrollbars cover the full visual area. */
const zoomFrameStyle = computed(() => ({
  width: `${paper.value.w * PX_PER_CM * (store.printer.zoom / 100)}px`,
  height: `${paper.value.h * PX_PER_CM * (store.printer.zoom / 100)}px`
}))

const posChip = computed(() => `${store.printer.x.toFixed(2)} / ${store.printer.y.toFixed(2)} cm`)

function fit() {
  if (!wsEl.value) return
  store.printer.zoom = fitZoom(paper.value.w, paper.value.h, wsEl.value.clientWidth, wsEl.value.clientHeight, 64)
}

// panels ask for a fit by incrementing store.fitRequest
watch(() => store.fitRequest, () => fit())

// the sheet's orientation follows the cheque's rotation
watch(() => store.printer.rot, () => requestAnimationFrame(fit))

// Fit when opened: once on the next frame, again after layout settles
onMounted(() => {
  requestAnimationFrame(() => {
    fit()
    setTimeout(fit, 120)
  })
})

function setZoom(value: number) {
  store.printer.zoom = Math.round(clamp(value, 10, 400))
}

function zoomBy(factor: number) {
  setZoom(store.printer.zoom * factor)
}

function onZoomChange(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (isFinite(v)) setZoom(v)
}

/* ----- drag the cheque as one unit ----- */
const dragging = ref(false)
let startX = 0
let startY = 0
let baseX = 0
let baseY = 0

function onDragStart(e: MouseEvent) {
  dragging.value = true
  startX = e.clientX
  startY = e.clientY
  baseX = store.printer.x
  baseY = store.printer.y
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!dragging.value) return
  const scale = store.printer.zoom / 100
  const dx = (e.clientX - startX) / scale / PX_PER_CM
  const dy = (e.clientY - startY) / scale / PX_PER_CM
  movePrinterXY(round2(baseX + dx), round2(baseY + dy))
}

function onDragEnd() {
  dragging.value = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}
</script>

<template>
  <div class="workspace-col">
    <!-- toolbar: quiet read-outs, no boxed chips -->
    <div class="ws-toolbar">
      <span class="chip"><span class="chip-k">Cheque</span>{{ store.cheque.w }} × {{ store.cheque.h }} cm</span>
      <span class="chip"><span class="chip-k">Paper</span>{{ paper.w }} × {{ paper.h }} cm</span>
      <span class="chip"><span class="chip-k">Position</span>{{ posChip }}</span>
      <span class="chip"><span class="chip-k">Rotation</span>{{ store.printer.rot }}°</span>
      <span class="chip"><span class="chip-k">Selection</span>{{ selectedField?.label || 'Cheque overlay' }}</span>
    </div>

    <!-- workspace -->
    <div class="well-wrap">
      <div ref="wsEl" class="workspace">
        <div class="zoom-frame" :style="zoomFrameStyle">
          <div class="zoom-wrap" :style="zoomWrapStyle">
            <div class="a4-sheet" :style="a4Style">
              <ChequeOverlay @mousedown="onDragStart" />
            </div>
          </div>
        </div>
      </div>

      <!-- floating zoom HUD -->
      <div class="zoom-hud">
        <button type="button" class="hud-btn" aria-label="Zoom out" @click="zoomBy(0.8)">−</button>
        <input
          :value="Math.round(store.printer.zoom)"
          type="number"
          class="hud-value"
          min="10"
          max="400"
          step="1"
          aria-label="Zoom percentage"
          @change="onZoomChange"
        />
        <span class="hud-pct">%</span>
        <button type="button" class="hud-btn" aria-label="Zoom in" @click="zoomBy(1.25)">+</button>
        <span class="hud-div" />
        <button type="button" class="hud-btn" @click="fit">Fit</button>
      </div>
    </div>

    <!-- status bar -->
    <div class="ws-status">
      <span><i>Size</i>{{ store.cheque.w }} × {{ store.cheque.h }} cm</span>
      <span><i>Position</i>{{ posChip }}</span>
      <span><i>Rotation</i>{{ store.printer.rot }}°</span>
      <span><i>Zoom</i>{{ Math.round(store.printer.zoom) }}%</span>
      <span><i>Guides</i>{{ store.guides.length }}</span>
      <span><i>Field</i>
        {{ selectedField ? `${selectedField.x.toFixed(2)}, ${selectedField.y.toFixed(2)} cm` : '—' }}
      </span>
      <span class="status-hint">Drag the cheque to position it on A4</span>
    </div>
  </div>
</template>

<style scoped>
.workspace-col {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.ws-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: 0 var(--space-md);
  height: 34px;
  flex-shrink: 0;
  background: var(--panel-bg);
  border-bottom: 1px solid var(--hairline);
  overflow: hidden;
}

.chip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: var(--text-xs);
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.chip-k {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-3);
}

.well-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}

.workspace {
  flex: 1;
  min-height: 0;
  overflow: auto; /* scrollbars appear when zoomed past the viewport */
  background: var(--canvas-bg);
  display: flex;
}

.zoom-frame {
  margin: auto; /* centres when smaller; collapses on overflow so all of it stays reachable */
  flex-shrink: 0;
  box-shadow: var(--shadow-paper);
}

.zoom-wrap {
  transform-origin: top left;
  flex-shrink: 0;
}

.a4-sheet {
  position: relative;
  background-color: #fff;
  background-image: radial-gradient(circle, #c9cdd4 0.8px, transparent 0.8px);
  background-size: 18.8976px 18.8976px;
}

.cheque-overlay {
  position: absolute;
  background: rgba(255, 255, 255, 0.97);
  border: 2px solid var(--color-primary);
  transform-origin: center center;
  cursor: move;
  z-index: 2;
}

.cheque-overlay.dragging {
  opacity: 0.92;
}

.ro-field {
  position: absolute;
  pointer-events: none;
  white-space: nowrap;
  color: #111;
  z-index: 2;
  /* Top-anchored column: Y = top edge of line 1; extra lines grow downward only */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.ro-text {
  display: inline-block;
  line-height: 1.3;
}

.handle {
  position: absolute;
  width: 9px;
  height: 9px;
  background: #fff;
  border: 2px solid var(--color-primary);
  border-radius: 2px;
  z-index: 3;
  pointer-events: none;
}

.handle.tl { left: -6px; top: -6px; }
.handle.tr { right: -6px; top: -6px; }
.handle.bl { left: -6px; bottom: -6px; }
.handle.br { right: -6px; bottom: -6px; }

/* Floating zoom HUD — lives above the well, not inside the scrolled content */
.zoom-hud {
  position: absolute;
  right: var(--space-lg);
  bottom: var(--space-lg);
  z-index: var(--z-hud);
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 3px;
  border-radius: var(--r);
  border: 1px solid var(--hairline);
  background: var(--toolbar-bg);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  box-shadow: var(--shadow-pop);
}

.hud-btn {
  height: 22px;
  min-width: 22px;
  padding: 0 6px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-sm);
  line-height: 1;
  cursor: default;
}

.hud-btn:hover {
  background: var(--tint-hover);
}

.hud-btn:active {
  background: var(--tint-pressed);
}

.hud-value {
  width: 38px;
  height: 22px;
  padding: 0 4px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.hud-value:focus {
  box-shadow: var(--focus-ring);
}

.hud-pct {
  font-size: 10px;
  color: var(--text-3);
  margin-right: 2px;
}

.hud-div {
  width: 1px;
  height: 14px;
  background: var(--hairline);
  margin: 0 3px;
}

.ws-status {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: 0 var(--space-md);
  height: var(--status-h);
  flex-shrink: 0;
  background: var(--panel-bg);
  border-top: 1px solid var(--hairline);
  font-family: var(--font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
}

.ws-status i {
  font-style: normal;
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-right: 5px;
}

.status-hint {
  margin-left: auto;
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Compact windows: the trailing read-outs are duplicated in the status bar, so
   drop them instead of clipping them mid-word. */
@media (max-width: 1080px) {
  .chip:nth-child(n + 4),
  .status-hint {
    display: none;
  }
}

@media (max-width: 940px) {
  .chip:nth-child(n + 3),
  .ws-status span:nth-child(n + 4) {
    display: none;
  }
}
</style>
