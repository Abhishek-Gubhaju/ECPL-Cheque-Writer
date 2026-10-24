<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { store, selectedField, fitZoom, nudgeField, selectField, clamp, PX_PER_CM } from '@/store'
import ChequeCanvas from './ChequeCanvas.vue'

const wsEl = ref<HTMLElement | null>(null)

const selectedLabel = computed(() => selectedField.value?.label || 'None')
const selPos = computed(() =>
  selectedField.value
    ? `${selectedField.value.x.toFixed(2)} / ${selectedField.value.y.toFixed(2)} cm`
    : '—'
)

const canvasSizeChip = computed(() => `${store.cheque.w} × ${store.cheque.h} cm`)
const modeChip = computed(() => (store.editMode ? 'Edit' : 'View'))

const baseW = computed(() => store.cheque.w * PX_PER_CM)
const baseH = computed(() => store.cheque.h * PX_PER_CM)

/** Layout box = scaled size so scrollbars cover the full visual area. */
const frameStyle = computed(() => ({
  width: `${baseW.value * (store.ldZoom / 100)}px`,
  height: `${baseH.value * (store.ldZoom / 100)}px`
}))

const wrapStyle = computed(() => ({
  width: `${baseW.value}px`,
  height: `${baseH.value}px`,
  transform: `scale(${store.ldZoom / 100})`,
  transformOrigin: 'top left'
}))

/** The zoom this panel last chose by fitting, so "user zoomed" is detectable. */
let lastFit = 0

function fit() {
  if (!wsEl.value) return
  lastFit = fitZoom(store.cheque.w, store.cheque.h, wsEl.value.clientWidth, wsEl.value.clientHeight, 64)
  store.ldZoom = lastFit
}

/**
 * Re-fit as the window grows or shrinks.
 *
 * Skips the update once the zoom no longer matches the fitted value, so a
 * manual zoom (HUD, menu, keyboard) is never yanked away by a resize; the
 * Fit button puts the panel back into step.
 */
function refitOnResize() {
  if (!wsEl.value) return
  if (Math.abs(store.ldZoom - lastFit) > 0.5) return
  const z = fitZoom(store.cheque.w, store.cheque.h, wsEl.value.clientWidth, wsEl.value.clientHeight, 64)
  if (z === lastFit) return
  lastFit = z
  store.ldZoom = z
}

let resizeObserver: ResizeObserver | null = null

/** Fit when opened: once on the next frame, again after layout settles */
function fitOnOpen() {
  requestAnimationFrame(() => {
    fit()
    setTimeout(fit, 120)
  })
}

// panels ask for a fit by incrementing store.fitRequest
watch(() => store.fitRequest, () => fit())

function setZoom(value: number) {
  store.ldZoom = Math.round(clamp(value, 10, 400))
}

function zoomBy(factor: number) {
  setZoom(store.ldZoom * factor)
}

function onZoomChange(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (isFinite(v)) setZoom(v)
}

/* ----- arrow-key nudge: 1 mm coarse, ⌥ for 0.1 mm, ⇧ for 5 mm ----- */
function onKey(e: KeyboardEvent) {
  if (!store.editMode || !store.selectedFieldId) return
  const target = e.target as HTMLElement
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

  const step = e.altKey ? 0.01 : e.shiftKey ? 0.5 : 0.1
  const id = store.selectedFieldId
  let handled = true
  switch (e.key) {
    case 'ArrowLeft': nudgeField(id, -step, 0); break
    case 'ArrowRight': nudgeField(id, step, 0); break
    case 'ArrowUp': nudgeField(id, 0, -step); break
    case 'ArrowDown': nudgeField(id, 0, step); break
    case 'Escape': selectField(null); break
    default: handled = false
  }
  if (handled) e.preventDefault()
}

// the cheque's own size can change too — refit when it does
watch(() => [store.cheque.w, store.cheque.h], refitOnResize)

onMounted(() => {
  window.addEventListener('keydown', onKey)
  fitOnOpen()
  resizeObserver = new ResizeObserver(refitOnResize)
  if (wsEl.value) resizeObserver.observe(wsEl.value)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div class="workspace-col">
    <!-- toolbar: quiet read-outs, no boxed chips -->
    <div class="ws-toolbar">
      <span class="chip"><span class="chip-k">Size</span>{{ canvasSizeChip }}</span>
      <span class="chip"><span class="chip-k">Mode</span>
        <b :class="store.editMode ? 'mode-edit' : 'mode-view'">{{ modeChip }}</b>
      </span>
      <span class="chip"><span class="chip-k">Selection</span>{{ selectedLabel }}</span>
      <span class="chip"><span class="chip-k">Position</span>{{ selPos }}</span>
      <span class="chip"><span class="chip-k">Crossing</span>{{ store.payeeRot }}°</span>
    </div>

    <!-- workspace -->
    <div class="well-wrap">
      <div ref="wsEl" class="workspace" @click.self="selectField(null)">
        <div class="zoom-frame" :style="frameStyle">
          <div class="zoom-wrap" :style="wrapStyle">
            <ChequeCanvas :zoom="store.ldZoom" />
          </div>
        </div>
      </div>

      <!-- floating zoom HUD -->
      <div class="zoom-hud">
        <button type="button" class="hud-btn" aria-label="Zoom out" @click="zoomBy(0.8)">−</button>
        <input
          :value="Math.round(store.ldZoom)"
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
      <span><i>Size</i>{{ canvasSizeChip }}</span>
      <span><i>Position</i>{{ selPos }}</span>
      <span><i>Rotation</i>{{ store.payeeRot }}°</span>
      <span><i>Zoom</i>{{ Math.round(store.ldZoom) }}%</span>
      <span><i>Guides</i>{{ store.guides.length }}</span>
      <span><i>Field</i>
        {{ selectedField ? `${selectedField.x.toFixed(2)}, ${selectedField.y.toFixed(2)} cm` : '—' }}
      </span>
      <span class="status-hint">↑↓←→ 1 mm · ⌥ 0.1 mm · ⇧ 5 mm · Double-click a field to edit</span>
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

.mode-edit { color: var(--accent); font-weight: 600; }
.mode-view { color: var(--text-2); font-weight: 600; }

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
