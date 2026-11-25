import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { APP_TITLE } from '../config'
import { supabase } from '../supabaseClient'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'error' | 'success' }>({
    text: '',
    type: 'error',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatusMsg({ text: '', type: 'error' })
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) setStatusMsg({ text: 'Špatný e-mail nebo heslo.', type: 'error' })
    setIsLoading(false)
  }

  const handleResetPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatusMsg({ text: '', type: 'error' })

    // Odeslání odkazu – vyžaduje správně nastavenou Site URL ve Vercelu / Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })

    if (error) {
      setStatusMsg({ text: 'Chyba při odesílání e-mailu.', type: 'error' })
    } else {
      setStatusMsg({ text: 'Odkaz pro obnovu byl odeslán na váš e-mail.', type: 'success' })
    }
    setIsLoading(false)
  }

  const switchMode = (reset: boolean) => {
    setIsResetMode(reset)
    setStatusMsg({ text: '', type: 'error' })
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
            {APP_TITLE} 📚
          </Typography>

          {isResetMode ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Zadejte svůj e-mail, zašleme vám odkaz pro vytvoření nového hesla.
              </Typography>
              <form onSubmit={handleResetPassword}>
                <Stack spacing={2.5}>
                  <TextField
                    label="E-mail"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {statusMsg.text && (
                    <Alert severity={statusMsg.type} sx={{ textAlign: 'left' }}>
                      {statusMsg.text}
                    </Alert>
                  )}
                  <Button type="submit" variant="contained" size="large" disabled={isLoading}>
                    {isLoading ? 'Odesílám...' : 'Odeslat odkaz'}
                  </Button>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => switchMode(false)}
                  >
                    Zpět na přihlášení
                  </Link>
                </Stack>
              </form>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Pro vstup do systému se prosím přihlaste.
              </Typography>
              <form onSubmit={handleLogin}>
                <Stack spacing={2.5}>
                  <TextField
                    label="E-mail"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <TextField
                    label="Heslo"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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
                  {statusMsg.text && (
                    <Alert severity={statusMsg.type} sx={{ textAlign: 'left' }}>
                      {statusMsg.text}
                    </Alert>
                  )}
                  <Button type="submit" variant="contained" size="large" disabled={isLoading}>
                    {isLoading ? 'Přihlašuji...' : 'Přihlásit se'}
                  </Button>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => switchMode(true)}
                  >
                    Zapomenuté heslo?
                  </Link>
                </Stack>
              </form>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  )
}
