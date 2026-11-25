import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('přeloží chybu porušení cizího klíče (23503) na čitelnou hlášku', () => {
    expect(getErrorMessage({ code: '23503', message: 'foreign key violation' }, 'Fallback')).toBe(
      'Nelze smazat: záznam se stále používá (např. existují výpůjčky).',
    )
  })

  it('přeloží chybu duplicity (23505) na čitelnou hlášku', () => {
    expect(getErrorMessage({ code: '23505', message: 'duplicate key value' }, 'Fallback')).toBe(
      'Záznam s tímto názvem už existuje.',
    )
  })

  it('přečte message ze standardního Error i z PostgrestError objektu', () => {
    expect(getErrorMessage(new Error('Chyba připojení'), 'Fallback')).toBe('Chyba připojení')
    expect(getErrorMessage({ code: 'PGRST116', message: 'Row not found' }, 'Fallback')).toBe(
      'Row not found',
    )
  })

  it('vrátí fallback při prázdné zprávě nebo neznámém tvaru chyby', () => {
    expect(getErrorMessage({ message: '' }, 'Fallback')).toBe('Fallback')
    expect(getErrorMessage(null, 'Fallback')).toBe('Fallback')
    expect(getErrorMessage(undefined, 'Fallback')).toBe('Fallback')
    expect(getErrorMessage('prostý string', 'Fallback')).toBe('Fallback')
  })
})
