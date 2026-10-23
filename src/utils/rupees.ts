const SINGLE = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
]

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
]

function getTens(value: number): string {
  if (value < 20) return SINGLE[value]
  const ten = Math.floor(value / 10)
  const unit = value % 10
  return TENS[ten] + (unit !== 0 ? ' ' + SINGLE[unit] : '')
}

export function convertToRupees(input: string | number): string {
  const numStr = String(input)
  const num = parseFloat(numStr)
  if (isNaN(num)) return ''

  // Handle negative numbers
  const isNegative = num < 0
  const absNum = Math.abs(num)

  if (absNum === 0) return ''

  const [integerPart, decimalPart] = String(absNum).split('.')
  let n = parseInt(integerPart, 10)

  let str = ''

  const crore = Math.floor(n / 10000000)
  n %= 10000000

  const lakh = Math.floor(n / 100000)
  n %= 100000

  const thousand = Math.floor(n / 1000)
  n %= 1000

  const hundred = Math.floor(n / 100)
  const remainder = n % 100

  if (crore) str += getTens(crore) + ' Crore '
  if (lakh) str += getTens(lakh) + ' Lakh '
  if (thousand) str += getTens(thousand) + ' Thousand '
  if (hundred) str += SINGLE[hundred] + ' Hundred '
  if (remainder) str += getTens(remainder) + ' '

  str = str.trim()

  let paiseStr = ''
  if (decimalPart) {
    const paise = parseInt((decimalPart + '00').substring(0, 2), 10)
    if (paise > 0) paiseStr = ' and ' + getTens(paise) + ' Paise'
  }

  if (str === '') return paiseStr ? paiseStr.trim() + ' Only' : ''
  const result = str + ' Rupees' + paiseStr + ' Only'
  return isNegative ? 'Minus ' + result : result
}

export function formatToDDMMYYYY(dateString: string): string {
  if (!dateString) return ''
  const [yyyy, mm, dd] = dateString.split('-')
  if (!dd || !mm || !yyyy) return ''
  // dd mm yyyy with group spaces, the way dates are printed on cheques
  return `${dd} ${mm} ${yyyy}`
}