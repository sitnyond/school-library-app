import { useState } from 'react'
import { Alert, Box, LinearProgress, Stack, Typography } from '@mui/material'
import { useLibraryData } from '../../context/libraryDataContext'
import { useSnackbar } from '../../context/snackbarContext'
import type { LookupTable } from '../../hooks/useLookups'
import { LookupSection } from '../settings/LookupSection'
import { LoanSettingsSection } from '../settings/LoanSettingsSection'

export function SettingsTab() {
  const { books, lookups, appSettings, loans } = useLibraryData()
  const { showNotification } = useSnackbar()
  const { types, placements, classes, saveLookup, deleteLookup, lookupErrorMessage } = lookups
  const [localError, setLocalError] = useState<string | null>(null)

  const loading = lookups.loading || appSettings.loading || loans.loading
  const displayError = localError || lookups.errorMessage || appSettings.errorMessage || loans.errorMessage

  const handleError = (err: unknown, fallback: string) => {
    setLocalError(lookupErrorMessage(err, fallback))
  }

  // Po změně číselníku znovu načteme navázané záznamy, aby se ukázaly nové názvy.
  const handleSave = async (table: LookupTable, name: string, id?: string) => {
    setLocalError(null)
    await saveLookup(table, name, id)
    if (table === 'classes') {
      await loans.fetchLoans()
    } else {
      await books.fetchBooks()
    }
    showNotification(id ? 'Položka byla upravena.' : 'Položka byla přidána.')
  }

  const handleDelete = async (table: LookupTable, id: string) => {
    setLocalError(null)
    await deleteLookup(table, id)
    if (table !== 'classes') await books.fetchBooks()
    showNotification('Položka byla smazána.')
  }

  const handleSaveLoanDays = async (loanDays: number) => {
    setLocalError(null)
    await appSettings.saveSettings({ loan_days: loanDays })
    showNotification('Výchozí délka výpůjčky byla uložena.')
  }

  const handleClearHistory = async () => {
    setLocalError(null)
    await loans.clearLoanHistory()
    showNotification('Historie vrácených výpůjček byla smazána.')
  }

  const sectionProps = { onSave: handleSave, onDelete: handleDelete, onError: handleError }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5">Nastavení</Typography>
        <Typography variant="body2" color="textSecondary">Číselníky a parametry výpůjček.</Typography>
      </Box>

      {loading && <LinearProgress />}

      {displayError && (
        <Alert
          severity="error"
          onClose={() => {
            setLocalError(null)
            lookups.setErrorMessage(null)
            appSettings.setErrorMessage(null)
            loans.setErrorMessage(null)
          }}
        >
          {displayError}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <LoanSettingsSection
          loanDays={appSettings.settings.loan_days}
          historyCount={loans.returnedLoans.length}
          disabled={appSettings.loading || loans.loading}
          onSave={handleSaveLoanDays}
          onClearHistory={handleClearHistory}
          onError={handleError}
        />
        <LookupSection
          title="Třídy"
          description="Při půjčení se vybírá třída a píše jen zkrácené jméno žáka."
          table="classes"
          items={classes}
          {...sectionProps}
        />
        <LookupSection
          title="Typy knih"
          description="Např. beletrie, odborná literatura, časopis."
          table="book_types"
          items={types}
          {...sectionProps}
        />
        <LookupSection
          title="Umístění"
          description="Regály nebo místa, kde jsou knihy uložené."
          table="placements"
          items={placements}
          {...sectionProps}
        />
      </Box>
    </Stack>
  )
}
