export const DPI = 96 / 2.54 // px per cm

export function cmToPx(cm: number): number {
  return cm * DPI
}

export function pxToCm(px: number): number {
  return px / DPI
}

export function parseCm(value: string): number {
  if (value.endsWith('cm')) {
    return parseFloat(value.slice(0, -2))
  }
  if (value.endsWith('px')) {
    return pxToCm(parseFloat(value.slice(0, -2)))
  }
  return parseFloat(value)
}

export function formatCm(cm: number, decimals = 2): string {
  return `${cm.toFixed(decimals)}cm`
}

export function formatPx(px: number): string {
  return `${px}px`
}