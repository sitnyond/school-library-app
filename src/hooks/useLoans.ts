import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  countActiveLoansByBookId,
  createLoanRecord,
  deleteLoanRecord,
  extendLoanRecord,
  returnLoanRecord,
  updateLoanRecord,
} from '../services/loans'
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

  const activeLoanCountByBookId = useMemo(
    () => countActiveLoansByBookId(activeLoans),
    [activeLoans],
  )

  const getActiveLoanCount = useCallback(
    (bookId: Book['id']) => activeLoanCountByBookId.get(String(bookId)) ?? 0,
    [activeLoanCountByBookId],
  )

  const createLoan = async (data: LoanFormData) => {
    await createLoanRecord(supabase, data)
    await fetchLoans()
  }

  const returnLoan = async (id: string) => {
    await returnLoanRecord(supabase, id)
    await fetchLoans()
  }

  const extendLoan = async (id: string, dueDate: string) => {
    await extendLoanRecord(supabase, id, dueDate)
    await fetchLoans()
  }

  const updateLoan = async (id: string, data: LoanUpdateData) => {
    await updateLoanRecord(supabase, id, data)
    await fetchLoans()
  }

  const deleteLoan = async (id: string) => {
    await deleteLoanRecord(supabase, id)
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
