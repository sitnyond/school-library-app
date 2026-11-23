/** Vrátí dnešní lokální datum ve formátu YYYY-MM-DD. */
export function todayIsoDate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Přičte zadaný počet dní k datu YYYY-MM-DD a vrátí YYYY-MM-DD. */
export function addDaysIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  const ry = date.getFullYear()
  const rm = String(date.getMonth() + 1).padStart(2, '0')
  const rd = String(date.getDate()).padStart(2, '0')
  return `${ry}-${rm}-${rd}`
}

/** Počet dní po termínu (0, pokud ještě není po termínu). */
export function daysOverdue(dueDate: string, referenceIso: string = todayIsoDate()): number {
  if (!dueDate || dueDate >= referenceIso) return 0
  const [dy, dm, dd] = dueDate.split('-').map(Number)
  const [ry, rm, rd] = referenceIso.split('-').map(Number)
  const dueUtc = Date.UTC(dy, dm - 1, dd)
  const refUtc = Date.UTC(ry, rm - 1, rd)
  return Math.max(0, Math.round((refUtc - dueUtc) / 86_400_000))
}

/** Formátuje datum YYYY-MM-DD nebo ISO timestamp do českého formátu (např. 23. 11. 2026). */
export function formatCzDate(value: string | null | undefined): string {
  if (!value) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return `${d}. ${m}. ${y}`
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(date)
}

/** Formátuje ISO timestamp do českého data a času (např. 23. 11. 2026 17:40). */
export function formatCzDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Český tvar pro počet dní (1 den / 2–4 dny / 5+ dní). */
export function formatDaysCz(days: number): string {
  if (days === 1) return '1 den'
  if (days >= 2 && days <= 4) return `${days} dny`
  return `${days} dní`
}
