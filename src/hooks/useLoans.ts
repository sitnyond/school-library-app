import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Book, Loan, LoanFormData, LoanUpdateData } from '../types'
import { getErrorMessage } from '../utils/errors'

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('loans')
        .select('*, book:books(id, title, author), class:classes(id, name)')
        .order('loaned_at', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) {
        setErrorMessage(`Chyba při načítání výpůjček: ${error.message}`)
      } else {
        setLoans((data as Loan[]) || [])
      }
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'Neznámá chyba při načítání výpůjček'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  const activeLoans = useMemo(() => loans.filter((loan) => loan.returned_at === null), [loans])

  const returnedLoans = useMemo(() => loans.filter((loan) => loan.returned_at !== null), [loans])

  const activeLoanCountByBookId = useMemo(() => {
    const counts = new Map<string, number>()
    for (const loan of activeLoans) {
      const key = String(loan.book_id)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [activeLoans])

  const getActiveLoanCount = useCallback(
    (bookId: Book['id']) => activeLoanCountByBookId.get(String(bookId)) ?? 0,
    [activeLoanCountByBookId],
  )

  const createLoan = async (data: LoanFormData) => {
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
      supabase.from('books').select('quantity').eq('id', data.book_id).single(),
      supabase
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

    const { error } = await supabase.from('loans').insert([
      {
        book_id: data.book_id,
        class_id: data.class_id,
        borrower_name: borrowerName,
        loaned_at: data.loaned_at,
        due_date: data.due_date,
      },
    ])
    if (error) throw error

    await fetchLoans()
  }

  const returnLoan = async (id: string) => {
    const { error } = await supabase
      .from('loans')
      .update({
        returned_at: new Date().toISOString(),
        borrower_name: null,
      })
      .eq('id', id)
      .is('returned_at', null)
    if (error) throw error

    await fetchLoans()
  }

  const extendLoan = async (id: string, dueDate: string) => {
    if (!dueDate) {
      throw new Error('Zadejte prosím platný termín vrácení.')
    }
    const { error } = await supabase
      .from('loans')
      .update({ due_date: dueDate })
      .eq('id', id)
      .is('returned_at', null)
    if (error) throw error

    await fetchLoans()
  }

  const updateLoan = async (id: string, data: LoanUpdateData) => {
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

    const { error } = await supabase
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

    await fetchLoans()
  }

  const deleteLoan = async (id: string) => {
    const { error } = await supabase.from('loans').delete().eq('id', id).is('returned_at', null)
    if (error) throw error

    await fetchLoans()
  }

  return {
    loans,
    activeLoans,
    returnedLoans,
    activeLoanCountByBookId,
    getActiveLoanCount,
    loading,
    errorMessage,
    setErrorMessage,
    fetchLoans,
    createLoan,
    returnLoan,
    extendLoan,
    updateLoan,
    deleteLoan,
  }
}
