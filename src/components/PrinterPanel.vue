<script setup lang="ts">
import { computed } from 'vue'
import { Input, Button, Segmented, PromptModal, useToast } from '@/components/ui'
import Section from '@/components/ui/Section.vue'
import { usePrompt } from '@/hooks/usePrompt'
import {
  store, alignCheque, movePrinterXY, round2, requestFit,
  saveProfile, resetProfile, deleteProfile, applyProfile, type PersistedProfile
} from '@/store'

const toast = useToast()

/* ----- zoom ----- */
const zoomModel = computed({
  get: () => store.printer.zoom,
  set: (v: number) => { store.printer.zoom = v }
})

/* ----- rotation ----- */
const rotModel = computed({
  get: () => store.printer.rot,
  set: (v: number) => {
    const n = Number(v)
    if (isNaN(n)) return
    store.printer.rot = ((Math.round(n) % 360) + 360) % 360
  }
})

const rotationPresets = [
  { value: 0, label: '0°' },
  { value: 90, label: '90°' },
  { value: 180, label: '180°' },
  { value: 270, label: '270°' }
]

function setPreset(v: string | number) {
  const n = Number(v)
  if (isNaN(n)) return
  store.printer.rot = ((Math.round(n) % 360) + 360) % 360
}

function setRotInput(v: string | number) {
  const n = Number(v)
  if (isNaN(n)) return
  store.printer.rot = ((Math.round(n) % 360) + 360) % 360
}

function fitWorkspace() {
  requestFit()
}

function onZoomChange(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (isFinite(v)) store.printer.zoom = Math.round(Math.min(400, Math.max(10, v)))
}

/* ----- position ----- */
const posX = computed({
  get: () => store.printer.x,
  set: (v: number) => movePrinterXY(round2(Number(v) || 0), store.printer.y)
})
const posY = computed({
  get: () => store.printer.y,
  set: (v: number) => movePrinterXY(store.printer.x, round2(Number(v) || 0))
})

function applyPosition() {
  toast.success(`Position set to ${store.printer.x.toFixed(2)}, ${store.printer.y.toFixed(2)} cm`)
}

/* ----- saved profiles ----- */
const { visible: promptVisible, config: promptConfig, prompt: promptProfile, confirm: confirmPrompt, cancel: cancelPrompt } = usePrompt()

async function saveCurrentProfile() {
  const name = await promptProfile({
    title: 'Save Printer Profile',
    message: 'Enter a name for this printer profile:',
    defaultValue: store.profileSelect || 'My profile',
    placeholder: 'e.g. Standard Bank Layout'
  })
  if (!name || !name.trim()) return
  saveProfile(name.trim())
  toast.success(`Profile "${name.trim()}" saved`)
}

function selectSavedProfile(name: string) {
  const entry = store.profiles[name]
  if (entry) {
    applyProfile(entry as PersistedProfile)
    store.profileSelect = name
    toast.success(`Profile "${name}" loaded`)
  }
}

function resetCurrentProfile() {
  resetProfile()
  toast.info('Profile reset to defaults')
}

function deleteCurrentProfile() {
  const name = store.profileSelect
  if (!name) { toast.warning('Select a profile to delete'); return }
  deleteProfile(name)
  toast.info(`Profile "${name}" deleted`)
}

function loadDefaultProfile() {
  resetProfile()
  toast.info('Profile reset to defaults')
}
</script>

<template>
  <div class="panel-sections">
    <!-- 1. Zoom Preview -->
    <Section title="Zoom Preview" :default-open="false">
      <input v-model.number="zoomModel" type="range" class="full-slider" min="10" max="400" step="5" />
      <div class="zoom-row">
        <span class="zoom-typed">
          <input
            :value="Math.round(store.printer.zoom)"
            type="number"
            class="zoom-input"
            min="10"
            max="400"
            step="1"
            aria-label="Zoom percentage"
            @change="onZoomChange"
          />
          <span class="zoom-pct">%</span>
        </span>
        <Button size="sm" @click="fitWorkspace">Fit</Button>
      </div>
      <p class="note">Type a percentage or slide — scales the A4 sheet in the workspace.</p>
    </Section>

    <!-- 2. Cheque Rotation -->
    <Section title="Cheque Rotation" :default-open="false">
      <Segmented
        :model-value="store.printer.rot"
        :items="rotationPresets"
        @update:model-value="setPreset"
      />
      <input v-model.number="rotModel" type="range" class="full-slider" min="0" max="359" step="1" />
      <Input
        :model-value="store.printer.rot"
        type="number"
        label="Degrees (0–359)"
        :min="0"
        :max="359"
        :step="1"
        @update:model-value="setRotInput"
      />
    </Section>

    <!-- 3. Position on paper -->
    <Section title="Position on paper" :default-open="false">
      <div class="row-2">
        <Input v-model="posX" type="number" label="X — cm from left" :step="0.1" />
        <Input v-model="posY" type="number" label="Y — cm from top" :step="0.1" />
      </div>
      <Button variant="primary" size="sm" class="full-width" @click="applyPosition">
        Apply position
      </Button>
      <p class="note">Two-way synced: drag the cheque on the sheet to update these values.</p>
    </Section>

    <!-- 4. Quick Alignment -->
    <Section title="Quick Alignment" :default-open="false">
      <div class="align-grid">
        <Button size="sm" @click="alignCheque('center')">Center</Button>
        <Button size="sm" @click="alignCheque('top')">Top</Button>
        <Button size="sm" @click="alignCheque('bottom')">Bottom</Button>
        <Button size="sm" @click="alignCheque('left')">Left</Button>
        <Button size="sm" @click="alignCheque('right')">Right</Button>
      </div>
    </Section>

    <!-- 5. Saved Profiles -->
    <Section title="Printer Profiles" :default-open="false">
      <Button size="sm" class="load-btn" @click="loadDefaultProfile">Default profile</Button>
      <div v-for="name in Object.keys(store.profiles)" :key="name" class="saved-item" :class="{ active: store.profileSelect === name }" @click="selectSavedProfile(name)">
        {{ name }}
      </div>
      <div class="row-3">
        <Button variant="primary" size="sm" @click="saveCurrentProfile">Save profile</Button>
        <Button size="sm" @click="resetCurrentProfile">Reset</Button>
        <Button variant="danger" size="sm" @click="deleteCurrentProfile">Delete</Button>
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

.row-2 :deep(.form-group) {
  margin-bottom: 0;
}

.row-3 {
  display: flex;
  gap: var(--space-sm);
}

.row-3 > * {
  flex: 1;
}

.full-slider {
  width: 100%;
  accent-color: var(--color-primary);
}

.note {
  font-size: var(--text-xs);
  color: var(--color-text-light);
  margin: 0;
  line-height: 1.5;
}

.full-width {
  width: 100%;
}

.zoom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.zoom-typed {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.zoom-input {
  width: 64px;
  height: 28px;
  padding: 0 8px;
  font-size: var(--text-md);
  font-variant-numeric: tabular-nums;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--hairline-2);
  border-radius: var(--r);
  outline: none;
}

.zoom-input:focus {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}

.zoom-pct {
  font-size: var(--text-md);
  color: var(--text-2);
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

.align-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}
</style>
