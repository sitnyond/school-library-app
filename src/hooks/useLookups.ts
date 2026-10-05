import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { LookupOption } from '../types'

export type LookupTable = 'book_types' | 'placements'

function lookupErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: string }).code
    if (code === '23503') {
      return 'Nelze smazat: tuto hodnotu už používá alespoň jedna kniha.'
    }
    if (code === '23505') {
      return 'Položka s tímto názvem už existuje.'
    }
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export function useLookups() {
  const [types, setTypes] = useState<LookupOption[]>([])
  const [placements, setPlacements] = useState<LookupOption[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchLookups = useCallback(async () => {
    try {
      setLoading(true)
      const [typesResult, placementsResult] = await Promise.all([
        supabase.from('book_types').select('id, name').order('name'),
        supabase.from('placements').select('id, name').order('name'),
      ])
      if (typesResult.error) throw typesResult.error
      if (placementsResult.error) throw placementsResult.error
      setTypes(typesResult.data || [])
      setPlacements(placementsResult.data || [])
    } catch (err: unknown) {
      setErrorMessage(lookupErrorMessage(err, 'Chyba při načítání typů a umístění'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  const saveLookup = async (table: LookupTable, name: string, id?: string) => {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Název nesmí být prázdný.')
    if (id) {
      const { error } = await supabase.from(table).update({ name: trimmed }).eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase.from(table).insert([{ name: trimmed }])
      if (error) throw error
    }
    await fetchLookups()
  }

  const deleteLookup = async (table: LookupTable, id: string) => {
    const fkColumn = table === 'book_types' ? 'type_id' : 'placement_id'
    const { data: booksUsingIt, error: checkError } = await supabase
      .from('books')
      .select('id')
      .eq(fkColumn, id)
      .limit(1)

    if (checkError) throw checkError

    if (booksUsingIt && booksUsingIt.length > 0) {
      throw new Error('Nelze smazat: tuto hodnotu už používá alespoň jedna kniha.')
    }

    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
    
    await fetchLookups()
  }

  return {
    types,
    placements,
    loading,
    errorMessage,
    setErrorMessage,
    fetchLookups,
    saveLookup,
    deleteLookup,
    lookupErrorMessage,
  }
}
