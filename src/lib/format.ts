import { format, isValid, parseISO } from 'date-fns'

export function formatDate(value?: string | null, pattern = 'dd/MM/yyyy'): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  if (!isValid(date)) return '—'
  return format(date, pattern)
}

export function formatDateTime(value?: string | null): string {
  return formatDate(value, 'dd/MM/yyyy HH:mm')
}

export function toInputValue(value?: string | null): string {
  if (!value) return ''
  const date = typeof value === 'string' ? parseISO(value) : value
  if (!isValid(date)) return ''
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

export function toUtcIso(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatPercent(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 100)
}
