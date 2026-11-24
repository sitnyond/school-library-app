import { useState } from 'react'
import { Box, Button, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material'
import type { AppSettings } from '../../types'

interface LoanSettingsSectionProps {
  loanDays: number
  extensionDays: number
  disabled?: boolean
  onSave: (settings: AppSettings) => Promise<void>
  onError: (err: unknown, fallback: string) => void
}

export function LoanSettingsSection({
  loanDays,
  extensionDays,
  disabled,
  onSave,
  onError,
}: LoanSettingsSectionProps) {
  // null = uživatel zatím nic nezměnil, zobrazuje se hodnota z DB
  const [loanDaysDraft, setLoanDaysDraft] = useState<string | null>(null)
  const [extensionDaysDraft, setExtensionDaysDraft] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loanValue = loanDaysDraft ?? String(loanDays)
  const extensionValue = extensionDaysDraft ?? String(extensionDays)

  const parsedLoanDays = Number.parseInt(loanValue, 10)
  const parsedExtensionDays = Number.parseInt(extensionValue, 10)

  const isLoanValid = Number.isInteger(parsedLoanDays) && parsedLoanDays >= 1 && parsedLoanDays <= 365
  const isExtensionValid =
    Number.isInteger(parsedExtensionDays) && parsedExtensionDays >= 1 && parsedExtensionDays <= 365
  const isValid = isLoanValid && isExtensionValid

  const isDirty =
    (loanDaysDraft !== null && parsedLoanDays !== loanDays) ||
    (extensionDaysDraft !== null && parsedExtensionDays !== extensionDays)

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!isValid) return
    setBusy(true)
    try {
      await onSave({
        loan_days: parsedLoanDays,
        extension_days: parsedExtensionDays,
      })
      setLoanDaysDraft(null)
      setExtensionDaysDraft(null)
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
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}
        >
          <TextField
            size="small"
            type="number"
            label="Délka výpůjčky"
            value={loanValue}
            disabled={disabled}
            error={!isLoanValid}
            helperText={!isLoanValid ? 'Zadejte 1–365 dní' : undefined}
            onChange={(e) => setLoanDaysDraft(e.target.value)}
            slotProps={{
              htmlInput: { min: 1, max: 365 },
              input: { endAdornment: <InputAdornment position="end">dní</InputAdornment> },
            }}
            sx={{ width: 170 }}
          />
          <TextField
            size="small"
            type="number"
            label="Délka prodloužení"
            value={extensionValue}
            disabled={disabled}
            error={!isExtensionValid}
            helperText={!isExtensionValid ? 'Zadejte 1–365 dní' : undefined}
            onChange={(e) => setExtensionDaysDraft(e.target.value)}
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
