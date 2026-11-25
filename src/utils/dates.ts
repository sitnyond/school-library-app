import dayjs from 'dayjs'

/** Vrátí dnešní lokální datum ve formátu YYYY-MM-DD. */
export function todayIsoDate(): string {
  return dayjs().format('YYYY-MM-DD')
}

/** Přičte zadaný počet dní k datu YYYY-MM-DD a vrátí YYYY-MM-DD. */
export function addDaysIsoDate(isoDate: string, days: number): string {
  return dayjs(isoDate).add(days, 'day').format('YYYY-MM-DD')
}

/** Počet dní po termínu (0, pokud ještě není po termínu). */
export function daysOverdue(dueDate: string, referenceIso: string = todayIsoDate()): number {
  if (!dueDate || dueDate >= referenceIso) return 0
  return Math.max(0, dayjs(referenceIso).diff(dayjs(dueDate), 'day'))
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

/** Vrátí počáteční rok školního roku (září–srpen) pro datum YYYY-MM-DD. */
export function getSchoolYearStart(isoDate: string = todayIsoDate()): number {
  const [year, month] = isoDate.split('-').map(Number)
  return month >= 9 ? year : year - 1
}

/** Formátuje školní rok, např. 2026 -> "2026/2027". */
export function formatSchoolYear(startYear: number): string {
  return `${startYear}/${startYear + 1}`
}
