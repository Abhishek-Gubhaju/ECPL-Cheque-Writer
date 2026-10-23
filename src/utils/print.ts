import type { ChequeLayout, PrinterProfile } from '@/types/cheque'

const FIELD_MAPPINGS: Record<string, string> = {
  'p-crossing': 'pp-crossing',
  'p-date': 'pp-date',
  'p-payee': 'pp-payee',
  'p-words': 'pp-words',
  'p-amount': 'pp-amount'
}

export function preparePrintOutput(
  layout: ChequeLayout,
  profile: PrinterProfile
): void {
  const printCanvas = document.getElementById('print-cheque-canvas')
  const printChequeOnA4 = document.getElementById('print-cheque-on-a4')
  const printA4Wrapper = document.getElementById('print-a4-wrapper')

  if (!printCanvas || !printChequeOnA4 || !printA4Wrapper) return

  printCanvas.style.width = layout.canvas.width
  printCanvas.style.height = layout.canvas.height
  printCanvas.style.background = 'transparent'
  printCanvas.style.backgroundImage = 'none'
  printCanvas.style.border = 'none'
  printCanvas.style.boxShadow = 'none'

  Object.entries(FIELD_MAPPINGS).forEach(([srcId, destId]) => {
    const srcEl = document.getElementById(srcId)
    const destEl = document.getElementById(destId)
    if (!srcEl || !destEl) return

    const cs = window.getComputedStyle(srcEl)

    destEl.innerText = srcEl.innerText
    destEl.style.display = cs.display

    destEl.style.top = srcEl.style.top || cs.top
    destEl.style.left = srcEl.style.left || cs.left
    destEl.style.right = 'auto'
    destEl.style.bottom = 'auto'

    destEl.style.fontSize = srcEl.style.fontSize || cs.fontSize
    destEl.style.fontFamily = srcEl.style.fontFamily || cs.fontFamily
    destEl.style.fontWeight = srcEl.style.fontWeight || cs.fontWeight
    destEl.style.letterSpacing = cs.letterSpacing
    destEl.style.lineHeight = cs.lineHeight
    destEl.style.textTransform = cs.textTransform
    destEl.style.whiteSpace = cs.whiteSpace
    destEl.style.wordWrap = cs.wordWrap
    destEl.style.color = '#000'

    destEl.style.width = srcEl.style.width || cs.width
    destEl.style.height = 'auto'
    destEl.style.padding = cs.padding

    const srcTransform = srcEl.style.transform || cs.transform
    if (srcTransform && srcTransform !== 'none') {
      destEl.style.transform = srcEl.style.transform || cs.transform
      destEl.style.transformOrigin = cs.transformOrigin
    } else {
      destEl.style.transform = 'none'
    }

    destEl.style.borderTop = cs.borderTop
    destEl.style.borderBottom = cs.borderBottom
    destEl.style.borderLeft = 'none'
    destEl.style.borderRight = 'none'
  })

  printChequeOnA4.style.position = 'absolute'
  printChequeOnA4.style.left = `${profile.x}cm`
  printChequeOnA4.style.top = `${profile.y}cm`
  printChequeOnA4.style.width = layout.canvas.width
  printChequeOnA4.style.height = layout.canvas.height
  printChequeOnA4.style.margin = '0'
  printChequeOnA4.style.padding = '0'
  printChequeOnA4.style.transformOrigin = 'center center'
  printChequeOnA4.style.transform = `rotate(${profile.rotation}deg)`
}