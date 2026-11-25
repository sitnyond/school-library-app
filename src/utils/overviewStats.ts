import type { Book, Loan, LookupOption } from '../types'
import { daysOverdue, formatSchoolYear, getSchoolYearStart } from './dates'

export interface BookLoanRank {
  id: string
  rank: number
  title: string
  author: string | null
  typeName: string
  count: number
}

const MONTH_SHORT_FORMATTER = new Intl.DateTimeFormat('cs-CZ', { month: 'short' })

/** Měsíce zvoleného školního roku (září až červen). */
export function getSchoolYearMonths(startYear: number): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = []
  for (let offset = 0; offset < 10; offset++) {
    const date = new Date(startYear, 8 + offset, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.push({ key, label: MONTH_SHORT_FORMATTER.format(date) })
  }
  return months
}

/** Seznam dostupných školních roků (sestupně), vždy obsahuje aktuální školní rok. */
export function getAvailableSchoolYears(loans: readonly Loan[], currentSchoolYear: number): number[] {
  const years = new Set<number>([currentSchoolYear])
  for (const loan of loans) {
    if (loan.loaned_at) {
      years.add(getSchoolYearStart(loan.loaned_at))
    }
  }
  return Array.from(years).sort((a, b) => b - a)
}

/** Vyfiltruje výpůjčky podle zvoleného školního roku (nebo vrátí všechny při `'all'`). */
export function filterLoansByPeriod(loans: readonly Loan[], selectedPeriod: 'all' | number): Loan[] {
  if (selectedPeriod === 'all') return [...loans]
  return loans.filter((loan) => getSchoolYearStart(loan.loaned_at) === selectedPeriod)
}

/** Aktivní výpůjčky po termínu seřazené od nejdelšího prodlení. */
export function getOverdueLoans(
  activeLoans: readonly Loan[],
  today: string,
): { loan: Loan; overdueDays: number }[] {
  return activeLoans
    .map((loan) => ({ loan, overdueDays: daysOverdue(loan.due_date, today) }))
    .filter((item) => item.overdueDays > 0)
    .sort((a, b) => b.overdueDays - a.overdueDays)
}

/** Počty výpůjček podle tříd (zahrnuje i třídy s 0 výpůjčkami), seřazené numericky česky. */
export function computeClassStats(
  classes: readonly LookupOption[],
  periodLoans: readonly Loan[],
): { labels: string[]; counts: number[] } {
  const counts = new Map<string, number>()
  for (const cls of classes) {
    counts.set(cls.name, 0)
  }
  for (const loan of periodLoans) {
    const name = loan.class?.name ?? 'Neznámá'
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  const entries = Array.from(counts.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], 'cs', { numeric: true }),
  )
  return {
    labels: entries.map(([label]) => label),
    counts: entries.map(([, count]) => count),
  }
}

/** Počty výpůjček podle typů knih (sestupně podle počtu). */
export function computeTypeStats(
  books: readonly Book[],
  periodLoans: readonly Loan[],
): { id: number; label: string; value: number }[] {
  const typeByBookId = new Map<string, string>()
  for (const book of books) {
    typeByBookId.set(String(book.id), book.type?.name ?? 'Bez typu')
  }
  const counts = new Map<string, number>()
  for (const loan of periodLoans) {
    const typeName = typeByBookId.get(String(loan.book_id)) ?? 'Bez typu'
    counts.set(typeName, (counts.get(typeName) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], id) => ({ id, label, value }))
}

/** Data pro časový sloupcový graf (buď po školních rocích, nebo po měsících září–červen). */
export function computeTimeChart(
  selectedPeriod: 'all' | number,
  availableSchoolYears: readonly number[],
  loans: readonly Loan[],
  periodLoans: readonly Loan[],
): { title: string; axisLabel: string; labels: string[]; counts: number[] } {
  if (selectedPeriod === 'all') {
    const yearsAsc = [...availableSchoolYears].sort((a, b) => a - b)
    const counts = new Map<number, number>(yearsAsc.map((y) => [y, 0]))
    for (const loan of loans) {
      const y = getSchoolYearStart(loan.loaned_at)
      counts.set(y, (counts.get(y) ?? 0) + 1)
    }
    return {
      title: 'Výpůjčky podle školních roků',
      axisLabel: 'Školní rok',
      labels: yearsAsc.map((y) => formatSchoolYear(y)),
      counts: yearsAsc.map((y) => counts.get(y) ?? 0),
    }
  }

  const months = getSchoolYearMonths(selectedPeriod)
  const counts = new Map<string, number>(months.map((m) => [m.key, 0]))
  for (const loan of periodLoans) {
    const monthKey = loan.loaned_at.slice(0, 7)
    if (counts.has(monthKey)) {
      counts.set(monthKey, (counts.get(monthKey) ?? 0) + 1)
    }
  }
  return {
    title: `Výpůjčky ve školním roce ${formatSchoolYear(selectedPeriod)} (září–červen)`,
    axisLabel: 'Měsíc',
    labels: months.map((m) => m.label),
    counts: months.map((m) => counts.get(m.key) ?? 0),
  }
}

/** Žebříček všech knih podle počtu výpůjček ve zvoleném období (při shodě abecedně česky). */
export function computeBookRankings(
  books: readonly Book[],
  periodLoans: readonly Loan[],
): BookLoanRank[] {
  const counts = new Map<string, number>()
  for (const loan of periodLoans) {
    const key = String(loan.book_id)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const items = books.map((book) => ({
    id: String(book.id),
    title: book.title,
    author: book.author,
    typeName: book.type?.name ?? 'Bez typu',
    count: counts.get(String(book.id)) ?? 0,
  }))

  items.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'cs'))
  return items.map((item, index) => ({ ...item, rank: index + 1 }))
}
