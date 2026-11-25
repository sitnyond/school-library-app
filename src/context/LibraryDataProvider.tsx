import type { ReactNode } from 'react'
import { useBooks } from '../hooks/useBooks'
import { useLookups } from '../hooks/useLookups'
import { useAppSettings } from '../hooks/useAppSettings'
import { useLoans } from '../hooks/useLoans'
import { LibraryDataContext } from './libraryDataContext'

/** Sdílená data pro všechny záložky (knihy, číselníky, nastavení, výpůjčky). */
export function LibraryDataProvider({ children }: { children: ReactNode }) {
  const books = useBooks()
  const lookups = useLookups()
  const appSettings = useAppSettings()
  const loans = useLoans()

  return <LibraryDataContext value={{ books, lookups, appSettings, loans }}>{children}</LibraryDataContext>
}
