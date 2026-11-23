import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'

import { useLibraryData } from '../../context/libraryDataContext'
import type { Loan } from '../../types'
import { daysOverdue, formatCzDate, formatCzDateTime, formatDaysCz, todayIsoDate } from '../../utils/dates'
import { getErrorMessage } from '../../utils/errors'
import { LoanFormDialog } from '../loans/LoanFormDialog'

export function LoansTab() {
  const { loans: loansData, books: booksData, lookups } = useLibraryData()
  const { activeLoans, returnedLoans, loading: loansLoading, errorMessage, setErrorMessage, returnLoan } = loansData

  const isLoading = loansLoading || booksData.loading || lookups.loading
  const [search, setSearch] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [loanToReturn, setLoanToReturn] = useState<Loan | null>(null)
  const [isReturning, setIsReturning] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const today = todayIsoDate()
  const displayError = actionError || errorMessage

  const sourceLoans = showHistory ? returnedLoans : activeLoans

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sourceLoans
    return sourceLoans.filter((loan) => {
      const title = loan.book?.title?.toLowerCase() ?? ''
      const author = loan.book?.author?.toLowerCase() ?? ''
      const className = loan.class?.name?.toLowerCase() ?? ''
      const borrower = loan.borrower_name?.toLowerCase() ?? ''
      const createdBy = loan.created_by_email?.toLowerCase() ?? ''
      return (
        title.includes(query) ||
        author.includes(query) ||
        className.includes(query) ||
        borrower.includes(query) ||
        createdBy.includes(query)
      )
    })
  }, [sourceLoans, search])

  const handleConfirmReturn = async () => {
    if (!loanToReturn) return
    setActionError(null)
    setIsReturning(true)
    try {
      await returnLoan(loanToReturn.id)
      setLoanToReturn(null)
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, 'Chyba při vracení knihy'))
    } finally {
      setIsReturning(false)
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
        width: 120,
        sortable: false,
        renderCell: ({ row }) => (
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

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { md: 'center' } }}>
        <TextField
          fullWidth
          label="🔍 Hledat výpůjčku (kniha, autor, třída, žák, učitel)..."
          variant="outlined"
          sx={{ background: 'white' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControlLabel
          sx={{ flexShrink: 0, ml: { md: 1 } }}
          control={
            <Switch
              checked={showHistory}
              onChange={(_, checked) => setShowHistory(checked)}
            />
          }
          label={`Zobrazit historii (${returnedLoans.length})`}
        />
        <Button
          variant="contained"
          disabled={isLoading}
          startIcon={<AddIcon />}
          onClick={() => setIsFormOpen(true)}
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
            noRowsLabel: showHistory ? 'Zatím nejsou žádné vrácené výpůjčky.' : 'Aktuálně nejsou žádné aktivní výpůjčky.',
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

      <LoanFormDialog open={isFormOpen} onClose={() => setIsFormOpen(false)} />

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
                Po potvrzení vrácení se jméno žáka trvale smaže (GDPR). V historii zůstane jen kniha, třída a data výpůjčky.
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
    </Box>
  )
}
