import { useState } from 'react'
import { Box, Button, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import type { LookupOption } from '../../types'
import type { LookupTable } from '../../hooks/useLookups'

export interface LookupSectionProps {
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

  const handleRename = (id: string) =>
    run(async () => {
      await onSave(table, editingName, id)
      setEditingId(null)
    }, 'Chyba při ukládání')

  const handleDelete = (id: string) =>
    run(async () => {
      await onDelete(table, id)
      if (editingId === id) setEditingId(null)
    }, 'Chyba při mazání')

  return (
    <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>{description}</Typography>
      )}

      <Box
        component="form"
        onSubmit={(e) => { e.preventDefault(); handleAdd() }}
        sx={{ display: 'flex', gap: 1, mb: 2, mt: description ? 0 : 2 }}
      >
        <TextField size="small" fullWidth label="Nový název" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button type="submit" variant="contained" disabled={busy || !newName.trim()}>Přidat</Button>
      </Box>

      <Stack spacing={1}>
        {items.length === 0 && (
          <Typography variant="body2" color="textSecondary">Zatím žádné položky.</Typography>
        )}
        {items.map((item) =>
          editingId === item.id ? (
            <Box
              key={item.id}
              component="form"
              onSubmit={(e) => { e.preventDefault(); handleRename(item.id) }}
              sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
            >
              <TextField
                size="small"
                fullWidth
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null) }}
              />
              <Button type="submit" size="small" variant="contained" disabled={busy || !editingName.trim()}>Uložit</Button>
              <Tooltip title="Zrušit">
                <IconButton size="small" onClick={() => setEditingId(null)}><CloseIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Stack key={item.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1 }}>{item.name}</Typography>
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
                <IconButton size="small" color="error" disabled={busy} onClick={() => handleDelete(item.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )
        )}
      </Stack>
    </Paper>
  )
}
