import { useMemo, useState, type SyntheticEvent } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useLibraryData } from '../../context/libraryDataContext'
import type { Book } from '../../types'
import { addDaysIsoDate, todayIsoDate } from '../../utils/dates'
import { getErrorMessage } from '../../utils/errors'

interface LoanFormDialogProps {
  open: boolean
  initialBookId?: Book['id'] | null
  onClose: () => void
}

interface BookOption extends Book {
  available: number
  /** Předpočítaný text (název + autor) bez diakritiky pro rychlé filtrování. */
  searchText: string
}

const MAX_AUTOCOMPLETE_OPTIONS = 25

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function LoanFormContent({
  initialBookId,
  onClose,
}: {
  initialBookId?: Book['id'] | null
  onClose: () => void
}) {
  const { books: booksData, lookups, appSettings, loans } = useLibraryData()
  const loanDays = appSettings.settings.loan_days

  const availableBooks = useMemo<BookOption[]>(() => {
    return booksData.books
      .map((book) => ({
        ...book,
        available: book.quantity - loans.getActiveLoanCount(book.id),
        searchText: normalizeSearchText(`${book.title} ${book.author ?? ''}`),
      }))
      .filter((book) => book.available > 0)
      .sort((a, b) => a.title.localeCompare(b.title, 'cs'))
  }, [booksData.books, loans])

  const initialLoanedAt = todayIsoDate()
  const [bookId, setBookId] = useState<string>(initialBookId ? String(initialBookId) : '')
  const [classId, setClassId] = useState<string>('')
  const [borrowerName, setBorrowerName] = useState('')
  const [loanedAt, setLoanedAt] = useState(initialLoanedAt)
  const [dueDate, setDueDate] = useState(addDaysIsoDate(initialLoanedAt, loanDays))
  const [dueDateTouched, setDueDateTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedBook = useMemo(
    () => availableBooks.find((book) => String(book.id) === bookId) ?? null,
    [availableBooks, bookId],
  )

  const filterBooks = useMemo(() => {
    return (options: BookOption[], { inputValue }: { inputValue: string }) => {
      const tokens = normalizeSearchText(inputValue).trim().split(/\s+/).filter(Boolean)
      if (tokens.length === 0) {
        return options.slice(0, MAX_AUTOCOMPLETE_OPTIONS)
      }
      const matched: BookOption[] = []
      for (const option of options) {
        if (tokens.every((token) => option.searchText.includes(token))) {
          matched.push(option)
          if (matched.length >= MAX_AUTOCOMPLETE_OPTIONS) break
        }
      }
      return matched
    }
  }, [])

  const handleLoanedAtChange = (nextLoanedAt: string) => {
    setLoanedAt(nextLoanedAt)
    if (nextLoanedAt && !dueDateTouched) {
      setDueDate(addDaysIsoDate(nextLoanedAt, loanDays))
    }
  }

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedBook) {
      setError('Vyberte prosím dostupnou knihu.')
      return
    }
    if (!classId) {
      setError('Vyberte prosím třídu. Pokud žádná neexistuje, přidejte ji v Nastavení.')
      return
    }
    if (!borrowerName.trim()) {
      setError('Zadejte prosím jméno žáka.')
      return
    }
    if (dueDate < loanedAt) {
      setError('Termín vrácení nemůže být dříve než datum půjčení.')
      return
    }

    setIsSubmitting(true)
    try {
      await loans.createLoan({
        book_id: selectedBook.id,
        class_id: classId,
        borrower_name: borrowerName.trim(),
        loaned_at: loanedAt,
        due_date: dueDate,
      })
      onClose()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Chyba při ukládání výpůjčky'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>Nová výpůjčka</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Autocomplete
            fullWidth
            options={availableBooks}
            value={selectedBook}
            onChange={(_, newValue) => setBookId(newValue ? String(newValue.id) : '')}
            filterOptions={filterBooks}
            getOptionKey={(option) => String(option.id)}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
            getOptionLabel={(option) => (option.author ? `${option.title} – ${option.author}` : option.title)}
            noOptionsText="Žádná dostupná kniha neodpovídá hledání."
            renderOption={(props, option) => {
              const { key, ...rest } = props
              return (
                <Box component="li" key={key} {...rest} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Box>
                    <Typography variant="body2">{option.title}</Typography>
                    {option.author && (
                      <Typography variant="caption" color="text.secondary">
                        {option.author}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="success.main" sx={{ flexShrink: 0, fontWeight: 500 }}>
                    volné: {option.available} / {option.quantity}
                  </Typography>
                </Box>
              )
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="Kniha"
                placeholder="Začněte psát název nebo autora..."
                helperText={`Zobrazuje se max. ${MAX_AUTOCOMPLETE_OPTIONS} výsledků – pro upřesnění napište název nebo autora.`}
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              required
              label="Třída"
              sx={{ minWidth: { sm: 140 } }}
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              helperText={lookups.classes.length === 0 ? 'Přidejte třídy v Nastavení.' : undefined}
            >
              {lookups.classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              fullWidth
              label="Jméno (např. Petr N.)"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              helperText="Stačí zkrácené jméno, po vrácení knihy se automaticky smaže."
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              required
              fullWidth
              type="date"
              label="Datum půjčení"
              value={loanedAt}
              onChange={(e) => handleLoanedAtChange(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              required
              fullWidth
              type="date"
              label="Termín vrácení"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value)
                setDueDateTouched(true)
              }}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: loanedAt },
              }}
              helperText={`Výchozí délka výpůjčky: ${loanDays} dní`}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Zrušit
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting || availableBooks.length === 0}>
          {isSubmitting ? 'Ukládám...' : 'Půjčit knihu'}
        </Button>
      </DialogActions>
    </form>
  )
}

export function LoanFormDialog({ open, initialBookId, onClose }: LoanFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {open && <LoanFormContent initialBookId={initialBookId} onClose={onClose} />}
    </Dialog>
  )
}
