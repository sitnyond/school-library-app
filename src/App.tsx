import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { csCZ } from '@mui/x-data-grid/locales'
import { csCZ as coreCsCZ } from '@mui/material/locale'
import { 
  Container, Typography, TextField, Button, Box, Paper, MenuItem, Stack, 
  CssBaseline, ThemeProvider, createTheme, Dialog, DialogTitle, 
  DialogContent, DialogActions, IconButton, Autocomplete, Link
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'

import { BookType, BOOK_TYPE_LABELS, Placement } from './types'
import type { Book } from './types'


const theme = createTheme({
  palette: { mode: 'light', background: { default: '#f4f6f8' } },
}, csCZ, coreCsCZ)

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      // Záchyt speciálního eventu, kdy se uživatel vrací přes link z e-mailu
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
        <LibraryManager userEmail={session.user.email} />
      )}
    </ThemeProvider>
  )
}

function UpdatePasswordForm({ onComplete }: { onComplete: () => void }) {
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

// --- PŘIHLAŠOVACÍ FORMULÁŘ A OBNOVA HESLA ---
function LoginForm() {
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

const initialFormState = { 
  title: '', author: '', publisher: '', type: BookType.FICTION_1, quantity: 1, placement: Placement.R1 
}

function LibraryManager({ userEmail }: { userEmail: string }) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<any>(initialFormState)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [bookToDelete, setBookToDelete] = useState<string | null>(null)

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('books').select('*').order('id', { ascending: false })
      if (!error) setBooks(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBooks() }, [])

  const { uniqueTitles, uniqueAuthors, uniquePublishers } = useMemo(() => {
    return {
      uniqueTitles: Array.from(new Set(books.map(b => b.title).filter(Boolean))).sort() as string[],
      uniqueAuthors: Array.from(new Set(books.map(b => b.author).filter(Boolean))).sort() as string[],
      uniquePublishers: Array.from(new Set(books.map(b => b.publisher).filter(Boolean))).sort() as string[]
    }
  }, [books]) // To [books] na konci je klíčové - říká "počítej to znovu, jen když se změní knihy"

  const handleOpenAdd = () => { setFormData(initialFormState); setEditingId(null); setIsFormOpen(true); }
  
  const handleOpenEdit = (book: Book) => { 
    setFormData({
      title: book.title, 
      author: book.author || '', 
      publisher: book.publisher || '', 
      type: book.type, 
      quantity: book.quantity, 
      placement: book.placement as Placement || Placement.R1
    })
    setEditingId(book.id)
    setIsFormOpen(true) 
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
  
    const cleanData = {
      ...formData,
      title: formData.title.trim(),
      author: formData.author ? formData.author.trim() : '',
      publisher: formData.publisher ? formData.publisher.trim() : ''
    }

    if (editingId) {
      await supabase.from('books').update(cleanData).eq('id', editingId)
    } else {
      await supabase.from('books').insert([cleanData])
    }
    setIsFormOpen(false)
    setIsSubmitting(false)
    fetchBooks()
  }

  const confirmDelete = async () => {
    if (bookToDelete) {
      await supabase.from('books').delete().eq('id', bookToDelete)
      setDeleteConfirmOpen(false)
      setBookToDelete(null)
      fetchBooks()
    }
  }

  const searchLower = search.toLowerCase()
  const filteredBooks = books.filter(book => {
    const typeLabel = BOOK_TYPE_LABELS[book.type as BookType] || ''
    return (
      book.title.toLowerCase().includes(searchLower) || 
      (book.author && book.author.toLowerCase().includes(searchLower)) ||
      (book.publisher && book.publisher.toLowerCase().includes(searchLower)) ||
      (book.placement && book.placement.toLowerCase().includes(searchLower)) ||
      typeLabel.toLowerCase().includes(searchLower)
    )
  })

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Název', flex: 1.5, minWidth: 200 },
    { field: 'author', headerName: 'Autor', flex: 1, minWidth: 150 },
    { field: 'publisher', headerName: 'Nakladatel', flex: 1, minWidth: 150 },
    { field: 'placement', headerName: 'Umístění', width: 120 },
    { 
      field: 'type', 
      headerName: 'Typ', 
      width: 170, 
      valueGetter: (value) => BOOK_TYPE_LABELS[value as BookType] || value 
    },
    { field: 'quantity', headerName: 'Kusů', type: 'number', width: 100 },
    {
      field: 'actions', headerName: 'Akce', width: 120, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ height: '100%', alignItems: 'center' }}>
          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(params.row as Book)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => { setBookToDelete(params.row.id); setDeleteConfirmOpen(true) }}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      ),
    },
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" color="primary" sx={{ fontWeight: 'bold' }}>
          School library 📚
        </Typography>
  
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
            Přihlášen: {userEmail}
          </Typography>
    
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>Přidat knihu</Button>
          <Button variant="outlined" color="inherit" startIcon={<LogoutIcon />} onClick={() => supabase.auth.signOut()}>Odhlásit</Button>
        </Stack>
      </Box>

      <TextField fullWidth label="🔍 Hledat knihu (podle názvu, autora, nakladatele, umístění nebo typu)..." variant="outlined" sx={{ mb: 3, background: 'white' }} value={search} onChange={(e) => setSearch(e.target.value)} />

      <Paper sx={{ width: '100%', elevation: 3 }}>
        <DataGrid autoHeight rows={filteredBooks} columns={columns} loading={loading} disableRowSelectionOnClick initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 25, 50]} sx={{ border: 'none' }} />
      </Paper>

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'Upravit knihu' : 'Přidat novou knihu'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                freeSolo
                fullWidth
                options={uniqueTitles}
                value={formData.title}
                onInputChange={(_, newValue) => setFormData({ ...formData, title: newValue })}
                renderInput={(params) => <TextField {...params} required label="Název knihy" />}
              />              
              <Stack direction="row" spacing={2}>
                <Autocomplete
                  freeSolo
                  fullWidth
                  options={uniqueAuthors}
                  value={formData.author}
                  onInputChange={(_, newValue) => setFormData({ ...formData, author: newValue })}
                  renderInput={(params) => <TextField {...params} label="Autor" />}
                />
                <Autocomplete
                  freeSolo
                  fullWidth
                  options={uniquePublishers}
                  value={formData.publisher}
                  onInputChange={(_, newValue) => setFormData({ ...formData, publisher: newValue })}
                  renderInput={(params) => <TextField {...params} label="Nakladatel" />}
                />
              </Stack>
              
              <Stack direction="row" spacing={2}>
                <TextField select label="Umístění" fullWidth value={formData.placement} onChange={(e) => setFormData({ ...formData, placement: e.target.value as Placement })}>
                  {Object.values(Placement).map((loc) => (
                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                  ))}
                </TextField>

                <TextField select label="Typ knihy" fullWidth value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as BookType })}>
                  {Object.entries(BOOK_TYPE_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              <TextField required type="number" label="Kusů" sx={{ width: '150px' }} slotProps={{ htmlInput: { min: 1 } }} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsFormOpen(false)}>Zrušit</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? 'Ukládám...' : 'Uložit'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Smazat knihu?</DialogTitle>
        <DialogContent>Opravdu chcete tuto knihu trvale smazat? Tato akce nelze vzít zpět.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Zrušit</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Smazat</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}