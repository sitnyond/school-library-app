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
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import MoreTimeIcon from '@mui/icons-material/MoreTime'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { BarChart, PieChart } from '@mui/x-charts'

import { useLibraryData } from '../../context/libraryDataContext'
import { useSnackbar } from '../../context/snackbarContext'
import type { Loan } from '../../types'
import {
  formatCzDate,
  formatDaysCz,
  formatSchoolYear,
  getSchoolYearStart,
  todayIsoDate,
} from '../../utils/dates'
import { getErrorMessage } from '../../utils/errors'
import {
  computeBookRankings,
  computeClassStats,
  computeTimeChart,
  computeTypeStats,
  filterLoansByPeriod,
  getAvailableSchoolYears,
  getOverdueLoans,
} from '../../utils/overviewStats'
import { ExtendLoanDialog } from '../loans/ExtendLoanDialog'
import { TopBooksDialog } from '../overview/TopBooksDialog'

export function OverviewTab() {
  const { books: booksData, loans: loansData, lookups } = useLibraryData()
  const { showNotification } = useSnackbar()
  const { books, loading: booksLoading, errorMessage: booksError } = booksData
  const { loans, activeLoans, loading: loansLoading, errorMessage: loansError, returnLoan } = loansData

  const loading = booksLoading || loansLoading || lookups.loading
  const [actionError, setActionError] = useState<string | null>(null)
  const displayError = actionError || loansError || booksError || lookups.errorMessage
  const today = todayIsoDate()
  const currentSchoolYear = getSchoolYearStart(today)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | number>(currentSchoolYear)
  const [topBooksDialogOpen, setTopBooksDialogOpen] = useState(false)
  const [loanToExtend, setLoanToExtend] = useState<Loan | null>(null)
  const [loanToReturn, setLoanToReturn] = useState<Loan | null>(null)
  const [isReturning, setIsReturning] = useState(false)

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

  const availableSchoolYears = useMemo(
    () => getAvailableSchoolYears(loans, currentSchoolYear),
    [loans, currentSchoolYear],
  )

  const periodLoans = useMemo(
    () => filterLoansByPeriod(loans, selectedPeriod),
    [loans, selectedPeriod],
  )

  const returnedInPeriod = useMemo(
    () => periodLoans.filter((loan) => loan.returned_at !== null).length,
    [periodLoans],
  )

  const totalCopies = useMemo(() => books.reduce((sum, book) => sum + book.quantity, 0), [books])

  const overdueLoans = useMemo(() => getOverdueLoans(activeLoans, today), [activeLoans, today])

  const classStats = useMemo(
    () => computeClassStats(lookups.classes, periodLoans),
    [lookups.classes, periodLoans],
  )

  const typeStats = useMemo(() => computeTypeStats(books, periodLoans), [books, periodLoans])

  const timeChart = useMemo(
    () => computeTimeChart(selectedPeriod, availableSchoolYears, loans, periodLoans),
    [selectedPeriod, availableSchoolYears, loans, periodLoans],
  )

  const periodLabel = selectedPeriod === 'all' ? 'celkem' : formatSchoolYear(selectedPeriod)

  const allBookRankings = useMemo(
    () => computeBookRankings(books, periodLoans),
    [books, periodLoans],
  )

  const topBooks = useMemo(
    () => allBookRankings.filter((item) => item.count > 0).slice(0, 10),
    [allBookRankings],
  )
  const maxBookLoans = topBooks[0]?.count ?? 1

  return (
    <Stack spacing={2}>
      {loading && <LinearProgress />}

      {displayError && (
        <Alert severity="error" onClose={actionError ? () => setActionError(null) : undefined}>
          {displayError}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        }}
      >
        <Paper elevation={1} sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
            <MenuBookIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" color="text.secondary">
              Počet titulů
            </Typography>
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {books.length}
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
            <LibraryBooksIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" color="text.secondary">
              Počet kusů
            </Typography>
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {totalCopies}
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
            <SwapHorizIcon color="info" fontSize="small" />
            <Typography variant="subtitle2" color="text.secondary">
              Aktuálně půjčeno
            </Typography>
          </Stack>
          <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
            {activeLoans.length}
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
            <WarningAmberIcon color={overdueLoans.length > 0 ? 'error' : 'success'} fontSize="small" />
            <Typography variant="subtitle2" color="text.secondary">
              Po termínu
            </Typography>
          </Stack>
          <Typography
            variant="h4"
            color={overdueLoans.length > 0 ? 'error.main' : 'success.main'}
            sx={{ fontWeight: 700 }}
          >
            {overdueLoans.length}
          </Typography>
        </Paper>
      </Box>

      {overdueLoans.length > 0 && (
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Zpožděné výpůjčky ({overdueLoans.length})
          </Typography>
          <TableContainer sx={{ maxHeight: 320 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Třída</TableCell>
                  <TableCell>Žák</TableCell>
                  <TableCell>Kniha</TableCell>
                  <TableCell>Termín vrácení</TableCell>
                  <TableCell align="right">Po termínu</TableCell>
                  <TableCell align="right" width={100}>
                    Akce
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overdueLoans.map(({ loan, overdueDays }) => (
                  <TableRow key={loan.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>{loan.class?.name ?? '—'}</TableCell>
                    <TableCell>{loan.borrower_name ?? '—'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{loan.book?.title ?? '—'}</Typography>
                      {loan.book?.author && (
                        <Typography variant="caption" color="text.secondary">
                          {loan.book.author}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatCzDate(loan.due_date)}</TableCell>
                    <TableCell align="right">
                      <Chip size="small" color="error" label={`+${formatDaysCz(overdueDays)}`} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                        <Tooltip title="Vrátit knihu">
                          <span>
                            <IconButton
                              size="small"
                              color="success"
                              disabled={loading}
                              onClick={() => setLoanToReturn(loan)}
                            >
                              <AssignmentReturnIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Prodloužit výpůjčku">
                          <span>
                            <IconButton
                              size="small"
                              color="info"
                              disabled={loading}
                              onClick={() => setLoanToExtend(loan)}
                            >
                              <MoreTimeIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Divider />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h6">Statistiky výpůjček</Typography>
          <Typography variant="body2" color="text.secondary">
            Výpůjček ({periodLabel}): <strong>{periodLoans.length}</strong> · vráceno: {returnedInPeriod}
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          label="Školní rok"
          value={selectedPeriod === 'all' ? 'all' : String(selectedPeriod)}
          onChange={(e) => {
            const val = e.target.value
            setSelectedPeriod(val === 'all' ? 'all' : Number(val))
          }}
          sx={{ minWidth: 220, background: 'white' }}
        >
          {availableSchoolYears.map((year) => (
            <MenuItem key={year} value={String(year)}>
              {formatSchoolYear(year)}
              {year === currentSchoolYear ? ' (aktuální)' : ''}
            </MenuItem>
          ))}
          <MenuItem value="all">Všechny roky</MenuItem>
        </TextField>
      </Stack>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Výpůjčky podle tříd
          </Typography>
          {classStats.labels.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              V Nastavení zatím nejsou žádné třídy.
            </Typography>
          ) : (
            <BarChart
              height={250}
              hideLegend
              borderRadius={4}
              grid={{ horizontal: true }}
              xAxis={[{ scaleType: 'band', data: classStats.labels, label: 'Třída', height: 64, tickLabelInterval: () => true }]}
              yAxis={[{ tickMinStep: 1 }]}
              series={[{ data: classStats.counts, label: 'Výpůjčky' }]}
            />
          )}
        </Paper>

        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Výpůjčky podle typů knih
          </Typography>
          {typeStats.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Ve zvoleném období nejsou žádné výpůjčky.
            </Typography>
          ) : (
            <PieChart
              height={250}
              series={[
                {
                  data: typeStats,
                  innerRadius: 36,
                  paddingAngle: 2,
                  cornerRadius: 4,
                },
              ]}
            />
          )}
        </Paper>
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {timeChart.title}
          </Typography>
          <BarChart
            height={250}
            hideLegend
            borderRadius={4}
            grid={{ horizontal: true }}
            xAxis={[{ scaleType: 'band', data: timeChart.labels, label: timeChart.axisLabel, height: 64, tickLabelInterval: () => true }]}
            yAxis={[{ tickMinStep: 1 }]}
            series={[{ data: timeChart.counts, label: 'Výpůjčky' }]}
          />
        </Paper>

        <Paper elevation={1} sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Nejpůjčovanější knihy
            </Typography>
            {books.length > 0 && (
              <Button size="small" variant="outlined" onClick={() => setTopBooksDialogOpen(true)}>
                Zobrazit všechny
              </Button>
            )}
          </Stack>

          {topBooks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Ve zvoleném období nejsou žádné výpůjčky.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={44}>#</TableCell>
                    <TableCell>Kniha</TableCell>
                    <TableCell width={135} sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      Typ
                    </TableCell>
                    <TableCell align="right" width={120}>
                      Výpůjček
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topBooks.map((item) => (
                    <TableRow key={item.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: item.rank <= 3 ? 700 : 400 }}>
                          {item.rank}.
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.title}</Typography>
                        {item.author && (
                          <Typography variant="caption" color="text.secondary">
                            {item.author}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{item.typeName}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Box sx={{ width: 64, display: { xs: 'none', xl: 'block' } }}>
                            <LinearProgress
                              variant="determinate"
                              value={(item.count / maxBookLoans) * 100}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 24, textAlign: 'right' }}>
                            {item.count}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <TopBooksDialog
        open={topBooksDialogOpen}
        periodLabel={periodLabel}
        allBookRankings={allBookRankings}
        onClose={() => setTopBooksDialogOpen(false)}
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
    </Stack>
  )
}
