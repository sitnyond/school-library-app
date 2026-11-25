import type { SupabaseClient } from '@supabase/supabase-js'
import type { Loan, LoanFormData, LoanUpdateData } from '../types'

/** Spočítá počet aktivních (nevrácených) výpůjček pro každé ID knihy. */
export function countActiveLoansByBookId(activeLoans: readonly Loan[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const loan of activeLoans) {
    const key = String(loan.book_id)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

export async function createLoanRecord(client: SupabaseClient, data: LoanFormData): Promise<void> {
  const borrowerName = data.borrower_name.trim()
  if (!borrowerName) {
    throw new Error('Zadejte prosím jméno žáka.')
  }
  if (!data.book_id) {
    throw new Error('Vyberte prosím knihu.')
  }
  if (!data.class_id) {
    throw new Error('Vyberte prosím třídu.')
  }
  if (data.due_date < data.loaned_at) {
    throw new Error('Termín vrácení nemůže být dříve než datum půjčení.')
  }

  const [bookResult, activeCountResult] = await Promise.all([
    client.from('books').select('quantity').eq('id', data.book_id).single(),
    client
      .from('loans')
      .select('id', { count: 'exact', head: true })
      .eq('book_id', data.book_id)
      .is('returned_at', null),
  ])

  if (bookResult.error) throw bookResult.error
  if (activeCountResult.error) throw activeCountResult.error

  const activeCount = activeCountResult.count ?? 0
  if (activeCount >= bookResult.data.quantity) {
    throw new Error('Tato kniha nemá žádné volné kusy k půjčení.')
  }

  const { error } = await client.from('loans').insert([
    {
      book_id: data.book_id,
      class_id: data.class_id,
      borrower_name: borrowerName,
      loaned_at: data.loaned_at,
      due_date: data.due_date,
    },
  ])
  if (error) throw error
}

/** Vrátí knihu a trvale smaže jméno žáka (GDPR). */
export async function returnLoanRecord(
  client: SupabaseClient,
  id: string,
  now: Date = new Date(),
): Promise<void> {
  const { error } = await client
    .from('loans')
    .update({
      returned_at: now.toISOString(),
      borrower_name: null,
    })
    .eq('id', id)
    .is('returned_at', null)
  if (error) throw error
}

export async function extendLoanRecord(
  client: SupabaseClient,
  id: string,
  dueDate: string,
): Promise<void> {
  if (!dueDate) {
    throw new Error('Zadejte prosím platný termín vrácení.')
  }
  const { error } = await client
    .from('loans')
    .update({ due_date: dueDate })
    .eq('id', id)
    .is('returned_at', null)
  if (error) throw error
}

export async function updateLoanRecord(
  client: SupabaseClient,
  id: string,
  data: LoanUpdateData,
): Promise<void> {
  const borrowerName = data.borrower_name.trim()
  if (!borrowerName) {
    throw new Error('Zadejte prosím jméno žáka.')
  }
  if (!data.class_id) {
    throw new Error('Vyberte prosím třídu.')
  }
  if (!data.loaned_at || !data.due_date) {
    throw new Error('Zadejte prosím platné datum půjčení i termín vrácení.')
  }
  if (data.due_date < data.loaned_at) {
    throw new Error('Termín vrácení nemůže být dříve než datum půjčení.')
  }

  const { error } = await client
    .from('loans')
    .update({
      class_id: data.class_id,
      borrower_name: borrowerName,
      loaned_at: data.loaned_at,
      due_date: data.due_date,
    })
    .eq('id', id)
    .is('returned_at', null)
  if (error) throw error
}

export async function deleteLoanRecord(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('loans').delete().eq('id', id).is('returned_at', null)
  if (error) throw error
}
