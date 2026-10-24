import { reactive, computed, watch } from 'vue'
import { convertToRupees, formatToDDMMYYYY } from '@/utils/rupees'
import { isWindows } from '@/utils/platform'
import type { ChequeLayout, BoxSettings, FieldConfig } from '@/types/cheque'
import { BOX_CAPABLE_FIELDS } from '@/types/cheque'

/** 96 dpi → px per cm. All stored coordinates are cm. */
export const PX_PER_CM = 37.79527778
export const A4_W = 21
export const A4_H = 29.7

export interface FieldDef {
  id: string
  label: string
  text: string
  x: number // cm from left
  y: number // cm from top
  w?: number // optional wrap width in cm
  h?: number // optional fixed height in cm (adjustable field "cell" size)
  /** line-height multiplier for wrapped multi-line text; undefined = 1.3 */
  lineH?: number
  fontSize: number // px
  fontFamily: string
  fontWeight: string
  /** visibility toggle in the Edit Fields list; undefined = visible (older saves) */
  visible?: boolean
  /** cheque-style digit box rendering; only on box-capable fields */
  box?: BoxSettings
}

export interface GuideDef {
  id: string
  type: 'h' | 'v'
  pos: number // cm
}

export type AlignPosition = 'center' | 'top' | 'bottom' | 'left' | 'right'

export interface StoreState {
  cheque: { w: number; h: number }
  fields: FieldDef[]
  guides: GuideDef[]
  refImg: string | null
  refOpacity: number
  payeeRot: number
  /** two horizontal rules around the A/C PAYEE text */
  crossLines: boolean
  crossLineW: number // px
  editMode: boolean
  selectedFieldId: string | null
  ldZoom: number
  printer: {
    x: number
    y: number
    rot: number
    zoom: number
    /** default placement on the sheet, re-applied when the sheet changes */
    align: AlignPosition
  }
  /** incremented by panels to ask their workspace to auto-fit */
  fitRequest: number
  form: { date: string; payee: string; amount: string; words: string; crossing: boolean }
  layouts: Record<string, unknown>
  profiles: Record<string, unknown>
  layoutSelect: string
  profileSelect: string
}

const DEFAULT_FAMILIES = "'Courier New', Courier, monospace"

/** Box rendering defaults; date starts in box mode, other capable fields do not. */
export function defaultBox(id: string): BoxSettings | undefined {
  if (!BOX_CAPABLE_FIELDS.includes(id)) return undefined
  return { on: id === 'p-date', cellW: 6.6, cellH: 9.1, sep: 'none', gap: 1.5, outlines: false }
}

/** Merge saved box settings over defaults; drop box from non-capable fields. */
function normalizeBox(id: string, saved?: BoxSettings): BoxSettings | undefined {
  const base = defaultBox(id)
  if (!base) return undefined
  return { ...base, ...(saved ?? {}) }
}

export function isBoxCapable(f: Pick<FieldDef, 'id'>): boolean {
  return BOX_CAPABLE_FIELDS.includes(f.id)
}

/** True when the field should render as a digit-box strip right now. */
export function usesBox(f: FieldDef): boolean {
  return isBoxCapable(f) && !!f.box?.on
}

/**
 * Strip width in mm: digitCount × cellW plus separator widths
 * (spec formula, shown next to the controls).
 */
export function boxStripWidth(f: FieldDef): number | null {
  const b = f.box
  if (!b?.on) return null
  const digitCount = fieldText(f).replace(/\D/g, '').length
  const groupCount = f.id === 'p-date' && digitCount === 8 ? 3 : 1
  const sepCount = Math.max(0, groupCount - 1)
  let w = digitCount * b.cellW
  if (b.sep === 'slash') w += sepCount * b.cellW * 0.6
  else if (b.sep === 'gap') w += sepCount * b.gap
  return Math.round(w * 10) / 10
}

/**
 * Windows-only field positions, in cm from the cheque's top-left.
 *
 * Windows prints the cheque from a different origin than macOS (the driver
 * offsets the page), so these four data fields sit at slightly different
 * coordinates there. The macOS calibration below is untouched: these values
 * are only read when `isWindows` is true, so the Mac build renders exactly
 * as before.
 */
