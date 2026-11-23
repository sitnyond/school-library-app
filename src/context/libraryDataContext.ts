import { createContext, useContext } from 'react'
import type { useBooks } from '../hooks/useBooks'
import type { useLookups } from '../hooks/useLookups'
import type { useAppSettings } from '../hooks/useAppSettings'

export interface LibraryData {
  books: ReturnType<typeof useBooks>
  lookups: ReturnType<typeof useLookups>
  appSettings: ReturnType<typeof useAppSettings>
}

export const LibraryDataContext = createContext<LibraryData | null>(null)

export function useLibraryData(): LibraryData {
  const ctx = useContext(LibraryDataContext)
  if (!ctx) throw new Error('useLibraryData musí být použit uvnitř LibraryDataProvider')
  return ctx
}
