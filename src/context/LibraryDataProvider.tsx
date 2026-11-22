import type { ReactNode } from 'react'
import { useBooks } from '../hooks/useBooks'
import { useLookups } from '../hooks/useLookups'
import { LibraryDataContext } from './libraryDataContext'

/** Sdílená data pro všechny záložky (knihy, číselníky, později výpůjčky). */
export function LibraryDataProvider({ children }: { children: ReactNode }) {
  const books = useBooks()
  const lookups = useLookups()

  return <LibraryDataContext value={{ books, lookups }}>{children}</LibraryDataContext>
}