const WINDOWS_FIELD_POS: Record<string, { x: number; y: number }> = {
  'p-date': { x: 13.68, y: 0.77 },
  'p-amount': { x: 13.8, y: 3.24 },
  'p-words': { x: 2.54, y: 2.7 },
  'p-payee': { x: 6.23, y: 2.11 }
}

/**
 * Windows-only wrap widths, in cm, for fields whose box is a different size
 * on Windows (the words line runs slightly shorter there). Same rule as
 * above: read only when `isWindows` is true.
 */
const WINDOWS_FIELD_W: Record<string, number> = {
  'p-words': 11.3
}

/** Pick the Windows coordinate on Windows, the macOS one everywhere else. */
function platformPos(id: string, macX: number, macY: number): { x: number; y: number } {
  if (isWindows && WINDOWS_FIELD_POS[id]) return WINDOWS_FIELD_POS[id]
  return { x: macX, y: macY }
}

/** Pick the Windows wrap width on Windows, the macOS one everywhere else. */
function platformW(id: string, macW: number): number {
  if (isWindows && WINDOWS_FIELD_W[id]) return WINDOWS_FIELD_W[id]
  return macW
}

function defaultFields(): FieldDef[] {
  return [
    { id: 'p-date', label: 'Date', text: '', ...platformPos('p-date', 13.32, 0.77), fontSize: 15, fontFamily: DEFAULT_FAMILIES, fontWeight: 'bold', visible: true, box: defaultBox('p-date') },
    { id: 'p-payee', label: 'Payee', text: '', ...platformPos('p-payee', 5.51, 1.95), fontSize: 14, fontFamily: DEFAULT_FAMILIES, fontWeight: 'bold', visible: true },
    { id: 'p-words', label: 'Amount in words', text: '', ...platformPos('p-words', 2.17, 2.64), w: platformW('p-words', 11.4), lineH: 2, fontSize: 12, fontFamily: DEFAULT_FAMILIES, fontWeight: 'bold', visible: true },
    { id: 'p-amount', label: 'Amount in figures', text: '', ...platformPos('p-amount', 13.6, 3.24), fontSize: 13, fontFamily: DEFAULT_FAMILIES, fontWeight: 'bold', visible: true, box: defaultBox('p-amount') },
    { id: 'p-crossing', label: 'A/C Payee crossing', text: 'A/C PAYEE ONLY', x: 0.8, y: 0.8, fontSize: 11, fontFamily: DEFAULT_FAMILIES, fontWeight: 'bold', visible: true },
    { id: 'p-cheque-no', label: 'Cheque number', text: '0004567890', x: 8.0, y: 0.9, fontSize: 12, fontFamily: DEFAULT_FAMILIES, fontWeight: 'bold', visible: false, box: defaultBox('p-cheque-no') },
    // Hidden by default — toggle on in the Edit Fields list
    { id: 'p-bank', label: 'Bank name', text: 'ECPL BANK LTD.', x: 1.0, y: 5.6, fontSize: 12, fontFamily: DEFAULT_FAMILIES, fontWeight: 'bold', visible: false },
    { id: 'p-micr', label: 'MICR', text: '1234567890123', x: 1.0, y: 7.6, fontSize: 12, fontFamily: DEFAULT_FAMILIES, fontWeight: 'normal', visible: false, box: defaultBox('p-micr') },
    { id: 'p-signature', label: 'Signature', text: 'Authorised Signatory', x: 13.0, y: 7.4, fontSize: 11, fontFamily: DEFAULT_FAMILIES, fontWeight: 'normal', visible: false }
  ]
}

const STORAGE = {
  LAYOUTS: 'cheque_layouts',
  PROFILES: 'cheque_printer_profiles',
  LAST_LAYOUT: 'cheque_last_layout',
  LAST_PROFILE: 'cheque_last_printer',
  REF: 'cheque_reference_image'
} as const

