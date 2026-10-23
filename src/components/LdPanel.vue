<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Input, Button, PromptModal, Select, useToast } from '@/components/ui'
import Section from '@/components/ui/Section.vue'
import { usePrompt } from '@/hooks/usePrompt'
import {
  store, selectedField, addGuide, clearGuides, selectField, toggleFieldVisible,
  isBoxCapable, boxStripWidth, fieldText,
  saveLayout, resetLayout, deleteLayout, syncFormToFields,
  setReferenceImage, setReferenceOpacity, round2,
  applyLayout
} from '@/store'
import type { PersistedLayout } from '@/store'
import type { BoxSeparator } from '@/types/cheque'

const toast = useToast()

/* ----- canvas size ----- */
const sizeW = ref(store.cheque.w)
const sizeH = ref(store.cheque.h)
watch(() => [store.cheque.w, store.cheque.h], () => {
  sizeW.value = store.cheque.w
  sizeH.value = store.cheque.h
})

function applySize() {
  const w = parseFloat(String(sizeW.value))
  const h = parseFloat(String(sizeH.value))
  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
    toast.error('Enter valid width and height in cm')
    return
  }
  store.cheque.w = round2(w)
  store.cheque.h = round2(h)
  toast.success(`Canvas set to ${store.cheque.w} × ${store.cheque.h} cm`)
}

/* ----- reference image ----- */
function onPickImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const ok = setReferenceImage(String(reader.result))
    if (ok) toast.success('Reference image added (never printed)')
    else toast.warning('Image loaded but too large to persist across reloads')
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeImage() {
  setReferenceImage(null)
  toast.info('Reference image removed')
}

const opacityModel = computed({
  get: () => store.refOpacity,
  set: (v: number) => setReferenceOpacity(v)
})

/* ----- field positioning ----- */
function toggleMode() {
  store.editMode = !store.editMode
}

