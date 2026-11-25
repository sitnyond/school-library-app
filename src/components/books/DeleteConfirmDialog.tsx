import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'

interface DeleteConfirmDialogProps {
  open: boolean
  bookTitle?: string
  bookAuthor?: string | null
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({ open, bookTitle, bookAuthor, onClose, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Smazat knihu?</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          {bookTitle && (
            <Typography variant="body2">
              <strong>{bookTitle}</strong>
              {bookAuthor ? ` – ${bookAuthor}` : ''}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Opravdu chcete tuto knihu trvale smazat? Tato akce nelze vzít zpět.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zrušit</Button>
        <Button onClick={onConfirm} color="error" variant="contained">Smazat</Button>
      </DialogActions>
    </Dialog>
  )
}
