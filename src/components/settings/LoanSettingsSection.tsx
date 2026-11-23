import { useState } from 'react'
import { Box, Button, InputAdornment, Paper, TextField, Typography } from '@mui/material'

interface LoanSettingsSectionProps {
  loanDays: number
  disabled?: boolean
  onSave: (loanDays: number) => Promise<void>
  onError: (err: unknown, fallback: string) => void
}

export function LoanSettingsSection({ loanDays, disabled, onSave, onError }: LoanSettingsSectionProps) {
  // null = uživatel zatím nic nezměnil, zobrazuje se hodnota z DB
  const [draft, setDraft] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

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
    </Paper>
  )
}