export const store = reactive<StoreState>({
  cheque: { w: 19.1, h: 9 },
  fields: defaultFields(),
  guides: [],
  refImg: null,
  refOpacity: 0.5,
  payeeRot: -23,
  crossLines: true,
  crossLineW: 1,
  editMode: false,
  selectedFieldId: null,
  ldZoom: 100,
  printer: {
    x: 0,
    y: 0,
    rot: 270,
    zoom: 100,
    align: 'top'
  },
  fitRequest: 0,
  form: {
    date: new Date().toISOString().split('T')[0],
    payee: '',
    amount: '',
    words: '',
    crossing: true
  },
  layouts: {},
  profiles: {},
  layoutSelect: '',
  profileSelect: ''
})

/* ---------- derived ---------- */

export const selectedField = computed<FieldDef | null>(
  () => store.fields.find(f => f.id === store.selectedFieldId) || null
)

export const formattedDate = computed(() => formatToDDMMYYYY(store.form.date))

export const formattedAmount = computed(() => {
  if (!store.form.amount) return ''
  const num = parseFloat(store.form.amount)
  if (isNaN(num)) return ''
  return `NRS ${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/-`
})

export const formattedPayee = computed(() => store.form.payee?.toUpperCase() || '')

export const chequeData = computed(() => ({
  date: formattedDate.value,
  payee: formattedPayee.value,
  amount: formattedAmount.value,
  words: store.form.words,
  crossing: store.form.crossing
}))

/* ---------- actions ---------- */

export function fieldById(id: string | null): FieldDef | null {
  if (!id) return null
  return store.fields.find(f => f.id === id) || null
}

export function isFieldVisible(f: FieldDef): boolean {
  if (f.visible === false) return false
  if (f.id === 'p-crossing') return store.form.crossing
  return true
}

export function toggleFieldVisible(id: string) {
  const f = fieldById(id)
  if (f) f.visible = f.visible === false // flip, treating undefined as visible
}

export function fieldText(f: FieldDef): string {
  return f.text
}

/** Push current form values into the data-driven fields' text. */
export function syncFormToFields() {
  const set = (id: string, text: string) => {
    const f = fieldById(id)
    if (f) f.text = text
  }
  set('p-date', formattedDate.value)
  set('p-payee', formattedPayee.value)
  set('p-words', store.form.words)
  set('p-amount', formattedAmount.value)
}

export function setFieldText(id: string, text: string) {
  const f = fieldById(id)
  if (f) f.text = text
}

export function selectField(id: string | null) {
  store.selectedFieldId = id
}

export function nudgeField(id: string, dx: number, dy: number) {
  const f = fieldById(id)
  if (!f) return
  f.x = round2(clamp(f.x + dx, 0, Math.max(0, store.cheque.w - 0.5)))
  f.y = round2(clamp(f.y + dy, 0, Math.max(0, store.cheque.h - 0.3)))
}

export function moveField(id: string, x: number, y: number) {
  const f = fieldById(id)
  if (!f) return
  f.x = round2(clamp(x, 0, Math.max(0, store.cheque.w - 0.5)))
  f.y = round2(clamp(y, 0, Math.max(0, store.cheque.h - 0.3)))
}

export function addGuide(type: 'h' | 'v') {
  store.guides.push({
    id: `fg-${Date.now()}`,
    type,
    pos: type === 'h' ? store.cheque.h / 2 : store.cheque.w / 2
  })
}

export function clearGuides() {
  store.guides = []
}

export function removeGuide(id: string) {
  const i = store.guides.findIndex(g => g.id === id)
  if (i > -1) store.guides.splice(i, 1)
}

export function moveGuide(id: string, posCm: number) {
  const g = store.guides.find(x => x.id === id)
  if (!g) return
  const max = g.type === 'h' ? store.cheque.h : store.cheque.w
  g.pos = round2(clamp(posCm, 0, max))
}

export function resetFields() {
  store.fields = defaultFields()
  syncFormToFields()
  store.guides = []
  store.payeeRot = -23
  store.crossLines = true
  store.crossLineW = 1
  store.cheque = { w: 19.1, h: 9 }
}

/* ---------- paper ---------- */

/** Cheque footprint after rotation, in cm. */
export function rotatedChequeSize(): { w: number; h: number } {
  const rad = (store.printer.rot * Math.PI) / 180
  const { w, h } = store.cheque
  return {
    w: round2(Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))),
    h: round2(Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad)))
  }
}

