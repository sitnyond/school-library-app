import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Book, BookFormData } from '../types'

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('books')
        .select('*, type:book_types(id, name), placement:placements(id, name)')
        .order('id', { ascending: false })
      if (error) {
        setErrorMessage(`Chyba při načítání knih: ${error.message}`)
      } else {
        setBooks(data || [])
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Neznámá chyba při načítání knih')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const saveBook = async (cleanData: BookFormData, editingId: string | null) => {
    if (editingId) {
      const { error } = await supabase.from('books').update(cleanData).eq('id', editingId)
      if (error) throw error
    } else {
      const { error } = await supabase.from('books').insert([cleanData])
      if (error) throw error
    }
    fetchBooks()
  }

  const deleteBook = async (id: string) => {
    const { error } = await supabase.from('books').delete().eq('id', id)
    if (error) throw error
    fetchBooks()
  }

  return {
    books,
    loading,
    errorMessage,
    setErrorMessage,
    fetchBooks,
    saveBook,
    deleteBook,
  }
}