const fontFamilies = [
  { value: "'Courier New', Courier, monospace", label: 'Courier New (Monospace)' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
  { value: "'Lucida Console', Monaco, monospace", label: 'Lucida Console' },
  { value: "'Consolas', monospace", label: 'Consolas' },
  { value: "'Segoe UI', sans-serif", label: 'Segoe UI' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' }
]
const fontWeights = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold' },
  { value: '900', label: 'Extra Bold' }
]

function onListRow(id: string) {
  selectField(id)
  if (!store.editMode) store.editMode = true // highlights the selection on canvas
}

function setFieldX(v: string | number) {
  const f = selectedField.value
  if (f) f.x = round2(Number(v) || 0)
}

function setFieldY(v: string | number) {
  const f = selectedField.value
  if (f) f.y = round2(Number(v) || 0)
}

function setFieldFontSize(v: string | number) {
  const f = selectedField.value
  if (f) f.fontSize = Number(v) || 14
}

function setFieldFamily(v: string) {
  const f = selectedField.value
  if (f) f.fontFamily = v
}

function setFieldWeight(v: string) {
  const f = selectedField.value
  if (f) f.fontWeight = v
}

function setFieldLineH(v: string | number) {
  const f = selectedField.value
  if (!f) return
  const n = Number(v)
  if (isFinite(n) && n > 0) f.lineH = Math.min(3, Math.max(0.5, Math.round(n * 100) / 100))
  else f.lineH = undefined // blank → default 1.3
}

function setFieldW(v: string | number) {
  const f = selectedField.value
  if (!f) return
  const n = Number(v)
  f.w = isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined
}

function setFieldH(v: string | number) {
  const f = selectedField.value
  if (!f) return
  const n = Number(v)
  f.h = isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined
}

/* ----- digit box controls (selected field) ----- */
const sepOptions = [
  { value: 'none', label: 'None — continuous strip' },
  { value: 'slash', label: 'Slash — / between groups' },
  { value: 'gap', label: 'Gap — blank space between groups' }
]

function num(v: string | number): number | null {
  const n = Number(v)
  return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null
}

function setBoxOn(v: boolean) {
  const b = selectedField.value?.box
  if (b) b.on = v
}

function setCellW(v: string | number) {
  const b = selectedField.value?.box
  const n = num(v)
  if (b && n !== null) b.cellW = n
}

function setCellH(v: string | number) {
  const b = selectedField.value?.box
  const n = num(v)
  if (b && n !== null) b.cellH = n
}

function setSep(v: string) {
  const b = selectedField.value?.box
  if (b) b.sep = v as BoxSeparator
}

function setGap(v: string | number) {
  const b = selectedField.value?.box
  const n = num(v)
  if (b && n !== null) b.gap = n
}

function setOutlines(v: boolean) {
  const b = selectedField.value?.box
  if (b) b.outlines = v
}

function boxDigitCount(): number {
  const f = selectedField.value
  return f ? fieldText(f).replace(/\D/g, '').length : 0
}

/* ----- crossing rotation ----- */
const rotModel = computed({
  get: () => store.payeeRot,
  set: (v: number) => { store.payeeRot = Math.max(-45, Math.min(45, isNaN(v) ? 0 : v)) }
})

function setRotInput(v: string | number) {
  const n = Number(v)
  store.payeeRot = isNaN(n) ? 0 : Math.max(-45, Math.min(45, n))
}

function setCrossLines(v: boolean) {
  store.crossLines = v
}

function setCrossLineW(v: string | number) {
  const n = Number(v)
  if (isFinite(n) && n > 0) store.crossLineW = Math.min(10, Math.max(0.5, Math.round(n * 10) / 10))
  else store.crossLineW = 2
}

/* ----- saved layouts ----- */
const { visible: promptVisible, config: promptConfig, prompt: promptLayout, confirm: confirmPrompt, cancel: cancelPrompt } = usePrompt()

async function saveCurrentLayout() {
  const name = await promptLayout({
    title: 'Save Layout',
    message: 'Enter a name for this layout:',
    defaultValue: store.layoutSelect || 'My layout',
    placeholder: 'e.g. My Bank Layout'
  })
  if (!name || !name.trim()) return
  saveLayout(name.trim())
  toast.success(`Layout "${name.trim()}" saved`)
}

function selectSavedLayout(name: string) {
  const entry = store.layouts[name]
  if (entry) {
    applyLayout(entry as PersistedLayout)
    syncFormToFields()
    store.layoutSelect = name
    toast.success(`Layout "${name}" loaded`)
  }
}

function resetCurrentLayout() {
  resetLayout()
  sizeW.value = store.cheque.w
  sizeH.value = store.cheque.h
  toast.info('Layout reset to defaults')
}

function deleteCurrentLayout() {
  const name = store.layoutSelect
  if (!name) { toast.warning('Select a layout to delete'); return }
  deleteLayout(name)
  toast.info(`Layout "${name}" deleted`)
}

function loadDefaultLayout() {
  resetLayout()
  sizeW.value = store.cheque.w
  sizeH.value = store.cheque.h
  toast.info('Layout reset to defaults')
}
</script>

<template>
  <div class="panel-sections">
    <!-- 1. Canvas Size -->
    <Section title="Canvas Size" :default-open="false">
      <div class="row-2">
        <Input v-model="sizeW" type="number" label="Width (cm)" :min="1" :max="50" :step="0.1" />
        <Input v-model="sizeH" type="number" label="Height (cm)" :min="1" :max="50" :step="0.1" />
      </div>        <Button variant="primary" size="sm" class="full-width" @click="applySize">Apply</Button>
    </Section>

    <!-- 2. Reference Image -->
    <Section title="Reference Image" :default-open="false">
      <div class="ref-row">
        <label class="file-btn">
          {{ store.refImg ? 'Replace…' : 'Add image…' }}
          <input type="file" accept="image/*" class="hidden-input" @change="onPickImage" />
        </label>
        <Button v-if="store.refImg" variant="danger" size="sm" @click="removeImage">Remove</Button>
      </div>
      <label class="mini-label">Opacity — {{ Math.round(store.refOpacity * 100) }}%</label>
      <input
        v-model.number="opacityModel"
        type="range"
        class="full-slider"
        min="0.05"
        max="1"
        step="0.05"
        :disabled="!store.refImg"
      />
      <p class="note">The reference image is a tracing aid only — it is never printed.</p>
    </Section>

    <!-- 3. Alignment Guides -->
    <Section title="Alignment Guides" :default-open="false">
      <div class="row-3">
        <Button size="sm" @click="addGuide('h')">+ Horizontal</Button>
        <Button size="sm" @click="addGuide('v')">+ Vertical</Button>
        <Button size="sm" @click="clearGuides">Clear all</Button>
      </div>
      <p class="note">Drag guides on the canvas; double-click a guide to remove it.</p>
      <p class="note" v-if="store.guides.length">{{ store.guides.length }} guide(s) active</p>
    </Section>

    <!-- 4. Field Positioning -->
    <Section title="Field Positioning" :default-open="false">
      <div class="mode-row">
        <div>
          <span class="mini-label">Edit Fields</span>
          <span class="mode-badge" :class="{ on: store.editMode }">
            {{ store.editMode ? 'Edit' : 'View' }}
          </span>
        </div>
        <Button :variant="store.editMode ? 'outline' : 'primary'" size="sm" @click="toggleMode">
          {{ store.editMode ? 'Switch to View' : 'Switch to Edit' }}
        </Button>
      </div>

      <p class="mini-label">Fields — tick to show on canvas</p>
      <ul class="field-list">
        <li
          v-for="f in store.fields"
          :key="f.id"
          :class="{ active: store.selectedFieldId === f.id, hidden: f.visible === false }"
          @click="onListRow(f.id)"
        >
          <label class="vis-toggle" title="Show / hide this field" @click.stop>
            <input
              type="checkbox"
              :checked="f.visible !== false"
              @change="toggleFieldVisible(f.id)"
            />
          </label>
          <span class="fl-label">{{ f.label }}</span>
          <span class="fl-coords">{{ f.x.toFixed(2) }} / {{ f.y.toFixed(2) }}</span>
        </li>
      </ul>

      <div v-if="selectedField" class="field-props">        <div class="row-2">
          <Input
            :model-value="selectedField.x"
            type="number"
            label="X (cm)"
            :step="0.1"
            @update:model-value="setFieldX"
          />
          <Input
            :model-value="selectedField.y"
            type="number"
            label="Y (cm)"
            :step="0.1"
            @update:model-value="setFieldY"
          />
        </div>
        <div class="row-2">
          <Input
            :model-value="selectedField.w ?? ''"
            type="number"
            label="Cell width (cm)"
            placeholder="auto"
            :min="0.5"
            :step="0.1"
            @update:model-value="setFieldW"
          />
          <Input
            :model-value="selectedField.h ?? ''"
            type="number"
            label="Cell height (cm)"
            placeholder="auto"
            :min="0.3"
            :step="0.1"
            @update:model-value="setFieldH"
          />
        </div>
        <p class="note">
          Width wraps the field into a multi-line cell (blank = one line);
          height fixes the cell box (blank = auto).
        </p>
      <Input
        :model-value="selectedField.fontSize"
        type="number"
        label="Font size (px)"
        :min="6"
        :max="72"
        @update:model-value="setFieldFontSize"
      />
      <Select
        :model-value="selectedField.fontFamily"
        :options="fontFamilies"
        label="Font family"
        @update:model-value="setFieldFamily"
      />
      <Select
        :model-value="selectedField.fontWeight"
        :options="fontWeights"
        label="Font weight"
        @update:model-value="setFieldWeight"
      />
      <Input
        :model-value="selectedField.lineH ?? ''"
        type="number"
        label="Line spacing (×)"
        placeholder="1.3"
        :min="0.5"
        :max="3"
        :step="0.05"
        @update:model-value="setFieldLineH"
      />
      <p class="note">
        Vertical gap between wrapped lines — e.g. 1.5 adds 50% more space.
        Applies to multi-line fields (blank = 1.3).
      </p>
      </div>
      <p v-else class="note">Select a field in the list or on the canvas to edit it.</p>

      <!-- Digit box rendering (date, cheque number, MICR, amount in figures) -->
      <div
        v-if="selectedField && isBoxCapable(selectedField) && selectedField.box"
        class="box-controls"
      >
        <label class="box-toggle">
          <input
            type="checkbox"
            :checked="selectedField.box.on"
            @change="setBoxOn(($event.target as HTMLInputElement).checked)"
          />
          <span>Box mode — one digit per cell</span>
        </label>

        <template v-if="selectedField.box.on">
          <div class="row-2">
            <Input
              :model-value="selectedField.box.cellW"
              type="number"
              label="Cell width (mm)"
              :min="1"
              :max="20"
              :step="0.1"
              @update:model-value="setCellW"
            />
            <Input
              :model-value="selectedField.box.cellH"
              type="number"
              label="Cell height (mm)"
              :min="1"
              :max="20"
              :step="0.1"
              @update:model-value="setCellH"
            />
          </div>

          <Select
            :model-value="selectedField.box.sep"
            :options="sepOptions"
            label="Group separator"
            @update:model-value="setSep"
          />

          <Input
            v-if="selectedField.box.sep === 'gap'"
            :model-value="selectedField.box.gap"
            type="number"
            label="Group gap (mm)"
            :min="0.1"
            :max="10"
            :step="0.1"
            @update:model-value="setGap"
          />

          <label class="box-toggle">
            <input
              type="checkbox"
              :checked="selectedField.box.outlines"
              @change="setOutlines(($event.target as HTMLInputElement).checked)"
            />
            <span>Box outlines</span>
          </label>

          <p class="note">
            Total width: <b>{{ boxStripWidth(selectedField) }} mm</b>
            — {{ boxDigitCount() }} cells × {{ selectedField.box.cellW }} mm
            <template v-if="selectedField.box.sep !== 'none' && boxDigitCount() === 8">
              + separators
            </template>
          </p>
        </template>
      </div>
    </Section>

    <!-- 5. A/C Payee Crossing Rotation -->
    <Section title="A/C Payee Crossing Rotation" :default-open="false">
      <input v-model.number="rotModel" type="range" class="full-slider" min="-45" max="45" step="1" />
      <div class="row-2">
        <Input :model-value="store.payeeRot" type="number" label="Degrees (−45 to +45)" :min="-45" :max="45" :step="1" @update:model-value="setRotInput" />
        <div class="rot-readout">
          <span class="mini-label">Current</span>
          <b>{{ store.payeeRot }}°</b>
        </div>
      </div>

      <label class="box-toggle">
        <input
          type="checkbox"
          :checked="store.crossLines"
          @change="setCrossLines(($event.target as HTMLInputElement).checked)"
        />
        <span>Two lines on print (above &amp; below text)</span>
      </label>

      <Input
        v-if="store.crossLines"
        :model-value="store.crossLineW"
        type="number"
        label="Line thickness (px)"
        :min="0.5"
        :max="10"
        :step="0.5"
        @update:model-value="setCrossLineW"
      />
    </Section>

    <!-- 6. Saved Layouts -->
    <Section title="Bank Layouts" :default-open="false">
      <Button size="sm" class="load-btn" @click="loadDefaultLayout">Default layout</Button>
      <div v-for="name in Object.keys(store.layouts)" :key="name" class="saved-item" :class="{ active: store.layoutSelect === name }" @click="selectSavedLayout(name)">
        {{ name }}
      </div>
      <div class="row-3">
        <Button variant="primary" size="sm" @click="saveCurrentLayout">Save layout</Button>
        <Button size="sm" @click="resetCurrentLayout">Reset</Button>
        <Button variant="danger" size="sm" @click="deleteCurrentLayout">Delete</Button>
      </div>
    </Section>

    <PromptModal
      v-model="promptVisible"
      :title="promptConfig.title"
      :message="promptConfig.message"
      :default-value="promptConfig.defaultValue"
      :placeholder="promptConfig.placeholder"
      @confirm="confirmPrompt"
      @cancel="cancelPrompt"
    />
  </div>
</template>

<style scoped>
.panel-sections {
  display: flex;
  flex-direction: column;
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.row-2 :deep(.form-group),
.row-3 :deep(.form-group) {
  margin-bottom: 0;
}

.row-3 {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.row-3 .btn {
  flex: 1;
  min-width: 84px;
}

.mini-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 4px;
}

.full-slider {
  width: 100%;
  accent-color: var(--color-primary);
}

.note {
  font-size: var(--text-xs);
  color: var(--text-3);
  margin: 0;
  line-height: 1.45;
}

.ref-row {
  display: flex;
  gap: var(--space-sm);
}

.file-btn {
  flex: 1;
  text-align: center;
  cursor: default;
  height: 28px;
  padding: 0 var(--space-md);
  border: 1px solid var(--hairline-2);
  border-radius: var(--r);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  font-size: var(--text-md);
  font-weight: 500;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.file-btn:hover {
  background: var(--tint-hover);
}

.file-btn:active {
  background: var(--tint-pressed);
}

.load-btn {
  width: 100%;
  margin-bottom: var(--space-sm);
}

.saved-item {
  padding: 5px 8px;
  border-radius: var(--r);
  margin-bottom: 2px;
  cursor: default;
  font-size: var(--text-md);
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.saved-item:hover {
  background: var(--tint-hover);
}

.saved-item.active {
  background: var(--accent-tint);
  color: var(--accent);
  font-weight: 600;
}

.full-width {
  width: 100%;
}

.hidden-input {
  display: none;
}

.mode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.mode-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: var(--text-xs);
  font-weight: 700;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}

.mode-badge.on {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.field-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--hairline);
  border-radius: var(--r);
  background: var(--surface);
  max-height: 190px;
  overflow-y: auto;
}

.field-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-sm);
  padding: 5px 8px;
  font-size: var(--text-md);
  cursor: default;
  border-bottom: 1px solid var(--hairline);
}

.field-list li:last-child {
  border-bottom: none;
}

.field-list li:hover {
  background: var(--tint-hover);
}

.field-list li.active {
  background: var(--accent-tint);
  color: var(--accent);
}

.fl-label {
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.field-list li.hidden .fl-label,
.field-list li.hidden .fl-coords {
  color: var(--text-3);
  text-decoration: line-through;
}

.vis-toggle {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: 2px;
  cursor: pointer;
}

.vis-toggle input {
  width: 14px;
  height: 14px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.fl-coords {
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.field-props {
  border-top: 1px solid var(--hairline);
  padding-top: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.field-props :deep(.form-group) {
  margin-bottom: 0;
}

.rot-readout {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.rot-readout b {
  font-size: var(--text-md);
  font-variant-numeric: tabular-nums;
  color: var(--text);
  line-height: 28px;
}

.box-controls {
  border-top: 1px solid var(--hairline);
  padding-top: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.box-controls :deep(.form-group) {
  margin-bottom: 0;
}

.box-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
}

.box-toggle input {
  width: 15px;
  height: 15px;
  accent-color: var(--color-primary);
  cursor: pointer;
}
</style>
