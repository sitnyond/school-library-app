import { useState } from 'react'
import { Alert, Box, LinearProgress, Stack, Typography } from '@mui/material'
import { useLibraryData } from '../../context/libraryDataContext'
import type { LookupTable } from '../../hooks/useLookups'
import { LookupSection } from '../settings/LookupSection'

export function SettingsTab() {
  const { books, lookups } = useLibraryData()
  const { types, placements, loading, errorMessage, setErrorMessage, saveLookup, deleteLookup, lookupErrorMessage } = lookups
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = localError || errorMessage

  const handleError = (err: unknown, fallback: string) => {
    setLocalError(lookupErrorMessage(err, fallback))
  }

  // Po změně číselníku znovu načteme knihy, aby se v katalogu ukázaly nové názvy.
  const handleSave = async (table: LookupTable, name: string, id?: string) => {
    setLocalError(null)
    await saveLookup(table, name, id)
    await books.fetchBooks()
  }

  const handleDelete = async (table: LookupTable, id: string) => {
    setLocalError(null)
    await deleteLookup(table, id)
    await books.fetchBooks()
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5">Nastavení</Typography>
        <Typography variant="body2" color="textSecondary">Číselníky používané v katalogu knih.</Typography>
      </Box>

      {loading && <LinearProgress />}

      {displayError && (
        <Alert severity="error" onClose={() => { setLocalError(null); setErrorMessage(null) }}>
          {displayError}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <LookupSection
          title="Typy knih"
          description="Např. beletrie, odborná literatura, časopis."
          table="book_types"
          items={types}
          onSave={handleSave}
          onDelete={handleDelete}
          onError={handleError}
        />
        <LookupSection
          title="Umístění"
          description="Regály nebo místa, kde jsou knihy uložené."
          table="placements"
          items={placements}
          onSave={handleSave}
          onDelete={handleDelete}
          onError={handleError}
        />
      </Box>
    </Stack>
  )
}
