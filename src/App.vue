<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import {
  store, chequeData, toLegacyLayout, loadFromStorage,
  applyLayout, syncFormToFields, resetLayout,
  applyProfile, resetProfile, setLastLayout, setLastProfile,
  saveLayout, saveProfile, requestFit
} from '@/store'
import type { ChequeLayout, PrinterProfile } from '@/types/cheque'
import type { PersistedLayout, PersistedProfile } from '@/store'
import PrintPreview from '@/components/PrintPreview.vue'
import LdPanel from '@/components/LdPanel.vue'
import PrinterPanel from '@/components/PrinterPanel.vue'
import EditorWorkspace from '@/components/EditorWorkspace.vue'
import PrinterWorkspace from '@/components/PrinterWorkspace.vue'
import { Button, Checkbox, Input, Select, Toast, Icon, PromptModal, useToast } from '@/components/ui'
import { usePrompt } from '@/hooks/usePrompt'
import appIcon from '../src-tauri/icons/app-icon.svg'

const toast = useToast()

/** Sidebar navigation — the three workspaces of the app. */
const sections = [
  { id: 'data-entry', label: 'Data Entry', icon: 'file-text' },
  { id: 'layout-designer', label: 'Cheque Canvas', icon: 'layout' },
  { id: 'printer-settings', label: 'Printer Settings', icon: 'printer' }
] as const

const activeSection = ref<string>('data-entry')
const printing = ref(false)

/** The sidebar starts hidden; show it with the toolbar's ⋯ button (⌥⌘S). */
const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
  // The workspace is wider now — refit the paper, like a real canvas would.
  void nextTick(async () => {
    // Wait for the window to take its new width before the paper refits,
    // otherwise the canvas measures the old viewport.
    await resizeForSidebar(sidebarOpen.value)
    requestFit()
  })
}

/** The window is fitted to the form, so give the sidebar its own width back. */
async function resizeForSidebar(opening: boolean) {
  if (!('__TAURI_INTERNALS__' in window)) return
  const sidebarW = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w')
  )
  if (!sidebarW) return
  try {
    const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window')
    const win = getCurrentWindow()
    const factor = (await win.scaleFactor()) || 1
    const size = await win.innerSize()
    const width = size.width / factor + (opening ? sidebarW : -sidebarW)
    await win.setSize(new LogicalSize(Math.round(width), Math.round(size.height / factor)))
  } catch {
    /* running outside a Tauri window — nothing to resize */
  }
}

/** Layout/profile snapshot handed to the printer. */
const printLayout = computed(() => toLegacyLayout() as ChequeLayout)
const printProfile = computed(
  () => ({ x: store.printer.x, y: store.printer.y, rotation: store.printer.rot }) as PrinterProfile
)

/** Dropdown options for the saved bank layouts. */
const layoutOptions = computed(() => {
  const opts = [{ value: '', label: '— Default —' }]
  for (const name of Object.keys(store.layouts)) {
    opts.push({ value: name, label: name })
  }
  return opts
})

/** Dropdown options for the saved printer profiles. */
const profileOptions = computed(() => {
  const opts = [{ value: '', label: '— Default —' }]
  for (const name of Object.keys(store.profiles)) {
    opts.push({ value: name, label: name })
  }
  return opts
})

const layoutNames = computed(() => Object.keys(store.layouts))
const profileNames = computed(() => Object.keys(store.profiles))

/** Print cheque: show the confirm dialog (shows the cheque preview). */
function doPrint() {
  if (store.editMode) store.editMode = false
  printing.value = true
}

function onPrintDone() {
  printing.value = false
}

/** ⌘P / Ctrl+P does exactly what the toolbar's Print button does. */
function onShortcut(e: KeyboardEvent) {
  if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
  if (e.key.toLowerCase() !== 'p') return
  e.preventDefault() // stop the browser/webview's own print dialog
  if (!printing.value) doPrint()
}

