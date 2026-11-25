import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Loan } from '../types'
import {
  countActiveLoansByBookId,
  createLoanRecord,
  extendLoanRecord,
  returnLoanRecord,
  updateLoanRecord,
} from './loans'

function makeLoan(overrides: Partial<Loan> & { id: string; book_id: string }): Loan {
  return {
    class_id: 'c1',
    borrower_name: 'Jan N.',
    loaned_at: '2026-11-01',
    due_date: '2026-12-01',
    returned_at: null,
    created_at: '2026-11-01T08:00:00Z',
    created_by: null,
    created_by_email: null,
    ...overrides,
  }
}

function createMockSupabaseForCreate({
  quantity,
  activeCount,
  insertError = null,
}: {
  quantity: number
  activeCount: number
  insertError?: Error | null
}) {
  const insert = vi.fn().mockResolvedValue({ error: insertError })

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'books') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { quantity }, error: null }),
            }),
          }),
        }
      }
      if (table === 'loans') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ count: activeCount, error: null }),
            }),
          }),
          insert,
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    }),
  } as unknown as SupabaseClient

  return { client, insert }
}

function createMockSupabaseForUpdate(error: Error | null = null) {
  const is = vi.fn().mockResolvedValue({ error })
  const eq = vi.fn().mockReturnValue({ is })
  const update = vi.fn().mockReturnValue({ eq })
  const client = {
    from: vi.fn().mockReturnValue({ update }),
  } as unknown as SupabaseClient

  return { client, update, eq, is }
}

describe('countActiveLoansByBookId', () => {
  it('spočítá aktivní výpůjčky podle book_id', () => {
    const loans = [
      makeLoan({ id: 'l1', book_id: 'b1' }),
      makeLoan({ id: 'l2', book_id: 'b1' }),
      makeLoan({ id: 'l3', book_id: 'b2' }),
    ]
    const counts = countActiveLoansByBookId(loans)
    expect(counts.get('b1')).toBe(2)
    expect(counts.get('b2')).toBe(1)
    expect(counts.get('b3')).toBeUndefined()
  })
})

describe('createLoanRecord', () => {
  it('odmítne neplatná vstupní data ještě před dotazem do databáze', async () => {
    const from = vi.fn()
    const client = { from } as unknown as SupabaseClient

    await expect(
      createLoanRecord(client, {
        book_id: 'b1',
        class_id: 'c1',
        borrower_name: '   ',
        loaned_at: '2026-11-01',
        due_date: '2026-12-01',
      }),
    ).rejects.toThrow('jméno žáka')

    await expect(
      createLoanRecord(client, {
        book_id: '',
        class_id: 'c1',
        borrower_name: 'Petr',
        loaned_at: '2026-11-01',
        due_date: '2026-12-01',
      }),
    ).rejects.toThrow('knihu')

    await expect(
      createLoanRecord(client, {
        book_id: 'b1',
        class_id: '',
        borrower_name: 'Petr',
        loaned_at: '2026-11-01',
        due_date: '2026-12-01',
      }),
    ).rejects.toThrow('třídu')

    await expect(
      createLoanRecord(client, {
        book_id: 'b1',
        class_id: 'c1',
        borrower_name: 'Petr',
        loaned_at: '2026-11-10',
        due_date: '2026-11-09',
      }),
    ).rejects.toThrow('dříve než datum půjčení')

    expect(from).not.toHaveBeenCalled()
  })

  it('zablokuje půjčení, když nejsou žádné volné kusy', async () => {
    const { client, insert } = createMockSupabaseForCreate({ quantity: 2, activeCount: 2 })

    await expect(
      createLoanRecord(client, {
        book_id: 'b1',
        class_id: 'c1',
        borrower_name: 'Petr N.',
        loaned_at: '2026-11-01',
        due_date: '2026-12-01',
      }),
    ).rejects.toThrow('žádné volné kusy')

    expect(insert).not.toHaveBeenCalled()
  })

  it('vloží výpůjčku s oříznutým jménem žáka, když je volný kus', async () => {
    const { client, insert } = createMockSupabaseForCreate({ quantity: 2, activeCount: 1 })

    await createLoanRecord(client, {
      book_id: 'b1',
      class_id: 'c1',
      borrower_name: '  Petr N.  ',
      loaned_at: '2026-11-01',
      due_date: '2026-12-01',
    })

    expect(insert).toHaveBeenCalledWith([
      {
        book_id: 'b1',
        class_id: 'c1',
        borrower_name: 'Petr N.',
        loaned_at: '2026-11-01',
        due_date: '2026-12-01',
      },
    ])
  })
})

describe('returnLoanRecord (GDPR)', () => {
  it('při vrácení vždy vymaže borrower_name na null a cílí jen na aktivní výpůjčku', async () => {
    const { client, update, eq, is } = createMockSupabaseForUpdate()
    const now = new Date('2026-11-25T10:00:00.000Z')

    await returnLoanRecord(client, 'loan-123', now)

    expect(update).toHaveBeenCalledWith({
      returned_at: '2026-11-25T10:00:00.000Z',
      borrower_name: null,
    })
    expect(eq).toHaveBeenCalledWith('id', 'loan-123')
    expect(is).toHaveBeenCalledWith('returned_at', null)
  })
})

describe('extendLoanRecord & updateLoanRecord', () => {
  it('extendLoanRecord odmítne prázdný termín', async () => {
    const { client, update } = createMockSupabaseForUpdate()
    await expect(extendLoanRecord(client, 'loan-1', '')).rejects.toThrow('platný termín')
    expect(update).not.toHaveBeenCalled()
  })

  it('updateLoanRecord ohlídá termín a aktualizuje jen aktivní výpůjčku s oříznutým jménem', async () => {
    const { client, update, eq, is } = createMockSupabaseForUpdate()

    await expect(
      updateLoanRecord(client, 'loan-1', {
        class_id: 'c1',
        borrower_name: 'Eva K.',
        loaned_at: '2026-11-10',
        due_date: '2026-11-05',
      }),
    ).rejects.toThrow('dříve než datum půjčení')

    await updateLoanRecord(client, 'loan-1', {
      class_id: 'c2',
      borrower_name: '  Eva K.  ',
      loaned_at: '2026-11-10',
      due_date: '2026-12-10',
    })

    expect(update).toHaveBeenCalledWith({
      class_id: 'c2',
      borrower_name: 'Eva K.',
      loaned_at: '2026-11-10',
      due_date: '2026-12-10',
    })
    expect(eq).toHaveBeenCalledWith('id', 'loan-1')
    expect(is).toHaveBeenCalledWith('returned_at', null)
  })
})
