import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Alert, Snackbar, type AlertColor } from '@mui/material'
import { SnackbarContext } from './snackbarContext'

interface NotificationState {
  id: number
  message: string
  severity: AlertColor
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationState | null>(null)
  const [open, setOpen] = useState(false)
  const nextId = useRef(0)

  const showNotification = useCallback((message: string, severity: AlertColor = 'success') => {
    nextId.current += 1
    setNotification({ id: nextId.current, message, severity })
    setOpen(true)
  }, [])

  const handleClose = (_event?: unknown, reason?: string) => {
    if (reason === 'clickaway') return
    setOpen(false)
  }

  return (
    <SnackbarContext value={{ showNotification }}>
      {children}
      <Snackbar
        key={notification?.id}
        open={open}
        autoHideDuration={3500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={notification?.severity ?? 'success'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification?.message ?? ''}
        </Alert>
      </Snackbar>
    </SnackbarContext>
  )
}
