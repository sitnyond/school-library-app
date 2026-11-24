import { useState, type SyntheticEvent } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

import { useLibraryData } from '../../context/libraryDataContext'
import { useSnackbar } from '../../context/snackbarContext'
import type { Loan } from '../../types'
import { addDaysIsoDate, formatCzDate, todayIsoDate } from '../../utils/dates'
import { getErrorMessage } from '../../utils/errors'

interface ExtendLoanDialogProps {
  loan: Loan | null
  onClose: () => void
}

function ExtendLoanDialogContent({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const { appSettings, loans } = useLibraryData()
  const { showNotification } = useSnackbar()

  const extensionDays = appSettings.settings.extension_days
  const today = todayIsoDate()
  const baseDate = loan.due_date > today ? loan.due_date : today
  const [newDueDate, setNewDueDate] = useState(addDaysIsoDate(baseDate, extensionDays))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError(null)

    if (!newDueDate) {
      setError('Zadejte prosím platný termín vrácení.')
      return
    }
    if (newDueDate < loan.loaned_at) {
      setError('Termín vrácení nemůže být dříve než datum půjčení.')
      return
    }

    setIsSubmitting(true)
    try {
      await loans.extendLoan(loan.id, newDueDate)
      showNotification(`Výpůjčka byla prodloužena do ${formatCzDate(newDueDate)}.`)
      onClose()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Chyba při prodlužování výpůjčky'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>Prodloužit výpůjčku</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Typography variant="body2">
            <strong>{loan.book?.title ?? 'Kniha'}</strong>
            {loan.class?.name ? ` (${loan.class.name})` : ''}
            {loan.borrower_name ? ` – ${loan.borrower_name}` : ''}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Aktuální termín vrácení: <strong>{formatCzDate(loan.due_date)}</strong>
          </Typography>

          <DatePicker
            label="Nový termín vrácení"
            format="DD.MM.YYYY"
            value={newDueDate ? dayjs(newDueDate) : null}
            minDate={dayjs(loan.loaned_at)}
            onChange={(value: Dayjs | null) =>
              setNewDueDate(value && value.isValid() ? value.format('YYYY-MM-DD') : '')
            }
            slotProps={{
              textField: {
                required: true,
                fullWidth: true,
                helperText: `Výchozí prodloužení: +${extensionDays} dní`,
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Zrušit
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Ukládám...' : 'Prodloužit'}
        </Button>
      </DialogActions>
    </form>
  )
}

export function ExtendLoanDialog({ loan, onClose }: ExtendLoanDialogProps) {
  return (
    <Dialog open={Boolean(loan)} onClose={onClose} maxWidth="xs" fullWidth>
      {loan && <ExtendLoanDialogContent loan={loan} onClose={onClose} />}
    </Dialog>
  )
}