/** Size the window around the form on open — a 3px margin, nothing more. */
async function fitWindowToContent() {
  if (!('__TAURI_INTERNALS__' in window)) return
  await nextTick()
  await new Promise<void>(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  const card = document.querySelector<HTMLElement>('.pane-data .form-card')
  const titlebar = document.querySelector<HTMLElement>('.titlebar')
  if (!card || !titlebar) return
  const pane = document.querySelector<HTMLElement>('.pane-data')
  if (!pane) return
  const pad = getComputedStyle(pane)
  const box = card.getBoundingClientRect()
  const width = Math.ceil(box.width + parseFloat(pad.paddingLeft) + parseFloat(pad.paddingRight))
  const height = Math.ceil(
    titlebar.getBoundingClientRect().height +
      parseFloat(pad.paddingTop) +
      box.height +
      parseFloat(pad.paddingBottom)
  )
  try {
    const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window')
    await getCurrentWindow().setSize(new LogicalSize(width, height))
  } catch {
    /* running outside a Tauri window — nothing to resize */
  }
}

/** Select a saved bank layout; applies it live, re-syncs the form, and persists. */
function selectLayout(name: string) {
  setLastLayout(name)
  if (name && store.layouts[name]) {
    applyLayout(store.layouts[name] as PersistedLayout)
    syncFormToFields()
  } else {
    resetLayout()
  }
}

/** Select a saved printer profile; applies it live and persists. */
function selectProfile(name: string) {
  setLastProfile(name)
  if (name && store.profiles[name]) {
    applyProfile(store.profiles[name] as PersistedProfile)
  } else {
    resetProfile()
  }
}

/* --------------------------------------------------------------------------
   Native menu bar commands (Tauri menu -> "ecpl://menu" events)
   -------------------------------------------------------------------------- */

const { visible: promptVisible, config: promptConfig, prompt, confirm, cancel } = usePrompt()

async function saveCurrentLayout() {
  const name = await prompt({
    title: 'Save Layout',
    message: 'Enter a name for this layout:',
    defaultValue: store.layoutSelect || 'My layout',
    placeholder: 'e.g. My Bank Layout'
  })
  if (!name || !name.trim()) return
  saveLayout(name.trim())
  toast.success(`Layout "${name.trim()}" saved`)
}

async function saveCurrentProfile() {
  const name = await prompt({
    title: 'Save Printer Profile',
    message: 'Enter a name for this printer profile:',
    defaultValue: store.profileSelect || 'My profile',
    placeholder: 'e.g. Standard Bank Layout'
  })
  if (!name || !name.trim()) return
  saveProfile(name.trim())
  toast.success(`Profile "${name.trim()}" saved`)
}

/** Which zoom value the current workspace is showing. */
function activeZoom(): number {
  return activeSection.value === 'layout-designer' ? store.ldZoom : store.printer.zoom
}

function setActiveZoom(value: number) {
  const clamped = Math.round(Math.min(400, Math.max(10, value)))
  if (activeSection.value === 'layout-designer') store.ldZoom = clamped
  else store.printer.zoom = clamped
}

function zoomBy(factor: number) {
  setActiveZoom(activeZoom() * factor)
}

function handleMenu(id: string) {
  switch (id) {
    case 'print':
      doPrint()
      break
    case 'save-layout':
      void saveCurrentLayout()
      break
    case 'save-profile':
      void saveCurrentProfile()
      break
    case 'view-data':
      activeSection.value = 'data-entry'
      break
    case 'view-canvas':
      activeSection.value = 'layout-designer'
      break
    case 'view-printer':
      activeSection.value = 'printer-settings'
      break
    case 'toggle-sidebar':
      toggleSidebar()
      break
    case 'zoom-in':
      zoomBy(1.25)
      break
    case 'zoom-out':
      zoomBy(0.8)
      break
    case 'zoom-reset':
      setActiveZoom(100)
      break
    case 'zoom-fit':
      requestFit()
      break
    default:
      break
  }
}

let unlistenMenu: UnlistenFn | null = null

onMounted(async () => {
  loadFromStorage()
  window.addEventListener('keydown', onShortcut)
  void fitWindowToContent()
  if ('__TAURI_INTERNALS__' in window) {
    try {
      unlistenMenu = await listen<string>('ecpl://menu', event => handleMenu(event.payload))
    } catch {
      /* running outside a Tauri webview (e.g. plain vite dev) — menu is absent */
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onShortcut)
  unlistenMenu?.()
})
</script>

<template>
  <div id="app">
    <Toast />

    <!-- Overlay title bar: doubles as the app toolbar and the window drag area -->
    <header class="titlebar" data-tauri-drag-region>
      <span class="titlebar-brand" data-tauri-drag-region>
        <img class="titlebar-icon" :src="appIcon" alt="" aria-hidden="true" data-tauri-drag-region />
        <span class="titlebar-title" data-tauri-drag-region>ECPL Cheque Writer</span>
      </span>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ 'is-on': sidebarOpen }"
        :aria-label="sidebarOpen ? 'Hide sidebar' : 'Show sidebar'"
        :aria-expanded="sidebarOpen"
        :title="sidebarOpen ? 'Hide sidebar (⌥⌘S)' : 'Show sidebar (⌥⌘S)'"
        @click="toggleSidebar"
      >
        <Icon name="more-horizontal" :size="16" :stroke="2" />
      </button>
      <span class="titlebar-spacer" data-tauri-drag-region />
      <Button variant="primary" @click="doPrint">
        <Icon name="printer" :size="14" />
        <span>Print</span>
        <kbd>⌘P</kbd>
      </Button>
    </header>

    <div class="shell">
      <!-- Sidebar: navigation + saved presets, like a native source list -->
      <nav v-if="sidebarOpen" class="sidebar" aria-label="Sections">
        <div class="sidebar-group-label">Workspace</div>
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="sidebar-item"
          :class="{ active: activeSection === section.id }"
          :aria-current="activeSection === section.id"
          @click="activeSection = section.id"
        >
          <Icon :name="section.icon" :size="15" />
          <span class="sidebar-item-name">{{ section.label }}</span>
        </button>

        <div class="sidebar-group-label">Saved Layouts</div>
        <p v-if="!layoutNames.length" class="sidebar-empty">No saved layouts</p>
        <button
          v-for="name in layoutNames"
          :key="`layout-${name}`"
          type="button"
          class="sidebar-item"
          :class="{ active: store.layoutSelect === name }"
          :title="name"
          @click="selectLayout(name)"
        >
          <Icon name="layout" :size="14" />
          <span class="sidebar-item-name">{{ name }}</span>
        </button>

        <div class="sidebar-group-label">Printer Profiles</div>
        <p v-if="!profileNames.length" class="sidebar-empty">No saved profiles</p>
        <button
          v-for="name in profileNames"
          :key="`profile-${name}`"
          type="button"
          class="sidebar-item"
          :class="{ active: store.profileSelect === name }"
          :title="name"
          @click="selectProfile(name)"
        >
          <Icon name="printer" :size="14" />
          <span class="sidebar-item-name">{{ name }}</span>
        </button>
      </nav>

      <main class="content">
        <!-- Data Entry: the cheque form -->
        <div v-if="activeSection === 'data-entry'" class="pane pane-data">
          <div class="form-card">
            <h3>Cheque Information</h3>

            <Input v-model="store.form.date" type="date" label="Date" />

            <Checkbox v-model="store.form.crossing" label="Add 'A/C PAYEE ONLY' crossing" />

            <Input v-model="store.form.payee" placeholder="Enter Name" label="Payee Name" />

            <Input
              v-model="store.form.amount"
              type="number"
              placeholder="e.g. 50000"
              label="Amount in Numbers"
              step="any"
            />

            <Input
              v-model="store.form.words"
              placeholder="e.g. Fifty Thousand Rupees Only"
              label="Amount in Words"
            />

            <p class="form-hint">
              Amount in words updates automatically as you type the amount. Values appear live on
              the Cheque Canvas and Printer Settings canvases.
            </p>

            <div class="divider" />

            <h3>Cheque Preset</h3>
            <div class="preset-row">
              <Select
                :model-value="store.layoutSelect"
                :options="layoutOptions"
                label="Bank Layout"
                placeholder="Choose a saved layout…"
                @update:model-value="selectLayout"
              />
              <Select
                :model-value="store.profileSelect"
                :options="profileOptions"
                label="Printer Profile"
                placeholder="Choose a saved profile…"
                @update:model-value="selectProfile"
              />
            </div>
          </div>
        </div>

        <!-- Cheque Canvas: canvas on the left, inspector on the right -->
        <div v-else-if="activeSection === 'layout-designer'" class="pane pane-split">
          <EditorWorkspace />
          <aside class="inspector inspector-right">
            <LdPanel />
          </aside>
        </div>

        <!-- Printer Settings: A4 sheet on the left, inspector on the right -->
        <div v-else class="pane pane-split">
          <PrinterWorkspace />
          <aside class="inspector inspector-right">
            <PrinterPanel />
          </aside>
        </div>
      </main>
    </div>

    <!-- Confirm dialog showing the cheque preview; prints on confirm. -->
    <PrintPreview
      v-if="printing"
      :layout="printLayout"
      :profile="printProfile"
      :cheque-data="chequeData"
      @done="onPrintDone"
    />

    <PromptModal
      v-model="promptVisible"
      :title="promptConfig.title"
      :message="promptConfig.message"
      :default-value="promptConfig.defaultValue"
      :placeholder="promptConfig.placeholder"
      @confirm="confirm"
      @cancel="cancel"
    />
  </div>
</template>

<style scoped>
.shell {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  background: var(--window-bg);
}

.titlebar-spacer {
  flex: 1;
  align-self: stretch;
}

kbd {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: 0.02em;
}

.btn:hover kbd,
.btn:active kbd {
  color: rgba(255, 255, 255, 0.9);
}

.sidebar-empty {
  margin: 0;
  padding: 0 calc(var(--space-md) + 2px) var(--space-sm);
  font-size: var(--text-sm);
  color: var(--text-3);
}

.pane {
  min-height: 0;
  min-width: 0;
}

.pane-data {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  /* The window is sized to the form: a 10px margin on the sides and bottom,
     a hairline under the titlebar. */
  padding: 3px 10px 10px;
}

.pane-split {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.form-card {
  width: 100%;
  max-width: 560px;
}

.form-card h3 {
  margin: 0 0 var(--space-md) 0;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-3);
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--text-3);
  line-height: 1.5;
  margin: var(--space-sm) 0 0;
}

.preset-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.divider {
  height: 1px;
  background: var(--hairline);
  margin: var(--space-xl) 0 var(--space-lg);
}
</style>
