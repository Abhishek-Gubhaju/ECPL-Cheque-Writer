<script setup lang="ts">
import { nextTick, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Button, Icon, useToast } from '@/components/ui'
import ChequeOverlay from './ChequeOverlay.vue'
import ChequeCanvas from './ChequeCanvas.vue'
import { store, PX_PER_CM, paperSize } from '@/store'

const { error: toastError } = useToast()

const emit = defineEmits<{
  done: []
}>()

/** Display scale for fitting the live cheque canvas inside the confirm dialog. */
const PREVIEW_SCALE = 0.52

/** Outer box = scaled size so the dialog lays out to the visible cheque only. */
const fitBox = computed(() => ({
  width: `${store.cheque.w * PX_PER_CM * PREVIEW_SCALE}px`,
  height: `${store.cheque.h * PX_PER_CM * PREVIEW_SCALE}px`
}))

/** Inner box = true canvas size; only the visual is scaled down. */
const scaleBox = computed(() => ({
  width: `${store.cheque.w * PX_PER_CM}px`,
  height: `${store.cheque.h * PX_PER_CM}px`,
  transform: `scale(${PREVIEW_SCALE})`,
  transformOrigin: 'top left'
}))

/** Ref for the teleported print sheet — kept mounted for the whole print session. */
const sheetEl = ref<HTMLElement | null>(null)

/** One print job at a time: the dialog stays open until afterprint fires. */
const busy = ref(false)

/** The printed page is exactly the chosen paper, so 1cm here = 1cm on paper. */
const paper = computed(() => paperSize())
// A hair under the page height: WebKit rounds a box that exactly fills the
// page up to the next one, which is what produced the blank second sheet.
const sheetStyle = computed(() => ({
  width: `${paper.value.w}cm`,
  height: `${paper.value.h - 0.05}cm`
}))

/**
 * Print cheque.
 *
 * Root-cause fix for the blank WKWebView preview:
 *  1. The sheet is display:none on screen and was being restored to hidden
 *     BEFORE print() — WebKit's panel paginates the document lazily (Apple
 *     forum thread 803249), so it captured an empty tree.
 *  2. emit('done') unmounted this component right after print() returned,
 *     destroying the Teleported sheet while the preview was still rendering.
 *
 * Now: drive the document into its print state with INLINE styles (no
 * dependence on @media print), keep the component mounted, and only restore
 * + close on the afterprint event (fires when the panel closes, incl. cancel).
 */
