import { useMemo } from 'react'
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import HistoryIcon from '@mui/icons-material/History'
import { BarChart, LineChart, PieChart } from '@mui/x-charts'

import { useLibraryData } from '../../context/libraryDataContext'
import { daysOverdue, formatCzDate, formatDaysCz, todayIsoDate } from '../../utils/dates'

const MONTH_FORMATTER = new Intl.DateTimeFormat('cs-CZ', { month: 'short', year: '2-digit' })

function getRecentMonths(count: number): { key: string; label: string }[] {
  const now = new Date()
  const months: { key: string; label: string }[] = []
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.push({ key, label: MONTH_FORMATTER.format(date) })
  }
  return months
}

export function OverviewTab() {
  const { books: booksData, loans: loansData, lookups } = useLibraryData()
  const { books, loading: booksLoading, errorMessage: booksError } = booksData
  const { loans, activeLoans, returnedLoans, loading: loansLoading, errorMessage: loansError } = loansData

  const loading = booksLoading || loansLoading || lookups.loading
  const displayError = loansError || booksError || lookups.errorMessage
  const today = todayIsoDate()

  const totalCopies = useMemo(() => books.reduce((sum, book) => sum + book.quantity, 0), [books])
  const availableCopies = Math.max(0, totalCopies - activeLoans.length)

  const overdueLoans = useMemo(() => {
    return activeLoans
      .map((loan) => ({ loan, overdueDays: daysOverdue(loan.due_date, today) }))
      .filter((item) => item.overdueDays > 0)
      .sort((a, b) => b.overdueDays - a.overdueDays)
  }, [activeLoans, today])

  const classStats = useMemo(() => {
    const counts = new Map<string, number>()
    for (const loan of loans) {
      const name = loan.class?.name ?? 'Neznámá'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    const entries = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], 'cs'))
    return {
      labels: entries.map(([label]) => label),
      counts: entries.map(([, count]) => count),
    }
  }, [loans])

  const typeStats = useMemo(() => {
    const typeByBookId = new Map<string, string>()
    for (const book of books) {
      typeByBookId.set(String(book.id), book.type?.name ?? 'Bez typu')
    }
    const counts = new Map<string, number>()
    for (const loan of loans) {
      const typeName = typeByBookId.get(String(loan.book_id)) ?? 'Bez typu'
      counts.set(typeName, (counts.get(typeName) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], id) => ({ id, label, value }))
  }, [books, loans])

  const monthlyStats = useMemo(() => {
    const months = getRecentMonths(6)
    const counts = new Map<string, number>(months.map((m) => [m.key, 0]))
    for (const loan of loans) {
      const monthKey = loan.loaned_at.slice(0, 7)
      if (counts.has(monthKey)) {
        counts.set(monthKey, (counts.get(monthKey) ?? 0) + 1)
      }
    }
    return {
      labels: months.map((m) => m.label),
      counts: months.map((m) => counts.get(m.key) ?? 0),
    }
  }, [loans])

  return (
    <Stack spacing={3}>
      {loading && <LinearProgress />}

      {displayError && <Alert severity="error">{displayError}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        }}
      >
        <Paper elevation={1} sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
            <MenuBookIcon color="primary" />
            <Typography variant="subtitle2" color="text.secondary">
              Katalog knih
            </Typography>
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {books.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            titulů · celkem {totalCopies} kusů
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
            <SwapHorizIcon color="info" />
            <Typography variant="subtitle2" color="text.secondary">
              Aktuálně půjčeno
            </Typography>
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {activeLoans.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            volných kusů: {availableCopies}
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
            <WarningAmberIcon color={overdueLoans.length > 0 ? 'error' : 'success'} />
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
          <Typography variant="body2" color="text.secondary">
            {overdueLoans.length > 0 ? 'vyžaduje upomínku' : 'vše v termínu'}
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
            <HistoryIcon color="action" />
            <Typography variant="subtitle2" color="text.secondary">
              Celkem výpůjček
            </Typography>
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {loans.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            vráceno v historii: {returnedLoans.length}
          </Typography>
        </Paper>
      </Box>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Zpožděné výpůjčky
        </Typography>
        {overdueLoans.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aktuálně není žádná výpůjčka po termínu vrácení.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Třída</TableCell>
                  <TableCell>Žák</TableCell>
                  <TableCell>Kniha</TableCell>
                  <TableCell>Termín vrácení</TableCell>
                  <TableCell align="right">Po termínu</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overdueLoans.map(({ loan, overdueDays }) => (
                  <TableRow key={loan.id} hover>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Výpůjčky podle tříd
          </Typography>
          {classStats.labels.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Zatím nejsou žádné výpůjčky pro zobrazení grafu.
            </Typography>
          ) : (
            <BarChart
              height={280}
              xAxis={[{ scaleType: 'band', data: classStats.labels }]}
              yAxis={[{ tickMinStep: 1 }]}
              series={[{ data: classStats.counts, label: 'Výpůjčky' }]}
            />
          )}
        </Paper>

        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Výpůjčky podle typů knih
          </Typography>
          {typeStats.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Zatím nejsou žádné výpůjčky pro zobrazení grafu.
            </Typography>
          ) : (
            <PieChart
              height={280}
              series={[
                {
                  data: typeStats,
                  innerRadius: 40,
                  paddingAngle: 2,
                  cornerRadius: 4,
                },
              ]}
            />
          )}
        </Paper>
      </Box>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Trend výpůjček (posledních 6 měsíců)
        </Typography>
        {loans.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Zatím nejsou žádné výpůjčky pro zobrazení trendu.
          </Typography>
        ) : (
          <LineChart
            height={280}
            xAxis={[{ scaleType: 'point', data: monthlyStats.labels }]}
            yAxis={[{ tickMinStep: 1 }]}
            series={[{ data: monthlyStats.counts, label: 'Počet výpůjček', area: true }]}
          />
        )}
      </Paper>
    </Stack>
  )
}
