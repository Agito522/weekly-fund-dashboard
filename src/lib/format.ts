const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value)
  }
  if (Array.isArray(value) && value.length > 0) return asNumber(value[0])
  return null
}

function grouped(value: number, digits: number): string {
  return Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatUsd(value: number): string {
  const body = grouped(value, 2)
  return value < 0 ? `−$${body}` : `$${body}`
}

export function formatSignedUsd(value: number): string {
  const body = grouped(value, 2)
  if (value > 0) return `+$${body}`
  if (value < 0) return `−$${body}`
  return `$${body}`
}

export function formatPct(value: number, digits = 2): string {
  const body = Math.abs(value).toFixed(digits)
  if (value > 0) return `+${body}%`
  if (value < 0) return `−${body}%`
  return `${body}%`
}

export function formatPlainPct(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`
}

export function formatPp(value: number, digits = 2): string {
  const body = Math.abs(value).toFixed(digits)
  if (value > 0) return `+${body} pp`
  if (value < 0) return `−${body} pp`
  return `${body} pp`
}

export function formatShares(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export function formatPx(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

export function formatIsoDate(iso: string, style: 'long' | 'short' = 'long'): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  if (month < 0 || month > 11) return iso
  const year = match[1]
  if (style === 'short') return `${day} ${MONTHS_SHORT[month]} ${year}`
  return `${day} ${MONTHS[month]} ${year}`
}

export function toneClass(value: number | null | undefined): string {
  if (value == null || value === 0) return ''
  return value > 0 ? 'up' : 'down'
}

export function gradeTone(grade: string): string {
  const letter = grade.trim().charAt(0).toUpperCase()
  if (letter === 'A') return 'tone-good'
  if (letter === 'B') return 'tone-mid'
  if (letter === 'C') return 'tone-weak'
  return 'tone-poor'
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'Hold':
      return 'Hold'
    case 'Trim':
      return 'Trim'
    case 'ema5_below_ema30':
      return 'EMA5 below EMA30'
    case '2nd_close_below_stop':
      return '2nd close below stop'
    default:
      return status
  }
}

export function statusTone(status: string): string {
  switch (status) {
    case 'Hold':
      return 'pill hold'
    case 'Trim':
      return 'pill trim'
    case 'ema5_below_ema30':
      return 'pill ema'
    case '2nd_close_below_stop':
      return 'pill exit'
    default:
      return 'pill'
  }
}
