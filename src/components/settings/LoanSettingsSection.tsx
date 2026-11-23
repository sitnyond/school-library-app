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
  const [saved, setSaved] = useState(false)
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
      setSaved(true)
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
    <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6">Výpůjčky</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Výchozí lhůta pro vrácení. U konkrétní výpůjčky ji půjde upravit.
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          size="small"
          type="number"
          label="Délka výpůjčky"
          value={value}
          disabled={disabled}
          error={!isValid}
          helperText={!isValid ? 'Zadejte 1–365 dní' : saved && !isDirty ? 'Uloženo' : ' '}
          onChange={(e) => { setDraft(e.target.value); setSaved(false) }}
          slotProps={{
            htmlInput: { min: 1, max: 365 },
            input: { endAdornment: <InputAdornment position="end">dní</InputAdornment> },
          }}
          sx={{ width: 200 }}
        />
        <Button type="submit" variant="contained" disabled={disabled || busy || !isValid || !isDirty}>
          Uložit
        </Button>
      </Box>

      <Divider sx={{ my: 2.5 }} />

      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Historie vrácených výpůjček
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
        Vrácené výpůjčky (už anonymizované bez jména) zůstávají pro statistiky. Záznamů v historii:{' '}
        <strong>{historyCount}</strong>.
      </Typography>
      <Button
        variant="outlined"
        color="error"
        size="small"
        startIcon={<DeleteSweepIcon />}
        disabled={disabled || busy || clearing || historyCount === 0}
        onClick={() => setConfirmOpen(true)}
      >
        Smazat historii výpůjček
      </Button>

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