async function handlePrint() {
  if (busy.value) return
  busy.value = true
  try {
    // 1. Flush Vue DOM updates (Teleport to body)
    await nextTick()

    const appEl = document.getElementById('app')
    const sheet = sheetEl.value
    if (!appEl || !sheet) throw new Error('Print sheet not rendered yet')

    // 2. Save current inline styles so restore is exact
    const savedAppStyle = appEl.getAttribute('style')
    const savedSheetStyle = sheet.getAttribute('style')
    const savedHtmlStyle = document.documentElement.getAttribute('style')
    const savedBodyStyle = document.body.getAttribute('style')

    // 3. The page box IS the selected paper. A page that differs from the
    //    paper makes the print engine fit/inset the sheet — that was the
    //    drift. With size == paper and margin 0, 1cm in the app is 1cm on
    //    paper, so the cheque keeps its exact position and footprint.
    const page = paperSize()
    const pageStyleId = 'ecpl-print-page'
    let pageStyle = document.getElementById(pageStyleId) as HTMLStyleElement | null
    if (!pageStyle) {
      pageStyle = document.createElement('style')
      pageStyle.id = pageStyleId
      document.head.appendChild(pageStyle)
    }
    pageStyle.textContent = `@page { size: ${page.w}cm ${page.h}cm; margin: 0; }`

    // 4. Apply the print state directly to the DOM — this is what the print
    //    panel captures, regardless of whether @media print is applied.
    appEl.style.setProperty('display', 'none', 'important')
    const printState: Record<string, string> = {
      display: 'block',
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${page.w}cm`,
      height: `${page.h - 0.05}cm`,
      margin: '0',
      padding: '0',
      background: '#fff',
      overflow: 'hidden',
      transform: 'none'
    }
    for (const [prop, val] of Object.entries(printState)) {
      sheet.style.setProperty(prop, val, 'important')
    }
    // Absolute sheet at the page origin + no in-flow content = exactly one
    // page, with no rounding spill into a blank second one.
    for (const el of [document.documentElement, document.body]) {
      el.style.setProperty('margin', '0', 'important')
      el.style.setProperty('padding', '0', 'important')
      el.style.setProperty('height', 'auto', 'important')
      el.style.setProperty('overflow', 'hidden', 'important')
      el.style.setProperty('background', '#fff', 'important')
    }

    // 5. Force a synchronous layout so the cheque subtree is measured now
    sheet.getBoundingClientRect()
    await new Promise<void>(r => requestAnimationFrame(() => r()))

    // 6. Restore everything only AFTER printing has finished
    let restored = false
    const restore = () => {
      if (restored) return
      restored = true
      busy.value = false
      window.removeEventListener('afterprint', restore)
      if (savedAppStyle === null) appEl.removeAttribute('style')
      else appEl.setAttribute('style', savedAppStyle)
      if (savedSheetStyle === null) sheet.removeAttribute('style')
      else sheet.setAttribute('style', savedSheetStyle)
      if (savedHtmlStyle === null) document.documentElement.removeAttribute('style')
      else document.documentElement.setAttribute('style', savedHtmlStyle)
      if (savedBodyStyle === null) document.body.removeAttribute('style')
      else document.body.setAttribute('style', savedBodyStyle)
      pageStyle?.remove()
      emit('done') // unmount modal + teleported sheet, now that print is over
    }
    window.addEventListener('afterprint', restore, { once: true })
    // Safety net: never leave the app stuck in print state
    window.setTimeout(restore, 5 * 60 * 1000)

    // 7. Let the webview actually paint the print sheet. WKWebView's print
    //    operation snapshots the rendered page, so printing straight after a
    //    style change captures an empty frame (blank page).
    await new Promise<void>(resolve =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => window.setTimeout(resolve, 150))
      )
    )

    // 8. window.print() is the path that WKWebView renders correctly.
    window.print()
  } catch (err) {
    busy.value = false
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Print failed:', err)
    toastError('Print failed: ' + msg)
    emit('done')
  }
}

/**
 * Ctrl+P (Windows) / ⌘P (macOS) inside the confirm dialog.
 *
 * The app-level handler deliberately ignores the shortcut while this dialog
 * is open, which is why the key looked dead here. Capturing on window while
 * the dialog is mounted gives the key back to the print job itself.
 */
function onPreviewShortcut(e: KeyboardEvent) {
  if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
  if (e.key.toLowerCase() !== 'p') return
  e.preventDefault()
  e.stopPropagation()
  void handlePrint()
}

onMounted(() => {
  window.addEventListener('keydown', onPreviewShortcut, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onPreviewShortcut, true)
})
</script>

<template>
  <div class="print-confirm-overlay" @click.self="emit('done')">
    <div class="print-confirm-dialog">
      <h3>Print cheque</h3>
      <p class="print-confirm-message">
        Paper {{ paper.w }} × {{ paper.h }} cm — keep the print panel at 100% scale.
      </p>

      <!-- Live cheque canvas: same component as the Cheque Canvas tab,
           store-driven so it updates as the form changes. Read-only here. -->
      <div class="print-preview-viewport no-print">
        <div class="preview-fit" :style="fitBox">
          <div class="preview-scale" :style="scaleBox">
            <ChequeCanvas :zoom="100" />
          </div>
        </div>
      </div>

      <div class="print-confirm-actions no-print">
        <Button variant="ghost" @click="emit('done')">Cancel</Button>
        <Button variant="primary" @click="handlePrint">
          <Icon name="printer" :size="15" /> Print
        </Button>
      </div>
    </div>
  </div>

  <!-- Teleport print content to body so it has NO transformed/clipped ancestor -->
  <Teleport to="body">
    <div ref="sheetEl" class="only-print" :style="sheetStyle">
      <ChequeOverlay :bordered="false" transparent />
    </div>
  </Teleport>
</template>

<style scoped>
.print-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn var(--transition-normal) ease;
}

.print-confirm-dialog {
  background: var(--panel-bg);
  border: 1px solid var(--hairline);
  border-radius: var(--r-lg);
  padding: var(--space-lg) var(--space-lg) var(--space-md);
  width: min(94vw, 520px);
  box-shadow: var(--shadow-pop);
  animation: slideUp var(--transition-smooth) ease;
}

.print-confirm-dialog h3 {
  margin: 0 0 var(--space-xs);
  color: var(--text);
  font-size: var(--text-md);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.print-confirm-message {
  margin: 0 0 var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-2);
  line-height: 1.45;
}

/* Clips the scaled cheque so only the cheque itself is shown, centered.
   Read-only: the modal is a confirmation step, not an editor. */
.print-preview-viewport {
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--canvas-bg);
  border: 1px solid var(--hairline);
  border-radius: var(--r);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  pointer-events: none;
}

/* Fit box reserves the SCALED size in layout; scale box holds true canvas
   geometry (19.1×9 cm) and is only visually scaled — transform never affects
   layout, so no phantom scroll space. */
.preview-fit {
  overflow: hidden;
  flex-shrink: 0;
}

.preview-scale {
  transform-origin: top left;
}

.print-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>