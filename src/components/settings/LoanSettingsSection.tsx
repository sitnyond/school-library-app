import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'

interface LoanSettingsSectionProps {
  loanDays: number
  historyCount: number
  disabled?: boolean
  onSave: (loanDays: number) => Promise<void>
  onClearHistory: () => Promise<void>
  onError: (err: unknown, fallback: string) => void
}

export function LoanSettingsSection({
  loanDays,
  historyCount,
  disabled,
  onSave,
  onClearHistory,
  onError,
}: LoanSettingsSectionProps) {
  // null = uživatel zatím nic nezměnil, zobrazuje se hodnota z DB
  const [draft, setDraft] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const value = draft ?? String(loanDays)
  const parsed = Number.parseInt(value, 10)
  const isValid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 365
  const isDirty = draft !== null && parsed !== loanDays

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!isValid) return
    setBusy(true)
    try {
      await onSave(parsed)
      setDraft(null)
    } catch (err: unknown) {
      onError(err, 'Chyba při ukládání nastavení')
    } finally {
      setBusy(false)
    }
  }

  const handleClearHistory = async () => {
    setClearing(true)
    try {
      await onClearHistory()
      setConfirmOpen(false)
    } catch (err: unknown) {
      onError(err, 'Chyba při mazání historie výpůjček')
      setConfirmOpen(false)
    } finally {
      setClearing(false)
    }
  }

  return (
    <Paper elevation={1} sx={{ px: 2.5, py: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />}
        sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Výpůjčky
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              type="number"
              label="Délka výpůjčky"
              value={value}
              disabled={disabled}
              error={!isValid}
              helperText={!isValid ? 'Zadejte 1–365 dní' : undefined}
              onChange={(e) => setDraft(e.target.value)}
              slotProps={{
                htmlInput: { min: 1, max: 365 },
                input: { endAdornment: <InputAdornment position="end">dní</InputAdornment> },
              }}
              sx={{ width: 170 }}
            />
            <Button type="submit" size="small" variant="contained" disabled={disabled || busy || !isValid || !isDirty}>
              Uložit
            </Button>
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
          <Typography variant="body2" color="text.secondary">
            Historie vrácených výpůjček: <strong>{historyCount}</strong>
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteSweepIcon />}
            disabled={disabled || busy || clearing || historyCount === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Smazat historii
          </Button>
        </Stack>
      </Stack>

      <Dialog open={confirmOpen} onClose={() => !clearing && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Smazat historii výpůjček?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Opravdu chcete trvale smazat <strong>{historyCount}</strong> vrácených výpůjček z historie? Aktivní
            (nevrácené) výpůjčky zůstanou zachovány. Tato akce ovlivní statistiky a nelze ji vzít zpět.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={clearing}>
            Zrušit
          </Button>
          <Button onClick={handleClearHistory} color="error" variant="contained" disabled={clearing}>
            {clearing ? 'Mažu...' : 'Smazat historii'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