/** The physical sheet the cheque is placed on: A4. */
export function paperSize(): { w: number; h: number } {
  return { w: A4_W, h: A4_H }
}

/* ---------- printer alignment (cheque within the sheet) ---------- */

export function applyAlignment() {
  alignCheque(store.printer.align)
}

export function alignCheque(position: AlignPosition) {
  store.printer.align = position
  const w = store.cheque.w
  const h = store.cheque.h
  const sheet = paperSize()
  const rad = (store.printer.rot * Math.PI) / 180
  const rotW = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))
  const rotH = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))

  switch (position) {
    case 'center':
      store.printer.x = round2((sheet.w - w) / 2)
      store.printer.y = round2((sheet.h - h) / 2)
      break
    case 'top':
      store.printer.x = round2((sheet.w - w) / 2)
      store.printer.y = round2((rotH - h) / 2)
      break
    case 'bottom':
      store.printer.x = round2((sheet.w - w) / 2)
      store.printer.y = round2(sheet.h - (h + rotH) / 2)
      break
    case 'left':
      store.printer.x = round2((rotW - w) / 2)
      store.printer.y = round2((sheet.h - h) / 2)
      break
    case 'right':
      store.printer.x = round2(sheet.w - (w + rotW) / 2)
      store.printer.y = round2((sheet.h - h) / 2)
      break
  }
}

export function movePrinterXY(x: number, y: number) {
  // Keep the cheque's centre on the sheet so it can't get lost
  const sheet = paperSize()
  store.printer.x = round2(clamp(x, -store.cheque.w / 2, sheet.w - store.cheque.w / 2))
  store.printer.y = round2(clamp(y, -store.cheque.h / 2, sheet.h - store.cheque.h / 2))
}

/* ---------- zoom helpers ---------- */

export function fitZoom(baseWcm: number, baseHcm: number, availW: number, availH: number, pad = 48): number {
  const w = baseWcm * PX_PER_CM
  const h = baseHcm * PX_PER_CM
  const z = Math.min((availW - pad) / w, (availH - pad) / h) * 100
  return Math.round(clamp(z, 10, 400))
}

/* ---------- persistence ---------- */

function saveLayouts() {
  try { localStorage.setItem(STORAGE.LAYOUTS, JSON.stringify(store.layouts)) } catch { /* quota */ }
}

function saveProfiles() {
  try { localStorage.setItem(STORAGE.PROFILES, JSON.stringify(store.profiles)) } catch { /* quota */ }
}

export interface PersistedLayout {
  cheque: { w: number; h: number }
  fields: FieldDef[]
  guides: GuideDef[]
  payeeRot: number
  crossLines?: boolean
  crossLineW?: number
}

export function getCurrentLayout(): PersistedLayout {
  return {
    cheque: { ...store.cheque },
    fields: store.fields.map(f => ({ ...f })),
    guides: store.guides.map(g => ({ ...g })),
    payeeRot: store.payeeRot,
    crossLines: store.crossLines,
    crossLineW: store.crossLineW
  }
}

export function saveLayout(name: string): boolean {
  store.layouts[name] = getCurrentLayout()
  saveLayouts()
  try { localStorage.setItem(STORAGE.LAST_LAYOUT, name) } catch { /* ignore */ }
  store.layoutSelect = name
  return true
}

