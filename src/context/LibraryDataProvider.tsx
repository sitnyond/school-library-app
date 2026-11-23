import type { ReactNode } from 'react'
import { useBooks } from '../hooks/useBooks'
import { useLookups } from '../hooks/useLookups'
import { useAppSettings } from '../hooks/useAppSettings'
import { LibraryDataContext } from './libraryDataContext'

/** Sdílená data pro všechny záložky (knihy, číselníky, nastavení, později výpůjčky). */
export function LibraryDataProvider({ children }: { children: ReactNode }) {
  const books = useBooks()
  const lookups = useLookups()
  const appSettings = useAppSettings()

  return <LibraryDataContext value={{ books, lookups, appSettings }}>{children}</LibraryDataContext>
}
