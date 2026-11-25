import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import type { LookupOption } from '../../types'
import type { LookupTable } from '../../hooks/useLookups'

interface LookupSectionProps {
  title: string
  description?: string
  table: LookupTable
  items: LookupOption[]
  onSave: (table: LookupTable, name: string, id?: string) => Promise<void>
  onDelete: (table: LookupTable, id: string) => Promise<void>
  onError: (err: unknown, fallback: string) => void
}

/** Karta pro správu jednoho číselníku (přidat / přejmenovat / smazat). */
export function LookupSection({ title, description, table, items, onSave, onDelete, onError }: LookupSectionProps) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [itemToDelete, setItemToDelete] = useState<LookupOption | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true)
    try {
      await action()
    } catch (err: unknown) {
      onError(err, fallback)
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = () =>
    run(async () => {
      await onSave(table, newName)
      setNewName('')
    }, 'Chyba při ukládání')

  const handleRename = (item: LookupOption) => {
    if (editingName.trim() === item.name) {
      setEditingId(null)
      return
    }
    return run(async () => {
      await onSave(table, editingName, item.id)
      setEditingId(null)
    }, 'Chyba při ukládání')
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    const target = itemToDelete
    await run(async () => {
      await onDelete(table, target.id)
      if (editingId === target.id) setEditingId(null)
    }, 'Chyba při mazání')
    setItemToDelete(null)
  }

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>{description}</Typography>
      )}

      <Box
        component="form"
        onSubmit={(e) => { e.preventDefault(); handleAdd() }}
        sx={{ display: 'flex', gap: 1, mb: 1.5, mt: description ? 0 : 1.5 }}
      >
        <TextField size="small" fullWidth label="Nový název" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button type="submit" size="small" variant="contained" disabled={busy || !newName.trim()}>Přidat</Button>
      </Box>

      <Stack spacing={0.25}>
        {items.length === 0 && (
          <Typography variant="body2" color="textSecondary">Zatím žádné položky.</Typography>
        )}
        {items.map((item) =>
          editingId === item.id ? (
            <Box
              key={item.id}
              component="form"
              onSubmit={(e) => { e.preventDefault(); handleRename(item) }}
              sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 0.25 }}
            >
              <TextField
                size="small"
                fullWidth
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null) }}
              />
              <Button
                type="submit"
                size="small"
                variant="contained"
                disabled={busy || !editingName.trim() || editingName.trim() === item.name}
              >
                Uložit
              </Button>
              <Tooltip title="Zrušit">
                <IconButton size="small" onClick={() => setEditingId(null)}><CloseIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Stack
              key={item.id}
              direction="row"
              spacing={0.5}
              sx={{
                alignItems: 'center',
                px: 1,
                py: 0.25,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Typography variant="body2" sx={{ flex: 1 }}>{item.name}</Typography>
              <Tooltip title="Přejmenovat">
                <IconButton
                  size="small"
                  color="primary"
                  disabled={busy}
                  onClick={() => { setEditingId(item.id); setEditingName(item.name) }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Smazat">
                <IconButton size="small" color="error" disabled={busy} onClick={() => setItemToDelete(item)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )
        )}
      </Stack>

      <Dialog open={Boolean(itemToDelete)} onClose={() => !busy && setItemToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Smazat položku?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Opravdu chcete smazat položku <strong>{itemToDelete?.name}</strong> ze sekce {title}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemToDelete(null)} disabled={busy}>
            Zrušit
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={busy}>
            {busy ? 'Mažu...' : 'Smazat'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
