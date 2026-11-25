import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { AppSettings } from '../types'

const DEFAULT_APP_SETTINGS: AppSettings = { loan_days: 30, extension_days: 30 }

/** Nastavení aplikace – jediný řádek v tabulce app_settings. */
export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('app_settings')
        .select('loan_days, extension_days')
        .maybeSingle()
      if (error) throw error
      if (data) setSettings({ ...DEFAULT_APP_SETTINGS, ...data })
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Chyba při načítání nastavení')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const saveSettings = async (patch: Partial<AppSettings>) => {
    const { error } = await supabase.from('app_settings').update(patch).eq('id', true)
    if (error) throw error
    await fetchSettings()
  }

  return { settings, loading, errorMessage, setErrorMessage, fetchSettings, saveSettings }
}
