import { useState } from 'react'
import { Alert, Box, LinearProgress, Stack } from '@mui/material'
import { useLibraryData } from '../../context/libraryDataContext'
import { useSnackbar } from '../../context/snackbarContext'
import type { LookupTable } from '../../hooks/useLookups'
import type { AppSettings } from '../../types'
import { LookupSection } from '../settings/LookupSection'
import { LoanSettingsSection } from '../settings/LoanSettingsSection'

export function SettingsTab() {
  const { books, lookups, appSettings, loans } = useLibraryData()
  const { showNotification } = useSnackbar()
  const { types, placements, classes, saveLookup, deleteLookup, lookupErrorMessage } = lookups
  const [localError, setLocalError] = useState<string | null>(null)

  const loading = lookups.loading || appSettings.loading
  const displayError = localError || lookups.errorMessage || appSettings.errorMessage

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

  const handleSaveLoanSettings = async (settings: AppSettings) => {
    setLocalError(null)
    await appSettings.saveSettings(settings)
    showNotification('Nastavení výpůjček bylo uloženo.')
  }

  const sectionProps = { onSave: handleSave, onDelete: handleDelete, onError: handleError }

  return (
    <Stack spacing={2}>
      {loading && <LinearProgress />}

      {displayError && (
        <Alert
          severity="error"
          onClose={() => {
            setLocalError(null)
            lookups.setErrorMessage(null)
            appSettings.setErrorMessage(null)
          }}
        >
          {displayError}
        </Alert>
      )}

      <LoanSettingsSection
        loanDays={appSettings.settings.loan_days}
        extensionDays={appSettings.settings.extension_days}
        disabled={appSettings.loading}
        onSave={handleSaveLoanSettings}
        onError={handleError}
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, alignItems: 'start' }}>
        <LookupSection
          title="Třídy"
          table="classes"
          items={classes}
          {...sectionProps}
        />
        <LookupSection
          title="Typy knih"
          table="book_types"
          items={types}
          {...sectionProps}
        />
        <LookupSection
          title="Umístění"
          table="placements"
          items={placements}
          {...sectionProps}
        />
      </Box>
    </Stack>
  )
}