/** Accepts the new shape or the legacy {canvas, fields, crossingRotation} shape. */
export function applyLayout(entry: PersistedLayout | LegacyLayout) {
  if (!entry) return
  if ('cheque' in entry && entry.cheque) {
    store.cheque = { w: entry.cheque.w, h: entry.cheque.h }
    if (entry.fields?.length) {
      // Merge over defaults so fields (and box settings) missing from older
      // saves keep their defaults instead of disappearing.
      const saved = new Map(entry.fields.map(f => [f.id, f] as const))
      const merged: FieldDef[] = defaultFields().map(d => {
        const s = saved.get(d.id)
        return s ? { ...d, ...s, box: normalizeBox(d.id, s.box) } : d
      })
      for (const s of entry.fields) {
        if (!merged.some(f => f.id === s.id)) {
          merged.push({ ...s, box: normalizeBox(s.id, s.box) })
        }
      }
      store.fields = merged
    }
    store.guides = (entry.guides || []).map(g => ({ ...g }))
    store.payeeRot = typeof entry.payeeRot === 'number' ? entry.payeeRot : store.payeeRot
    store.crossLines = typeof entry.crossLines === 'boolean' ? entry.crossLines : store.crossLines
    store.crossLineW = typeof entry.crossLineW === 'number' ? entry.crossLineW : store.crossLineW
    return
  }
  const legacy = entry as unknown as LegacyLayout
  if (legacy.canvas?.width) {
    store.cheque = {
      w: parseFloat(legacy.canvas.width) || 19.1,
      h: parseFloat(legacy.canvas.height ?? '') || 9
    }
  }
  if (legacy.fields) {
    for (const [id, cfg] of Object.entries(legacy.fields)) {
      const f = fieldById(id)
      if (!f || !cfg) continue
      if (cfg.top) f.y = parseFloat(cfg.top) || f.y
      if (cfg.left) f.x = parseFloat(cfg.left) || f.x
      if (cfg.fontSize) f.fontSize = parseFloat(cfg.fontSize) || f.fontSize
      if (cfg.fontFamily) f.fontFamily = cfg.fontFamily
      if (cfg.fontWeight) f.fontWeight = cfg.fontWeight
      if (cfg.lineHeight) f.lineH = parseFloat(cfg.lineHeight) || f.lineH
      if (cfg.box) f.box = normalizeBox(id, cfg.box)
    }
  }
  if (typeof legacy.crossingRotation === 'number') store.payeeRot = legacy.crossingRotation
  if (typeof legacy.crossingLines === 'boolean') store.crossLines = legacy.crossingLines
  if (typeof legacy.crossingLineW === 'number') store.crossLineW = legacy.crossingLineW
}

export function resetLayout() {
  resetFields()
  store.layoutSelect = ''
  try { localStorage.removeItem(STORAGE.LAST_LAYOUT) } catch { /* ignore */ }
}

export function deleteLayout(name: string) {
  delete store.layouts[name]
  saveLayouts()
  if (store.layoutSelect === name) store.layoutSelect = ''
  try { localStorage.removeItem(STORAGE.LAST_LAYOUT) } catch { /* ignore */ }
}

export interface PersistedProfile {
  x: number
  y: number
  rot: number
  rotation?: number
  align?: AlignPosition
}

export function getCurrentProfile(): PersistedProfile {
  return {
    x: store.printer.x,
    y: store.printer.y,
    rot: store.printer.rot,
    align: store.printer.align
  }
}

export function saveProfile(name: string) {
  store.profiles[name] = getCurrentProfile()
  saveProfiles()
  try { localStorage.setItem(STORAGE.LAST_PROFILE, name) } catch { /* ignore */ }
  store.profileSelect = name
}

export function applyProfile(p: PersistedProfile) {
  if (!p) return
  // Profiles saved before paper support had no sheet of their own: the cheque
  // was positioned on A4. Those users print cheque stock, so start them on
  // "Cheque" with the cheque fitted, keeping their rotation.
  const legacy = p.align === undefined
  store.printer.x = p.x || 0
  store.printer.y = p.y || 0
  // A4-era rotation is meaningless on cheque stock; start those at 270°.
  store.printer.rot = legacy
    ? 270
    : (typeof p.rot === 'number' ? p.rot : (p.rotation ?? 270))
  store.printer.align = p.align ?? 'top'
  if (legacy) applyAlignment()
}

export function resetProfile() {
  store.printer.rot = 270
  store.printer.align = 'top'
  applyAlignment()
  store.profileSelect = ''
  try { localStorage.removeItem(STORAGE.LAST_PROFILE) } catch { /* ignore */ }
}

/** Remember the user's chosen layout/profile so it survives restarts. */
export function setLastLayout(name: string) {
  store.layoutSelect = name
  try {
    if (name) localStorage.setItem(STORAGE.LAST_LAYOUT, name)
    else localStorage.removeItem(STORAGE.LAST_LAYOUT)
  } catch { /* ignore */ }
}

