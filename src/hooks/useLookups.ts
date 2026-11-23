import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { LookupOption } from '../types'

export type LookupTable = 'book_types' | 'placements' | 'classes'

/** Kde se daná položka číselníku používá (kvůli kontrole před smazáním). */
const usage: Record<LookupTable, { table: 'books' | 'loans'; column: string; message: string }> = {
  book_types: { table: 'books', column: 'type_id', message: 'Nelze smazat: tento typ používá alespoň jedna kniha.' },
  placements: { table: 'books', column: 'placement_id', message: 'Nelze smazat: toto umístění používá alespoň jedna kniha.' },
  classes: { table: 'loans', column: 'class_id', message: 'Nelze smazat: k této třídě existují výpůjčky (i v historii).' },
}

function lookupErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: string }).code
    if (code === '23503') {
      return 'Nelze smazat: položka se stále používá.'
    }
    if (code === '23505') {
      return 'Položka s tímto názvem už existuje.'
    }
  }
  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  return fallback
}

export function useLookups() {
  const [types, setTypes] = useState<LookupOption[]>([])
  const [placements, setPlacements] = useState<LookupOption[]>([])
  const [classes, setClasses] = useState<LookupOption[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchLookups = useCallback(async () => {
    try {
      setLoading(true)
      const [typesResult, placementsResult, classesResult] = await Promise.all([
        supabase.from('book_types').select('id, name').order('name'),
        supabase.from('placements').select('id, name').order('name'),
        supabase.from('classes').select('id, name').order('name'),
      ])
      if (typesResult.error) throw typesResult.error
      if (placementsResult.error) throw placementsResult.error
      if (classesResult.error) throw classesResult.error
      setTypes(typesResult.data || [])
      setPlacements(placementsResult.data || [])
      setClasses(classesResult.data || [])
    } catch (err: unknown) {
      setErrorMessage(lookupErrorMessage(err, 'Chyba při načítání číselníků'))
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
    const { table: usageTable, column, message } = usage[table]
    const { data: rowsUsingIt, error: checkError } = await supabase
      .from(usageTable)
      .select('id')
      .eq(column, id)
      .limit(1)

    if (checkError) throw checkError
    if (rowsUsingIt && rowsUsingIt.length > 0) throw new Error(message)

    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error

    await fetchLookups()
  }

  return {
    types,
    placements,
    classes,
    loading,
    errorMessage,
    setErrorMessage,
    fetchLookups,
    saveLookup,
    deleteLookup,
    lookupErrorMessage,
  }
}
