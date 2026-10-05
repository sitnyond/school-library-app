import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { LookupOption } from '../types'
import type { LookupTable } from '../hooks/useLookups'

interface CatalogSettingsDialogProps {
  open: boolean
  types: LookupOption[]
  placements: LookupOption[]
  onClose: () => void
  onSave: (table: LookupTable, name: string, id?: string) => Promise<void>
  onDelete: (table: LookupTable, id: string) => Promise<void>
  mapError: (err: unknown, fallback: string) => string
}

interface LookupSectionProps {
  title: string
  table: LookupTable
  items: LookupOption[]
  onSave: CatalogSettingsDialogProps['onSave']
  onDelete: CatalogSettingsDialogProps['onDelete']
  onError: (err: unknown, fallback: string) => void
}

function LookupSection({ title, table, items, onSave, onDelete, onError }: LookupSectionProps) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          label="Nový název"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button
          variant="contained"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onSave(table, newName)
              setNewName('')
            } catch (err: unknown) {
              onError(err, 'Chyba při ukládání')
            } finally {
              setBusy(false)
            }
          }}
        >
          Přidat
        </Button>
      </Stack>
      <Stack spacing={1}>
        {items.map((item) => (
          <Stack key={item.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {editingId === item.id ? (
              <TextField
                size="small"
                fullWidth
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
              />
            ) : (
              <Typography sx={{ flex: 1 }}>{item.name}</Typography>
            )}
            {editingId === item.id ? (
              <Button
                size="small"
                variant="contained"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    await onSave(table, editingName, item.id)
                    setEditingId(null)
                  } catch (err: unknown) {
                    onError(err, 'Chyba při ukládání')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Uložit
              </Button>
            ) : (
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  setEditingId(item.id)
                  setEditingName(item.name)
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton
              size="small"
              color="error"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await onDelete(table, item.id)
                  if (editingId === item.id) setEditingId(null)
                } catch (err: unknown) {
                  onError(err, 'Chyba při mazání')
                } finally {
                  setBusy(false)
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

export function CatalogSettingsDialog({
  open,
  types,
  placements,
  onClose,
  onSave,
  onDelete,
  mapError,
}: CatalogSettingsDialogProps) {
  const [localError, setLocalError] = useState<string | null>(null)

  const handleError = (err: unknown, fallback: string) => {
    setLocalError(mapError(err, fallback))
  }

  const handleSave = async (table: LookupTable, name: string, id?: string) => {
    setLocalError(null)
    await onSave(table, name, id)
  }

  const handleDelete = async (table: LookupTable, id: string) => {
    setLocalError(null)
    await onDelete(table, id)
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        setLocalError(null)
        onClose()
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Nastavení typů a umístění</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={4} sx={{ mt: 1 }}>
          {localError && (
            <Alert severity="error" onClose={() => setLocalError(null)}>
              {localError}
            </Alert>
          )}
          <LookupSection
            title="Typy knih"
            table="book_types"
            items={types}
            onSave={handleSave}
            onDelete={handleDelete}
            onError={handleError}
          />
          <LookupSection
            title="Umístění"
            table="placements"
            items={placements}
            onSave={handleSave}
            onDelete={handleDelete}
            onError={handleError}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zavřít</Button>
      </DialogActions>
    </Dialog>
  )
}
