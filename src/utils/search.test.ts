import { describe, expect, it } from 'vitest'
import { normalizeSearchText, tokenizeSearch } from './search'

describe('normalizeSearchText', () => {
  it('odstraní českou diakritiku a převede text na malá písmena', () => {
    expect(normalizeSearchText('Příliš žluťoučký kůň úpěl ďábelské ódy')).toBe(
      'prilis zlutoucky kun upel dabelske ody',
    )
  })

  it('zachová čísla a interpunkci (např. názvy tříd)', () => {
    expect(normalizeSearchText('5.A – Čapek')).toBe('5.a – capek')
  })
})

describe('tokenizeSearch', () => {
  it('rozdělí víceslovný dotaz s nepravidelnými mezerami na normalizované tokeny', () => {
    expect(tokenizeSearch('  Karel   Čapek\tDášeňka  ')).toEqual(['karel', 'capek', 'dasenka'])
  })

  it('vrátí prázdné pole pro prázdný nebo bílý vstup', () => {
    expect(tokenizeSearch('')).toEqual([])
    expect(tokenizeSearch('   \t\n  ')).toEqual([])
  })
})
