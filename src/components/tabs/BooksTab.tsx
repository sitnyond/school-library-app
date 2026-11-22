import { useCallback, useMemo, useState } from 'react'
import {
  TextField, Button, Box, Paper, Stack,
  IconButton, Alert
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import TuneIcon from '@mui/icons-material/Tune'

import { emptyBookForm } from '../../types'
import type { Book, BookFormData } from '../../types'
import { useLibraryData } from '../../context/libraryDataContext'
import { BookFormDialog } from '../books/BookFormDialog'
import { DeleteConfirmDialog } from '../books/DeleteConfirmDialog'
import { CatalogSettingsDialog } from '../CatalogSettingsDialog'

export function BooksTab() {
  const { books: booksData, lookups } = useLibraryData()
  const { books, loading: booksLoading, errorMessage, setErrorMessage, fetchBooks, saveBook, deleteBook } = booksData
  const {
    types,
    placements,
    loading: lookupsLoading,
    errorMessage: lookupError,
    setErrorMessage: setLookupError,
    saveLookup,
    deleteLookup,
    lookupErrorMessage,
  } = lookups

  const isLoading = booksLoading || lookupsLoading
  const [search, setSearch] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<BookFormData>(emptyBookForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [bookToDelete, setBookToDelete] = useState<string | null>(null)

  const displayError = errorMessage || lookupError

  const { uniqueTitles, uniqueAuthors, uniquePublishers } = useMemo(() => {
    return {
      uniqueTitles: Array.from(new Set(books.map(b => b.title).filter(Boolean))).sort(),
      uniqueAuthors: Array.from(new Set(books.map(b => b.author).filter((author): author is string => Boolean(author)))).sort(),
      uniquePublishers: Array.from(new Set(books.map(b => b.publisher).filter((publisher): publisher is string => Boolean(publisher)))).sort(),
    }
  }, [books])

  const defaultForm = useCallback((): BookFormData => ({
    ...emptyBookForm,
    type_id: types[0]?.id ?? '',
    placement_id: placements[0]?.id ?? '',
  }), [types, placements])

  const handleOpenAdd = () => {
    setFormData(defaultForm())
    setEditingId(null)
    setErrorMessage(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = useCallback((book: Book) => {
    setFormData({
      title: book.title,
      author: book.author || '',
      publisher: book.publisher || '',
      type_id: book.type_id,
      quantity: book.quantity,
      placement_id: book.placement_id,
    })
    setEditingId(book.id)
    setErrorMessage(null)
    setIsFormOpen(true)
  }, [setErrorMessage])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.type_id || !formData.placement_id) {
      setErrorMessage('Vyberte prosím platný typ a umístění knihy. Pokud žádné neexistují, vytvořte je v Nastavení.')
      return
    }

    setIsSubmitting(true)

    const cleanData = {
      ...formData,
      title: formData.title.trim(),
      author: formData.author ? formData.author.trim() : '',
      publisher: formData.publisher ? formData.publisher.trim() : '',
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
    setErrorMessage(null)
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
      const typeLabel = book.type?.name || ''
      const placementLabel = book.placement?.name || ''
      return (
        book.title.toLowerCase().includes(searchLower) ||
        (book.author && book.author.toLowerCase().includes(searchLower)) ||
        (book.publisher && book.publisher.toLowerCase().includes(searchLower)) ||
        placementLabel.toLowerCase().includes(searchLower) ||
        typeLabel.toLowerCase().includes(searchLower)
      )
    })
  }, [books, search])

  const columns: GridColDef[] = useMemo(() => [
    { field: 'title', headerName: 'Název', flex: 1.5, minWidth: 200 },
    { field: 'author', headerName: 'Autor', flex: 1, minWidth: 150 },
    { field: 'publisher', headerName: 'Nakladatel', flex: 1, minWidth: 150 },
    {
      field: 'placement',
      headerName: 'Umístění',
      width: 120,
      valueGetter: (_value, row: Book) => row.placement?.name ?? '',
    },
    {
      field: 'type',
      headerName: 'Typ',
      width: 170,
      valueGetter: (_value, row: Book) => row.type?.name ?? '',
    },
    { field: 'quantity', headerName: 'Kusů', type: 'number', width: 100 },
    {
      field: 'actions',
      headerName: 'Akce',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ height: '100%', alignItems: 'center' }}>
          <IconButton size="small" color="primary" disabled={isLoading} onClick={() => handleOpenEdit(params.row as Book)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" disabled={isLoading} onClick={() => { setBookToDelete(params.row.id); setDeleteConfirmOpen(true) }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ], [handleOpenEdit, isLoading])

  return (
    <Box>
      {displayError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => {
            setErrorMessage(null)
            setLookupError(null)
          }}
        >
          {displayError}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { md: 'center' } }}>
        <TextField
          fullWidth
          label="🔍 Hledat knihu (podle názvu, autora, nakladatele, umístění nebo typu)..."
          variant="outlined"
          sx={{ background: 'white' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
          <Button variant="outlined" disabled={isLoading} startIcon={<TuneIcon />} onClick={() => setIsSettingsOpen(true)}>Číselníky</Button>
          <Button variant="contained" disabled={isLoading} startIcon={<AddIcon />} onClick={handleOpenAdd}>Přidat knihu</Button>
        </Stack>
      </Stack>

      <Paper elevation={3} sx={{ width: '100%' }}>
        <DataGrid
          autoHeight
          rows={filteredBooks}
          columns={columns}
          loading={isLoading}
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
        types={types}
        placements={placements}
        onClose={() => {
          setIsFormOpen(false)
          setErrorMessage(null)
        }}
        onSubmit={handleSubmit}
      />

      <CatalogSettingsDialog
        open={isSettingsOpen}
        types={types}
        placements={placements}
        onClose={() => setIsSettingsOpen(false)}
        onSave={async (table, name, id) => {
          await saveLookup(table, name, id)
          await fetchBooks()
        }}
        onDelete={async (table, id) => {
          await deleteLookup(table, id)
          await fetchBooks()
        }}
        mapError={lookupErrorMessage}
      />

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </Box>
  )
}
