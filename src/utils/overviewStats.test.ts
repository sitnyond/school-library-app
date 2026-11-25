import { describe, expect, it } from 'vitest'
import type { Book, Loan, LookupOption } from '../types'
import {
  computeBookRankings,
  computeClassStats,
  computeTimeChart,
  computeTypeStats,
  filterLoansByPeriod,
  getAvailableSchoolYears,
  getOverdueLoans,
  getSchoolYearMonths,
} from './overviewStats'

function makeBook(overrides: Partial<Book> & { id: string; title: string }): Book {
  return {
    author: null,
    publisher: null,
    type_id: 't1',
    placement_id: 'p1',
    quantity: 1,
    type: { id: 't1', name: 'Beletrie' },
    placement: { id: 'p1', name: 'A1' },
    ...overrides,
  }
}

function makeLoan(overrides: Partial<Loan> & { id: string; book_id: string }): Loan {
  return {
    class_id: 'c1',
    borrower_name: 'Petr N.',
    loaned_at: '2026-10-10',
    due_date: '2026-11-10',
    returned_at: null,
    created_at: '2026-10-10T08:00:00Z',
    created_by: null,
    created_by_email: null,
    class: { id: 'c1', name: '5.A' },
    ...overrides,
  }
}

describe('getSchoolYearMonths', () => {
  it('vrátí 10 měsíců od září do června', () => {
    const months = getSchoolYearMonths(2026)
    expect(months).toHaveLength(10)
    expect(months[0].key).toBe('2026-09')
    expect(months[3].key).toBe('2026-12')
    expect(months[4].key).toBe('2027-01')
    expect(months[9].key).toBe('2027-06')
  })
})

describe('getAvailableSchoolYears & filterLoansByPeriod', () => {
  const loans = [
    makeLoan({ id: 'l1', book_id: 'b1', loaned_at: '2025-08-31' }), // šk. rok 2024/2025
    makeLoan({ id: 'l2', book_id: 'b1', loaned_at: '2025-09-01' }), // šk. rok 2025/2026
    makeLoan({ id: 'l3', book_id: 'b1', loaned_at: '2026-02-15' }), // šk. rok 2025/2026
  ]

  it('vždy zahrne aktuální školní rok a seřadí roky sestupně', () => {
    expect(getAvailableSchoolYears(loans, 2026)).toEqual([2026, 2025, 2024])
    expect(getAvailableSchoolYears([], 2026)).toEqual([2026])
  })

  it('správně filtruje výpůjčky pro konkrétní školní rok i pro všechny roky', () => {
    expect(filterLoansByPeriod(loans, 'all').map((l) => l.id)).toEqual(['l1', 'l2', 'l3'])
    expect(filterLoansByPeriod(loans, 2025).map((l) => l.id)).toEqual(['l2', 'l3'])
    expect(filterLoansByPeriod(loans, 2024).map((l) => l.id)).toEqual(['l1'])
  })
})

describe('getOverdueLoans', () => {
  it('vybere jen výpůjčky po termínu a seřadí je od nejdelšího prodlení', () => {
    const activeLoans = [
      makeLoan({ id: 'ok', book_id: 'b1', due_date: '2026-11-25' }),
      makeLoan({ id: 'future', book_id: 'b1', due_date: '2026-11-30' }),
      makeLoan({ id: 'late2', book_id: 'b1', due_date: '2026-11-23' }),
      makeLoan({ id: 'late10', book_id: 'b1', due_date: '2026-11-15' }),
    ]

    const result = getOverdueLoans(activeLoans, '2026-11-25')
    expect(result.map((r) => [r.loan.id, r.overdueDays])).toEqual([
      ['late10', 10],
      ['late2', 2],
    ])
  })
})