export function setLastProfile(name: string) {
  store.profileSelect = name
  try {
    if (name) localStorage.setItem(STORAGE.LAST_PROFILE, name)
    else localStorage.removeItem(STORAGE.LAST_PROFILE)
  } catch { /* ignore */ }
}

export function deleteProfile(name: string) {
  delete store.profiles[name]
  saveProfiles()
  if (store.profileSelect === name) store.profileSelect = ''
  try { localStorage.removeItem(STORAGE.LAST_PROFILE) } catch { /* ignore */ }
}

export function setReferenceImage(dataUrl: string | null): boolean {
  store.refImg = dataUrl
  try {
    if (dataUrl) {
      localStorage.setItem(STORAGE.REF, JSON.stringify({ image: dataUrl, opacity: store.refOpacity }))
    } else {
      localStorage.removeItem(STORAGE.REF)
    }
    return true
  } catch {
    return false // quota exceeded — session-only
  }
}

export function setReferenceOpacity(value: number) {
  store.refOpacity = value
  if (store.refImg) setReferenceImage(store.refImg)
}

export function loadFromStorage() {
  try {
    store.layouts = JSON.parse(localStorage.getItem(STORAGE.LAYOUTS) || '{}')
    store.profiles = JSON.parse(localStorage.getItem(STORAGE.PROFILES) || '{}')
    store.layoutSelect = localStorage.getItem(STORAGE.LAST_LAYOUT) || ''
    store.profileSelect = localStorage.getItem(STORAGE.LAST_PROFILE) || ''
  } catch {
    store.layouts = {}
    store.profiles = {}
  }
  try {
    const saved = localStorage.getItem(STORAGE.REF)
    if (saved) {
      const parsed = JSON.parse(saved)
      store.refImg = parsed.image ?? null
      if (typeof parsed.opacity === 'number') store.refOpacity = parsed.opacity
    }
  } catch { /* ignore */ }
  if (store.layoutSelect && store.layouts[store.layoutSelect]) {
    applyLayout(store.layouts[store.layoutSelect] as PersistedLayout)
    syncFormToFields()
  }
  if (store.profileSelect && store.profiles[store.profileSelect]) {
    applyProfile(store.profiles[store.profileSelect] as PersistedProfile)
  }
}

/* ---------- calibration backup: one JSON file for every saved preset ---------- */

export interface CalibrationFile {
  app: string
  kind: string
  version: number
  exportedAt: string
  layouts: Record<string, PersistedLayout>
  profiles: Record<string, PersistedProfile>
}

/** Snapshot of everything the user calibrated, ready to write to disk. */
export function buildCalibrationFile(): CalibrationFile {
  return {
    app: 'ECPL Cheque Writer',
    kind: 'calibration',
    version: 1,
    exportedAt: new Date().toISOString(),
    layouts: JSON.parse(JSON.stringify(store.layouts)),
    profiles: JSON.parse(JSON.stringify(store.profiles))
  }
}

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export interface ParsedCalibration {
  layouts: Record<string, PersistedLayout>
  profiles: Record<string, PersistedProfile>
  skipped: number
}

/** Validate an imported file. Throws with a user-readable message when unusable. */
export function parseCalibration(text: string): ParsedCalibration {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (!isRecord(data)) throw new Error('That file is not an ECPL calibration backup.')
  if (!isRecord(data.layouts) && !isRecord(data.profiles)) {
    throw new Error('No saved layouts or printer profiles found in that file.')
  }

  const layoutSrc = isRecord(data.layouts) ? data.layouts : {}
  const profileSrc = isRecord(data.profiles) ? data.profiles : {}
  const layouts: Record<string, PersistedLayout> = {}
  const profiles: Record<string, PersistedProfile> = {}
  let skipped = 0

  for (const [name, entry] of Object.entries(layoutSrc)) {
    // current shape (cheque + fields[]) or the legacy canvas/fields shape
    const usable = isRecord(entry) && (Array.isArray(entry.fields) || isRecord(entry.canvas))
    if (usable && name.trim()) layouts[name] = entry as PersistedLayout
    else skipped++
  }
  for (const [name, entry] of Object.entries(profileSrc)) {
    const usable = isRecord(entry) && (typeof entry.x === 'number' || typeof entry.y === 'number')
    if (usable && name.trim()) profiles[name] = entry as PersistedProfile
    else skipped++
  }
  if (!Object.keys(layouts).length && !Object.keys(profiles).length) {
    throw new Error('That file contains no readable layouts or profiles.')
  }
  return { layouts, profiles, skipped }
}

