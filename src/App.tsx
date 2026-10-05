import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { csCZ } from '@mui/x-data-grid/locales'
import { csCZ as coreCsCZ } from '@mui/material/locale'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

import { LoginForm } from './components/LoginForm'
import { UpdatePasswordForm } from './components/UpdatePasswordForm'
import { LibraryManager } from './components/LibraryManager'

const theme = createTheme(
  {
    palette: { mode: 'light', background: { default: '#f4f6f8' } },
  },
  csCZ,
  coreCsCZ
)

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <p style={{ padding: 20 }}>Ověřování přístupu...</p>

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!session ? (
        <LoginForm />
      ) : recoveryMode ? (
        <UpdatePasswordForm onComplete={() => setRecoveryMode(false)} />
      ) : (
        <LibraryManager userEmail={session.user.email || ''} />
      )}
    </ThemeProvider>
  )
}
