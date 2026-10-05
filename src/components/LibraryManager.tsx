import { useCallback, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  Container, Typography, TextField, Button, Box, Paper, Stack,
  IconButton, Alert
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'

import { BOOK_TYPE_LABELS, initialFormState, Placement } from '../types'
import type { Book, BookFormData } from '../types'
import { useBooks } from '../hooks/useBooks'
import { BookFormDialog } from './BookFormDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

interface LibraryManagerProps {
  userEmail: string
}

export function LibraryManager({ userEmail }: LibraryManagerProps) {
  const { books, loading, errorMessage, setErrorMessage, saveBook, deleteBook } = useBooks()
  const [search, setSearch] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<BookFormData>(initialFormState)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [bookToDelete, setBookToDelete] = useState<string | null>(null)

  const { uniqueTitles, uniqueAuthors, uniquePublishers } = useMemo(() => {
    return {
      uniqueTitles: Array.from(new Set(books.map(b => b.title).filter(Boolean))).sort(),
      uniqueAuthors: Array.from(new Set(books.map(b => b.author).filter((author): author is string => Boolean(author)))).sort(),
      uniquePublishers: Array.from(new Set(books.map(b => b.publisher).filter((publisher): publisher is string => Boolean(publisher)))).sort(),
    }
  }, [books])

  const handleOpenAdd = () => {
    setFormData(initialFormState)
    setEditingId(null)
    setErrorMessage(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = useCallback((book: Book) => {
    setFormData({
      title: book.title,
      author: book.author || '',
      publisher: book.publisher || '',
      type: book.type,
      quantity: book.quantity,
      placement: book.placement || Placement.R1
    })
    setEditingId(book.id)
    setErrorMessage(null)
    setIsFormOpen(true)
  }, [setErrorMessage])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const cleanData = {
      ...formData,
      title: formData.title.trim(),
      author: formData.author ? formData.author.trim() : '',
      publisher: formData.publisher ? formData.publisher.trim() : ''
    }

    try {
      await saveBook(cleanData, editingId)
      setIsFormOpen(false)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Chyba při ukládání knihy')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!bookToDelete) return
    try {
      await deleteBook(bookToDelete)
      setDeleteConfirmOpen(false)
      setBookToDelete(null)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Chyba při mazání knihy')
    }
  }

  const filteredBooks = useMemo(() => {
    const searchLower = search.toLowerCase()
    return books.filter(book => {
      const typeLabel = BOOK_TYPE_LABELS[book.type] || ''
      return (
        book.title.toLowerCase().includes(searchLower) ||
        (book.author && book.author.toLowerCase().includes(searchLower)) ||
        (book.publisher && book.publisher.toLowerCase().includes(searchLower)) ||
        (book.placement && book.placement.toLowerCase().includes(searchLower)) ||
        typeLabel.toLowerCase().includes(searchLower)
      )
    })
  }, [books, search])

  const columns: GridColDef[] = useMemo(() => [
    { field: 'title', headerName: 'Název', flex: 1.5, minWidth: 200 },
    { field: 'author', headerName: 'Autor', flex: 1, minWidth: 150 },
    { field: 'publisher', headerName: 'Nakladatel', flex: 1, minWidth: 150 },
    { field: 'placement', headerName: 'Umístění', width: 120 },
    {
      field: 'type',
      headerName: 'Typ',
      width: 170,
      valueGetter: (value) => BOOK_TYPE_LABELS[value as Book['type']] || value
    },
    { field: 'quantity', headerName: 'Kusů', type: 'number', width: 100 },
    {
      field: 'actions',
      headerName: 'Akce',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ height: '100%', alignItems: 'center' }}>
          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(params.row as Book)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => { setBookToDelete(params.row.id); setDeleteConfirmOpen(true) }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ], [handleOpenEdit])

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

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <TextField
        fullWidth
        label="🔍 Hledat knihu (podle názvu, autora, nakladatele, umístění nebo typu)..."
        variant="outlined"
        sx={{ mb: 3, background: 'white' }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Paper elevation={3} sx={{ width: '100%' }}>
        <DataGrid
          autoHeight
          rows={filteredBooks}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ border: 'none' }}
        />
      </Paper>

      <BookFormDialog
        open={isFormOpen}
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
        isSubmitting={isSubmitting}
        uniqueTitles={uniqueTitles}
        uniqueAuthors={uniqueAuthors}
        uniquePublishers={uniquePublishers}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </Container>
  )
}
