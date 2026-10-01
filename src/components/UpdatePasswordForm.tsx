import { useState } from 'react'
import { Container, Paper, Typography, Stack, TextField, Button } from '@mui/material'
import { supabase } from '../supabaseClient'

interface UpdatePasswordFormProps {
  onComplete: () => void
}

export function UpdatePasswordForm({ onComplete }: UpdatePasswordFormProps) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleUpdate = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setErrorMsg('Chyba při ukládání hesla.')
    } else {
      alert('Heslo bylo úspěšně změněno!')
      onComplete()
    }
    setIsLoading(false)
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4, elevation: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>Změna hesla</Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>Zadejte své nové heslo.</Typography>
        <form onSubmit={handleUpdate}>
          <Stack spacing={3}>
            <TextField label="Nové heslo" type="password" required fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
            {errorMsg && <Typography color="error">{errorMsg}</Typography>}
            <Button type="submit" variant="contained" size="large" disabled={isLoading}>{isLoading ? 'Ukládám...' : 'Uložit heslo'}</Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
