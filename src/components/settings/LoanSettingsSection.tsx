import { useState } from 'react'
import { Box, Button, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material'

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

  return (
    <Paper elevation={1} sx={{ px: 2.5, py: 2 }}>
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
    </Paper>
  )
}
