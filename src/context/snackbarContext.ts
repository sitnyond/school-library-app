import { createContext, useContext } from 'react'
import type { AlertColor } from '@mui/material'

interface SnackbarContextValue {
  showNotification: (message: string, severity?: AlertColor) => void
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null)

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error('useSnackbar musí být použit uvnitř SnackbarProvider')
  return ctx
}
