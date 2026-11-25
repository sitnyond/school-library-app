import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import {
  TextField, Button, Box, Paper, Stack,
  IconButton, InputAdornment, Alert, Tooltip, Typography
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import SearchIcon from '@mui/icons-material/Search'

import { emptyBookForm } from '../../types'
import type { Book, BookFormData } from '../../types'
import { useLibraryData } from '../../context/libraryDataContext'
import { useSnackbar } from '../../context/snackbarContext'
import { getErrorMessage } from '../../utils/errors'
import { BookFormDialog } from '../books/BookFormDialog'
import { DeleteConfirmDialog } from '../books/DeleteConfirmDialog'
import { LoanFormDialog } from '../loans/LoanFormDialog'

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function BooksTab() {
  const { books: booksData, lookups, loans } = useLibraryData()
  const { showNotification } = useSnackbar()
  const { books, loading: booksLoading, errorMessage, setErrorMessage, saveBook, deleteBook } = booksData
  const {
    types,
    placements,
    loading: lookupsLoading,
    errorMessage: lookupError,
    setErrorMessage: setLookupError,
  } = lookups
  const { getActiveLoanCount, loading: loansLoading, fetchLoans } = loans

  const isLoading = booksLoading || lookupsLoading || loansLoading
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<BookFormData>(emptyBookForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [bookToDelete, setBookToDelete] = useState<Book | null>(null)
  const [loanBookId, setLoanBookId] = useState<Book['id'] | null>(null)

  const displayError = errorMessage || lookupError
  const editingActiveLoans = editingId ? getActiveLoanCount(editingId) : 0

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

    if (editingId && formData.quantity < editingActiveLoans) {
      setErrorMessage(`Počet kusů nemůže být menší než počet aktuálně půjčených kusů (${editingActiveLoans}).`)
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
      if (editingId) await fetchLoans()
      setIsFormOpen(false)
      showNotification(editingId ? 'Kniha byla upravena.' : 'Kniha byla přidána.')
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'Chyba při ukládání knihy'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!bookToDelete) return
    setErrorMessage(null)
    try {
      await deleteBook(bookToDelete.id)
      showNotification('Kniha byla smazána.')
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, 'Chyba při mazání knihy'))
    } finally {
      setBookToDelete(null)
    }
  }

  const searchableBooks = useMemo(() => {
    return books.map((book) => ({
      book,
      searchText: normalizeSearchText(
        `${book.title} ${book.author ?? ''} ${book.publisher ?? ''} ${book.placement?.name ?? ''} ${book.type?.name ?? ''}`,
      ),
    }))
  }, [books])

  const filteredBooks = useMemo(() => {
    const tokens = normalizeSearchText(deferredSearch).trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return books
    return searchableBooks
      .filter(({ searchText }) => tokens.every((token) => searchText.includes(token)))
      .map(({ book }) => book)
  }, [books, searchableBooks, deferredSearch])

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
    {
      field: 'availability',
      headerName: 'Volné / Celkem',
      type: 'number',
      width: 135,
      valueGetter: (_value, row: Book) => Math.max(0, row.quantity - getActiveLoanCount(row.id)),
      renderCell: (params) => {
        const row = params.row as Book
        const available = Math.max(0, row.quantity - getActiveLoanCount(row.id))
        return (
          <Typography
            variant="body2"
            color={available > 0 ? 'success.main' : 'error.main'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
              width: '100%',
              fontWeight: 600,
            }}
          >
            {available} / {row.quantity}
          </Typography>
        )
      },
    },
    {
      field: 'actions',
      headerName: 'Akce',
      width: 145,
      sortable: false,
      renderCell: (params) => {
        const row = params.row as Book
        const available = Math.max(0, row.quantity - getActiveLoanCount(row.id))
        return (
          <Stack direction="row" spacing={0.5} sx={{ height: '100%', alignItems: 'center' }}>
            <Tooltip title={available > 0 ? 'Půjčit knihu' : 'Žádné volné kusy'}>
              <span>
                <IconButton
                  size="small"
                  color="success"
                  disabled={isLoading || available <= 0}
                  onClick={() => setLoanBookId(row.id)}
                >
                  <BookmarkAddIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Upravit">
              <span>
                <IconButton size="small" color="primary" disabled={isLoading} onClick={() => handleOpenEdit(row)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Smazat">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={isLoading}
                  onClick={() => setBookToDelete(row)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )
      },
    },
  ], [getActiveLoanCount, handleOpenEdit, isLoading])

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

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, alignItems: { md: 'center' } }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Hledat knihu (podle názvu, autora, nakladatele, umístění nebo typu)..."
          variant="outlined"
          sx={{ background: 'white' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Vymazat hledání" onClick={() => setSearch('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
        <Button variant="contained" disabled={isLoading} startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ flexShrink: 0 }}>Přidat knihu</Button>
      </Stack>

      <Paper elevation={3} sx={{ width: '100%' }}>
        <DataGrid
          autoHeight
          rows={filteredBooks}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[10, 25, 50]}
          localeText={{
            noRowsLabel: deferredSearch.trim()
              ? 'Hledání neodpovídá žádná kniha.'
              : 'V katalogu zatím nejsou žádné knihy.',
          }}
          sx={{ border: 'none' }}
        />
      </Paper>

      <BookFormDialog
        open={isFormOpen}
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
        activeLoansCount={editingActiveLoans}
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

      <LoanFormDialog
        open={loanBookId !== null}
        initialBookId={loanBookId}
        onClose={() => setLoanBookId(null)}
      />

      <DeleteConfirmDialog
        open={Boolean(bookToDelete)}
        bookTitle={bookToDelete?.title}
        bookAuthor={bookToDelete?.author}
        onClose={() => setBookToDelete(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  )
}