export interface ImportOutcome {
  layouts: number
  profiles: number
  skipped: number
}

/**
 * Bring an imported backup in, either alongside what is already saved or in
 * place of it. Imported entries win on a name clash in both modes: a restored
 * backup is there to repair calibration, not to lose to an older copy.
 */
export function applyCalibration(text: string, mode: 'merge' | 'replace'): ImportOutcome {
  const { layouts, profiles, skipped } = parseCalibration(text)
  store.layouts = mode === 'replace' ? { ...layouts } : { ...store.layouts, ...layouts }
  store.profiles = mode === 'replace' ? { ...profiles } : { ...store.profiles, ...profiles }
  saveLayouts()
  saveProfiles()
  // A replaced preset can remove the one that was selected at launch.
  if (store.layoutSelect && !store.layouts[store.layoutSelect]) setLastLayout('')
  if (store.profileSelect && !store.profiles[store.profileSelect]) setLastProfile('')
  return { layouts: Object.keys(layouts).length, profiles: Object.keys(profiles).length, skipped }
}

/* ---------- legacy bridge (print preview + old saved data) ---------- */

interface LegacyFieldCfg {
  top?: string; left?: string; fontSize?: string; fontFamily?: string; fontWeight?: string; width?: string
  lineHeight?: string
  box?: BoxSettings
}

interface LegacyLayout {
  canvas?: { width?: string; height?: string }
  fields?: Record<string, LegacyFieldCfg>
  crossingRotation?: number
  crossingLines?: boolean
  crossingLineW?: number
}

/** Build the {canvas, fields, crossingRotation} shape used by PrintPreview + Rust. */
export function toLegacyLayout(): ChequeLayout {
  const fields: ChequeLayout['fields'] = {}
  for (const f of store.fields) {
    fields[f.id] = {
      top: `${f.y}cm`,
      left: `${f.x}cm`,
      fontSize: `${f.fontSize}px`,
      fontFamily: f.fontFamily,
      fontWeight: f.fontWeight,
      ...(f.w ? { width: `${f.w}cm` } : {}),
      ...(f.h ? { height: `${f.h}cm` } : {}),
      ...(f.lineH ? { lineHeight: `${f.lineH}` } : {})
    }
  }
  // Carry box settings so the preview/print window renders cells identically
  for (const f of store.fields) {
    if (f.box && fields[f.id]) (fields[f.id] as FieldConfig).box = { ...f.box }
  }
  return {
    canvas: { width: `${store.cheque.w}cm`, height: `${store.cheque.h}cm` },
    fields,
    crossingRotation: store.payeeRot,
    crossingLines: store.crossLines,
    crossingLineW: store.crossLineW,
    texts: Object.fromEntries(
      store.fields.map(f => [f.id, fieldText(f)])
    ),
    hiddenFields: store.fields.filter(f => f.visible === false).map(f => f.id)
  }
}

/* ---------- paper side effects ---------- */

// A new rotation or cheque size re-applies the chosen alignment (top by
// default). The print offset is the only nudge, and it never touches the
// workspace.
watch(
  () => [store.printer.rot, store.cheque.w, store.cheque.h],
  () => applyAlignment(),
  { immediate: true }
)

/* ---------- form side effects ---------- */

watch(
  () => store.form.amount,
  val => {
    const n = Number(val)
    store.form.words = val !== '' && val !== null && val !== undefined && !isNaN(n) && n !== 0
      ? convertToRupees(val)
      : ''
  }
)

watch(
  () => [store.form.date, store.form.payee, store.form.words, store.form.amount],
  () => syncFormToFields(),
  { immediate: true }
)

/* ---------- utils ---------- */

export function requestFit() {
  store.fitRequest++
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100
}
