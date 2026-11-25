import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { supabase } from '../supabaseClient'
import { getErrorMessage } from '../utils/errors'

interface UpdatePasswordFormProps {
  onComplete: () => void
}

export function UpdatePasswordForm({ onComplete }: UpdatePasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleUpdate = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (password !== confirmPassword) {
      setErrorMsg('Zadaná hesla se neshodují.')
      return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setErrorMsg(getErrorMessage(error, 'Chyba při ukládání hesla.'))
    } else {
      setIsSuccess(true)
    }
    setIsLoading(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
            Změna hesla
          </Typography>

          {isSuccess ? (
            <Stack spacing={2.5} sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ textAlign: 'left' }}>
                Heslo bylo úspěšně změněno.
              </Alert>
              <Button variant="contained" size="large" onClick={onComplete}>
                Pokračovat do aplikace
              </Button>
            </Stack>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Zadejte své nové heslo.
              </Typography>
              <form onSubmit={handleUpdate}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Nové heslo"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoFocus
                    required
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                              onClick={() => setShowPassword((prev) => !prev)}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    label="Potvrzení nového hesla"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    fullWidth
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={Boolean(confirmPassword) && password !== confirmPassword}
                    helperText={
                      confirmPassword && password !== confirmPassword ? 'Hesla se neshodují' : undefined
                    }
                  />
                  {errorMsg && (
                    <Alert severity="error" sx={{ textAlign: 'left' }}>
                      {errorMsg}
                    </Alert>
                  )}
                  <Button type="submit" variant="contained" size="large" disabled={isLoading}>
                    {isLoading ? 'Ukládám...' : 'Uložit heslo'}
                  </Button>
                </Stack>
              </form>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  )
}
