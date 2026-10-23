export interface FieldConfig {
  top: string
  left: string
  fontSize: string
  fontFamily: string
  fontWeight: string
  /** optional wrap width, cm (Amount in words) */
  width?: string
  /** optional fixed height, cm */
  height?: string
  /** line-height multiplier for wrapped multi-line text (e.g. "1.5") */
  lineHeight?: string
  /** cheque-style digit box rendering (date, cheque no, MICR, amount) */
  box?: BoxSettings
}

export type BoxSeparator = 'none' | 'slash' | 'gap'

export interface BoxSettings {
  on: boolean
  cellW: number // mm
  cellH: number // mm
  sep: BoxSeparator
  gap: number // mm, blank space between digit groups
  outlines: boolean
}

/** Fields whose text can render as one-digit-per-cell boxes. */
export const BOX_CAPABLE_FIELDS = ['p-date', 'p-cheque-no', 'p-micr', 'p-amount']

export interface CanvasConfig {
  width: string
  height: string
}

export interface ChequeLayout {
  canvas: CanvasConfig
  fields: Record<string, FieldConfig>
  crossingRotation: number
  /** two rules around the A/C PAYEE text (legacy-layout keys, undefined = on/2px) */
  crossingLines?: boolean
  crossingLineW?: number
  /** field ids toggled off in the Edit Fields list */
  hiddenFields?: string[]
  [key: string]: any
}

export interface PrinterProfile {
  x: number
  y: number
  rotation: number
  [key: string]: any
}

export interface ChequeData {
  date: string
  payee: string
  amount: string
  words: string
  crossing: boolean
}

export interface FieldGuide {
  id: string
  type: 'h' | 'v'
  position: number // px from top/left
}

export const FIELD_NAMES: Record<string, string> = {
  'p-date': 'Date',
  'p-payee': 'Payee Name',
  'p-words': 'Amount in Words',
  'p-amount': 'Amount in Numbers',
  'p-crossing': 'A/C Payee Crossing'
}

export const DEFAULT_LAYOUT: ChequeLayout = {
  canvas: { width: '19.1cm', height: '9.0cm' },
  fields: {},
  crossingRotation: -15
}

export const A4_WIDTH_CM = 21
export const A4_HEIGHT_CM = 29.7
export const SNAP_THRESHOLD_CM = 0.3
export const DPI = 96 / 2.54