describe('computeClassStats', () => {
  it('zahrne třídy s nulou, použije fallback Neznámá a řadí česky numericky', () => {
    const classes: LookupOption[] = [
      { id: 'c10', name: '10.A' },
      { id: 'c2', name: '2.A' },
      { id: 'c1', name: '1.A' },
    ]
    const loans = [
      makeLoan({ id: 'l1', book_id: 'b1', class: { id: 'c10', name: '10.A' } }),
      makeLoan({ id: 'l2', book_id: 'b1', class: { id: 'c2', name: '2.A' } }),
      makeLoan({ id: 'l3', book_id: 'b1', class: { id: 'c2', name: '2.A' } }),
      makeLoan({ id: 'l4', book_id: 'b1', class: null }),
    ]

    expect(computeClassStats(classes, loans)).toEqual({
      labels: ['1.A', '2.A', '10.A', 'Neznámá'],
      counts: [0, 2, 1, 1],
    })
  })
})

describe('computeTypeStats', () => {
  it('sečte výpůjčky podle typů knih sestupně a přiřadí fallback Bez typu', () => {
    const books = [
      makeBook({ id: 'b1', title: 'Kniha 1', type: { id: 't1', name: 'Komiks' } }),
      makeBook({ id: 'b2', title: 'Kniha 2', type: { id: 't2', name: 'Pohádky' } }),
      makeBook({ id: 'b3', title: 'Kniha 3', type: null }),
    ]
    const loans = [
      makeLoan({ id: 'l1', book_id: 'b2' }),
      makeLoan({ id: 'l2', book_id: 'b2' }),
      makeLoan({ id: 'l3', book_id: 'b1' }),
      makeLoan({ id: 'l4', book_id: 'b3' }),
      makeLoan({ id: 'l5', book_id: 'neexistuje' }),
    ]

    expect(computeTypeStats(books, loans)).toEqual([
      { id: 0, label: 'Pohádky', value: 2 },
      { id: 1, label: 'Bez typu', value: 2 },
      { id: 2, label: 'Komiks', value: 1 },
    ])
  })
})

describe('computeTimeChart', () => {
  const loans = [
    makeLoan({ id: 'l1', book_id: 'b1', loaned_at: '2025-10-05' }),
    makeLoan({ id: 'l2', book_id: 'b1', loaned_at: '2026-09-12' }),
    makeLoan({ id: 'l3', book_id: 'b1', loaned_at: '2026-09-20' }),
    makeLoan({ id: 'l4', book_id: 'b1', loaned_at: '2027-07-15' }), // prázdniny (mimo září–červen)
  ]

  it('při volbě all agreguje vzestupně podle školních roků', () => {
    const chart = computeTimeChart('all', [2026, 2025], loans, loans)
    expect(chart.labels).toEqual(['2025/2026', '2026/2027'])
    expect(chart.counts).toEqual([1, 3])
  })

  it('pro konkrétní školní rok agreguje po měsících září–červen a ignoruje červenec/srpen', () => {
    const periodLoans = filterLoansByPeriod(loans, 2026)
    const chart = computeTimeChart(2026, [2026, 2025], loans, periodLoans)
    expect(chart.labels).toHaveLength(10)
    expect(chart.counts[0]).toBe(2) // září 2026
    expect(chart.counts.reduce((sum, n) => sum + n, 0)).toBe(2) // červenec se nepočítá
  })
})

describe('computeBookRankings', () => {
  it('seřadí knihy podle počtu výpůjček sestupně a při shodě česky abecedně', () => {
    const books = [
      makeBook({ id: 'b1', title: 'Čapek' }),
      makeBook({ id: 'b2', title: 'Babička' }),
      makeBook({ id: 'b3', title: 'Dášeňka', type: null }),
    ]
    const loans = [
      makeLoan({ id: 'l1', book_id: 'b3' }),
      makeLoan({ id: 'l2', book_id: 'b3' }),
      makeLoan({ id: 'l3', book_id: 'b1' }),
      makeLoan({ id: 'l4', book_id: 'b2' }),
    ]

    expect(computeBookRankings(books, loans)).toEqual([
      { id: 'b3', rank: 1, title: 'Dášeňka', author: null, typeName: 'Bez typu', count: 2 },
      { id: 'b2', rank: 2, title: 'Babička', author: null, typeName: 'Beletrie', count: 1 },
      { id: 'b1', rank: 3, title: 'Čapek', author: null, typeName: 'Beletrie', count: 1 },
    ])
  })
})
