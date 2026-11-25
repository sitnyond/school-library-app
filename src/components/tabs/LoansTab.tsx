import { useDeferredValue, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import MoreTimeIcon from '@mui/icons-material/MoreTime'
import SearchIcon from '@mui/icons-material/Search'

import { useLibraryData } from '../../context/libraryDataContext'
import { useSnackbar } from '../../context/snackbarContext'
import type { Loan } from '../../types'
import { daysOverdue, formatCzDate, formatCzDateTime, formatDaysCz, todayIsoDate } from '../../utils/dates'
import { getErrorMessage } from '../../utils/errors'
import { normalizeSearchText, tokenizeSearch } from '../../utils/search'
import { ExtendLoanDialog } from '../loans/ExtendLoanDialog'
import { LoanFormDialog } from '../loans/LoanFormDialog'

export function LoansTab() {
  const { loans: loansData, books: booksData, lookups } = useLibraryData()
  const { showNotification } = useSnackbar()
  const { activeLoans, returnedLoans, loading: loansLoading, errorMessage, setErrorMessage, returnLoan, deleteLoan } =
    loansData

  const isLoading = loansLoading || booksData.loading || lookups.loading
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [showHistory, setShowHistory] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [loanToExtend, setLoanToExtend] = useState<Loan | null>(null)

  const [loanToReturn, setLoanToReturn] = useState<Loan | null>(null)
  const [isReturning, setIsReturning] = useState(false)
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const today = todayIsoDate()
  const displayError = actionError || errorMessage

  const sortedLoans = useMemo(() => {
    if (showHistory) {
      return [...returnedLoans].sort((a, b) => (b.returned_at ?? '').localeCompare(a.returned_at ?? ''))
    }
    return [...activeLoans].sort(
      (a, b) => a.due_date.localeCompare(b.due_date) || a.loaned_at.localeCompare(b.loaned_at),
    )
  }, [activeLoans, returnedLoans, showHistory])

  const searchableLoans = useMemo(() => {
    return sortedLoans.map((loan) => ({
      loan,
      searchText: normalizeSearchText(
        `${loan.book?.title ?? ''} ${loan.book?.author ?? ''} ${loan.class?.name ?? ''} ${loan.borrower_name ?? ''} ${loan.created_by_email ?? ''}`,
      ),
    }))
  }, [sortedLoans])

  const filteredLoans = useMemo(() => {
    const tokens = tokenizeSearch(deferredSearch)
    if (tokens.length === 0) return sortedLoans
    return searchableLoans
      .filter(({ searchText }) => tokens.every((token) => searchText.includes(token)))
      .map(({ loan }) => loan)
  }, [sortedLoans, searchableLoans, deferredSearch])

  const handleConfirmReturn = async () => {
    if (!loanToReturn) return
    setActionError(null)
    setIsReturning(true)
    try {
      await returnLoan(loanToReturn.id)
      setLoanToReturn(null)
      showNotification('Kniha byla vrácena a jméno žáka smazáno.')
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, 'Chyba při vracení knihy'))
      setLoanToReturn(null)
    } finally {
      setIsReturning(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!loanToDelete) return
    setActionError(null)
    setIsDeleting(true)
    try {
      await deleteLoan(loanToDelete.id)
      setLoanToDelete(null)
      showNotification('Výpůjčka byla smazána.')
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, 'Chyba při mazání výpůjčky'))
      setLoanToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: GridColDef<Loan>[] = useMemo(() => {
    const baseCols: GridColDef<Loan>[] = [
      {
        field: 'book',
        headerName: 'Kniha',
        flex: 1.5,
        minWidth: 220,
        valueGetter: (_value, row) => row.book?.title ?? '',
        renderCell: ({ row }) => (
          <Box sx={{ py: 0.75, lineHeight: 1.3 }}>
            <Typography variant="body2" noWrap>
              {row.book?.title ?? '—'}
            </Typography>
            {row.book?.author && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {row.book.author}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'class',
        headerName: 'Třída',
        width: 95,
        valueGetter: (_value, row) => row.class?.name ?? '',
      },
    ]

    if (!showHistory) {
      baseCols.push({
        field: 'borrower_name',
        headerName: 'Žák',
        flex: 0.9,
        minWidth: 140,
      })
    }

    baseCols.push(
      {
        field: 'loaned_at',
        headerName: 'Půjčeno',
        width: 115,
        renderCell: ({ row }) => formatCzDate(row.loaned_at),
      },
      {
        field: 'due_date',
        headerName: 'Termín vrácení',
        width: 210,
        renderCell: ({ row }) => {
          const overdue = !showHistory ? daysOverdue(row.due_date, today) : 0
          const isDueToday = !showHistory && row.due_date === today
          return (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" color={overdue > 0 ? 'error.main' : 'text.primary'} sx={{ fontWeight: overdue > 0 ? 600 : 400 }}>
                {formatCzDate(row.due_date)}
              </Typography>
              {overdue > 0 && (
                <Chip size="small" color="error" label={`+${formatDaysCz(overdue)}`} />
              )}
              {isDueToday && (
                <Chip size="small" color="warning" label="Dnes" />
              )}
            </Stack>
          )
        },
      },
    )

    if (showHistory) {
      baseCols.push({
        field: 'returned_at',
        headerName: 'Vráceno',
        width: 155,
        renderCell: ({ row }) => formatCzDateTime(row.returned_at),
      })
    }

    baseCols.push({
      field: 'created_by_email',
      headerName: 'Zadal',
      flex: 0.9,
      minWidth: 170,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.75, lineHeight: 1.3 }}>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {row.created_by_email || '—'}
          </Typography>
          <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block' }}>
            {formatCzDateTime(row.created_at)}
          </Typography>
        </Box>
      ),
    })

    if (!showHistory) {
      baseCols.push({
        field: 'actions',
        headerName: 'Akce',
        width: 215,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              color="success"
              disabled={isLoading}
              startIcon={<AssignmentReturnIcon fontSize="small" />}
              onClick={() => setLoanToReturn(row)}
            >
              Vrátit
            </Button>
            <Tooltip title="Prodloužit výpůjčku">
              <span>
                <IconButton
                  size="small"
                  color="info"
                  disabled={isLoading}
                  onClick={() => setLoanToExtend(row)}
                >
                  <MoreTimeIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Upravit výpůjčku">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={isLoading}
                  onClick={() => {
                    setEditingLoan(row)
                    setIsFormOpen(true)
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Smazat chybnou výpůjčku">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={isLoading}
                  onClick={() => setLoanToDelete(row)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ),
      })
    }

    return baseCols
  }, [showHistory, today, isLoading])

  return (
    <Box>
      {displayError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => {
            setActionError(null)
            setErrorMessage(null)
          }}
        >
          {displayError}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, alignItems: { md: 'center' } }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Hledat výpůjčku (kniha, autor, třída, žák, učitel)..."
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
        <ToggleButtonGroup
          size="small"
          exclusive
          color="primary"
          value={showHistory ? 'history' : 'active'}
          onChange={(_, value: 'active' | 'history' | null) => {
            if (value !== null) setShowHistory(value === 'history')
          }}
          sx={{ bgcolor: 'white', flexShrink: 0 }}
        >
          <ToggleButton value="active">Aktivní</ToggleButton>
          <ToggleButton value="history">Historie</ToggleButton>
        </ToggleButtonGroup>
        <Button
          variant="contained"
          disabled={isLoading}
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingLoan(null)
            setIsFormOpen(true)
          }}
          sx={{ flexShrink: 0 }}
        >
          Nová výpůjčka
        </Button>
      </Stack>

      <Paper elevation={3} sx={{ width: '100%' }}>
        <DataGrid
          autoHeight
          getRowHeight={() => 'auto'}
          rows={filteredLoans}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          getRowClassName={({ row }) => (!showHistory && daysOverdue(row.due_date, today) > 0 ? 'loan-overdue' : '')}
          localeText={{
            noRowsLabel: deferredSearch.trim()
              ? 'Hledání neodpovídá žádná výpůjčka.'
              : showHistory
                ? 'Zatím nejsou žádné vrácené výpůjčky.'
                : 'Aktuálně nejsou žádné aktivní výpůjčky.',
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
            '& .loan-overdue': {
              bgcolor: 'rgba(211, 47, 47, 0.06)',
              '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.11)' },
            },
          }}
        />
      </Paper>

      <LoanFormDialog
        open={isFormOpen}
        editingLoan={editingLoan}
        onClose={() => {
          setIsFormOpen(false)
          setEditingLoan(null)
        }}
      />

      <ExtendLoanDialog loan={loanToExtend} onClose={() => setLoanToExtend(null)} />

      <Dialog open={Boolean(loanToReturn)} onClose={() => !isReturning && setLoanToReturn(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Potvrdit vrácení knihy?</DialogTitle>
        <DialogContent>
          {loanToReturn && (
            <Stack spacing={1.5}>
              <Typography variant="body2">
                <strong>{loanToReturn.book?.title ?? 'Kniha'}</strong>
                {loanToReturn.class?.name ? ` (${loanToReturn.class.name})` : ''}
                {loanToReturn.borrower_name ? ` – ${loanToReturn.borrower_name}` : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Po potvrzení vrácení se jméno žáka trvale smaže. V historii zůstane jen kniha, třída a data výpůjčky.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoanToReturn(null)} disabled={isReturning}>
            Zrušit
          </Button>
          <Button onClick={handleConfirmReturn} color="success" variant="contained" disabled={isReturning}>
            {isReturning ? 'Ukládám...' : 'Vrátit knihu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(loanToDelete)} onClose={() => !isDeleting && setLoanToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Smazat chybnou výpůjčku?</DialogTitle>
        <DialogContent>
          {loanToDelete && (
            <Stack spacing={1.5}>
              <Typography variant="body2">
                <strong>{loanToDelete.book?.title ?? 'Kniha'}</strong>
                {loanToDelete.class?.name ? ` (${loanToDelete.class.name})` : ''}
                {loanToDelete.borrower_name ? ` – ${loanToDelete.borrower_name}` : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tato akce výpůjčku trvale odstraní bez započítání do statistik.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoanToDelete(null)} disabled={isDeleting}>
            Zrušit
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? 'Mažu...' : 'Smazat výpůjčku'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
