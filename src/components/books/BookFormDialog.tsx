import type { Dispatch, SetStateAction, SyntheticEvent } from 'react'
import {
  Autocomplete,
  Button,
  createFilterOptions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import type { BookFormData, LookupOption } from '../../types'

const filterStringOptions = createFilterOptions<string>({ limit: 25, trim: true })

interface BookFormDialogProps {
  open: boolean
  formData: BookFormData
  setFormData: Dispatch<SetStateAction<BookFormData>>
  editingId: string | null
  activeLoansCount?: number
  isSubmitting: boolean
  uniqueTitles: string[]
  uniqueAuthors: string[]
  uniquePublishers: string[]
  types: LookupOption[]
  placements: LookupOption[]
  onClose: () => void
  onSubmit: (e: SyntheticEvent) => void
}

export function BookFormDialog({
  open,
  formData,
  setFormData,
  editingId,
  activeLoansCount = 0,
  isSubmitting,
  uniqueTitles,
  uniqueAuthors,
  uniquePublishers,
  types,
  placements,
  onClose,
  onSubmit,
}: BookFormDialogProps) {
  const minQuantity = Math.max(1, activeLoansCount)
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={onSubmit}>
        <DialogTitle>{editingId ? 'Upravit knihu' : 'Přidat novou knihu'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              freeSolo
              fullWidth
              options={uniqueTitles}
              filterOptions={filterStringOptions}
              value={formData.title}
              onInputChange={(_, newValue) => setFormData(prev => ({ ...prev, title: newValue }))}
              renderInput={(params) => <TextField {...params} required label="Název knihy" />}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Autocomplete
                freeSolo
                fullWidth
                options={uniqueAuthors}
                filterOptions={filterStringOptions}
                value={formData.author}
                onInputChange={(_, newValue) => setFormData(prev => ({ ...prev, author: newValue }))}
                renderInput={(params) => <TextField {...params} label="Autor" />}
              />
              <Autocomplete
                freeSolo
                fullWidth
                options={uniquePublishers}
                filterOptions={filterStringOptions}
                value={formData.publisher}
                onInputChange={(_, newValue) => setFormData(prev => ({ ...prev, publisher: newValue }))}
                renderInput={(params) => <TextField {...params} label="Nakladatel" />}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                required
                label="Umístění"
                fullWidth
                value={formData.placement_id}
                onChange={(e) => setFormData(prev => ({ ...prev, placement_id: e.target.value }))}
              >
                {placements.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                required
                label="Typ knihy"
                fullWidth
                value={formData.type_id}
                onChange={(e) => setFormData(prev => ({ ...prev, type_id: e.target.value }))}
              >
                {types.map((type) => (
                  <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              required
              type="number"
              label="Kusů celkem"
              sx={{ width: activeLoansCount > 0 ? '260px' : '150px' }}
              slotProps={{ htmlInput: { min: minQuantity } }}
              value={formData.quantity}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  quantity: Math.max(minQuantity, parseInt(e.target.value, 10) || minQuantity),
                }))
              }
              helperText={
                activeLoansCount > 0
                  ? `Aktuálně půjčeno: ${activeLoansCount} ks (nelze snížit níž).`
                  : undefined
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Zrušit</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Ukládám...' : 'Uložit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
