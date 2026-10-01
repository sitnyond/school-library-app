import { useState } from 'react'
import { Container, Paper, Typography, Stack, TextField, Button, Link } from '@mui/material'
import { supabase } from '../supabaseClient'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ text: '', type: 'error' })
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatusMsg({ text: '', type: 'error' })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setStatusMsg({ text: 'Špatný e-mail nebo heslo.', type: 'error' })
    setIsLoading(false)
  }

  const handleResetPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatusMsg({ text: '', type: 'error' })
    
    // Odeslání odkazu – vyžaduje správně nastavenou Site URL ve Vercelu / Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    
    if (error) {
      setStatusMsg({ text: 'Chyba při odesílání e-mailu.', type: 'error' })
    } else {
      setStatusMsg({ text: 'Odkaz pro obnovu byl odeslán na váš e-mail.', type: 'success' })
    }
    setIsLoading(false)
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4, elevation: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>School library 📚</Typography>
        
        {isResetMode ? (
          <>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>Zadejte svůj e-mail, zašleme vám odkaz pro vytvoření nového hesla.</Typography>
            <form onSubmit={handleResetPassword}>
              <Stack spacing={3}>
                <TextField label="E-mail" type="email" required fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
                {statusMsg.text && <Typography color={statusMsg.type}>{statusMsg.text}</Typography>}
                <Button type="submit" variant="contained" size="large" disabled={isLoading}>{isLoading ? 'Odesílám...' : 'Odeslat odkaz'}</Button>
                <Link component="button" variant="body2" onClick={(e) => { e.preventDefault(); setIsResetMode(false); setStatusMsg({ text: '', type: 'error' }); }}>Zpět na přihlášení</Link>
              </Stack>
            </form>
          </>
        ) : (
          <>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>Pro vstup do systému se prosím přihlaste.</Typography>
            <form onSubmit={handleLogin}>
              <Stack spacing={3}>
                <TextField label="E-mail" type="email" required fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
                <TextField label="Heslo" type="password" required fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
                {statusMsg.text && <Typography color={statusMsg.type}>{statusMsg.text}</Typography>}
                <Button type="submit" variant="contained" size="large" disabled={isLoading}>{isLoading ? 'Přihlašuji...' : 'Přihlásit se'}</Button>
                <Link component="button" variant="body2" onClick={(e) => { e.preventDefault(); setIsResetMode(true); setStatusMsg({ text: '', type: 'error' }); }}>Zapomenuté heslo?</Link>
              </Stack>
            </form>
          </>
        )}
      </Paper>
    </Container>
  )
}
