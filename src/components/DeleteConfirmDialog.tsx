import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({ open, onClose, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Smazat knihu?</DialogTitle>
      <DialogContent>Opravdu chcete tuto knihu trvale smazat? Tato akce nelze vzít zpět.</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zrušit</Button>
        <Button onClick={onConfirm} color="error" variant="contained">Smazat</Button>
      </DialogActions>
    </Dialog>
  )
}
