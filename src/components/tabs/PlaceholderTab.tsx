import { Paper, Typography } from '@mui/material'

interface PlaceholderTabProps {
  title: string
  description: string
}

export function PlaceholderTab({ title, description }: PlaceholderTabProps) {
  return (
    <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>{title}</Typography>
      <Typography color="textSecondary">{description}</Typography>
    </Paper>
  )
}
