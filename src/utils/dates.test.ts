import { describe, expect, it } from 'vitest'
import {
  addDaysIsoDate,
  daysOverdue,
  formatCzDate,
  formatCzDateTime,
  formatDaysCz,
  formatSchoolYear,
  getSchoolYearStart,
} from './dates'

describe('addDaysIsoDate', () => {
  it('přičte dny přes přelom měsíce a roku', () => {
    expect(addDaysIsoDate('2026-12-20', 30)).toBe('2027-01-19')
  })

  it('respektuje přestupný a nepřestupný únor', () => {
    expect(addDaysIsoDate('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDaysIsoDate('2025-02-28', 1)).toBe('2025-03-01')
  })

  it('zvládne nulový a záporný posun', () => {
    expect(addDaysIsoDate('2026-05-10', 0)).toBe('2026-05-10')
    expect(addDaysIsoDate('2026-05-01', -1)).toBe('2026-04-30')
  })
})

describe('daysOverdue', () => {
  it('vrátí 0 pro dnešní, budoucí nebo prázdný termín', () => {
    expect(daysOverdue('2026-11-25', '2026-11-25')).toBe(0)
    expect(daysOverdue('2026-11-30', '2026-11-25')).toBe(0)
    expect(daysOverdue('', '2026-11-25')).toBe(0)
  })

  it('spočítá přesný počet dní po termínu i přes přelom měsíce', () => {
    expect(daysOverdue('2026-11-24', '2026-11-25')).toBe(1)
    expect(daysOverdue('2026-10-30', '2026-11-02')).toBe(3)
  })
})

describe('formatCzDate', () => {
  it('formátuje ISO datum YYYY-MM-DD bez úvodních nul', () => {
    expect(formatCzDate('2026-03-05')).toBe('5. 3. 2026')
    expect(formatCzDate('2026-11-23')).toBe('23. 11. 2026')
  })

  it('vrátí pomlčku pro prázdné hodnoty', () => {
    expect(formatCzDate(null)).toBe('—')
    expect(formatCzDate(undefined)).toBe('—')
    expect(formatCzDate('')).toBe('—')
  })

  it('vrátí původní text při neplatném datu', () => {
    expect(formatCzDate('neplatne-datum')).toBe('neplatne-datum')
  })

  it('zvládne i ISO timestamp', () => {
    expect(formatCzDate('2026-06-15T12:00:00Z')).toMatch(/15\.\s*6\.\s*2026/)
  })
})

describe('formatCzDateTime', () => {
  it('vrátí pomlčku pro prázdné hodnoty a původní text pro neplatný vstup', () => {
    expect(formatCzDateTime(null)).toBe('—')
    expect(formatCzDateTime(undefined)).toBe('—')
    expect(formatCzDateTime('')).toBe('—')
    expect(formatCzDateTime('neni-datum')).toBe('neni-datum')
  })

  it('naformátuje platný ISO timestamp včetně času', () => {
    const formatted = formatCzDateTime('2026-06-15T12:30:00Z')
    expect(formatted).toContain('2026')
    expect(formatted).toMatch(/\d{1,2}:\d{2}/)
  })
})

describe('formatDaysCz', () => {
  it('správně skloňuje počet dní v češtině', () => {
    expect(formatDaysCz(0)).toBe('0 dní')
    expect(formatDaysCz(1)).toBe('1 den')
    expect(formatDaysCz(2)).toBe('2 dny')
    expect(formatDaysCz(4)).toBe('4 dny')
    expect(formatDaysCz(5)).toBe('5 dní')
    expect(formatDaysCz(21)).toBe('21 dní')
  })
})

describe('getSchoolYearStart & formatSchoolYear', () => {
  it('správně určí začátek školního roku na přelomu srpna a září', () => {
    expect(getSchoolYearStart('2026-08-31')).toBe(2025)
    expect(getSchoolYearStart('2026-09-01')).toBe(2026)
    expect(getSchoolYearStart('2027-01-15')).toBe(2026)
  })

  it('naformátuje školní rok', () => {
    expect(formatSchoolYear(2026)).toBe('2026/2027')
  })
})
