import { useDeferredValue, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

export interface BookLoanRank {
  id: string
  rank: number
  title: string
  author: string | null
  typeName: string
  count: number
}

interface TopBooksDialogProps {
  open: boolean
  periodLabel: string
  allBookRankings: BookLoanRank[]
  onClose: () => void
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const COLUMNS: GridColDef<BookLoanRank>[] = [
  {
    field: 'rank',
    headerName: '#',
    width: 65,
    type: 'number',
    renderCell: ({ row }) => (
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: row.rank <= 3 && row.count > 0 ? 700 : 400 }}>
        {row.rank}.
      </Typography>
    ),
  },
  {
    field: 'title',
    headerName: 'Kniha',
    flex: 1.6,
    minWidth: 220,
    renderCell: ({ row }) => (
      <Box sx={{ py: 0.5, lineHeight: 1.3 }}>
        <Typography variant="body2" noWrap>
          {row.title}
        </Typography>
        {row.author && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {row.author}
          </Typography>
        )}
      </Box>
    ),
  },
  {
    field: 'typeName',
    headerName: 'Typ',
    width: 165,
  },
  {
    field: 'count',
    headerName: 'Výpůjček',
    type: 'number',
    width: 110,
    renderCell: ({ row }) => (
      <Typography
        variant="body2"
        color={row.count > 0 ? 'text.primary' : 'text.disabled'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: '100%',
          width: '100%',
          fontWeight: row.count > 0 ? 600 : 400,
        }}
      >
        {row.count}
      </Typography>
    ),
  },
]

function TopBooksDialogContent({
  periodLabel,
  allBookRankings,
  onClose,
}: Omit<TopBooksDialogProps, 'open'>) {
  const [search, setSearch] = useState('')
  const [includeUnborrowed, setIncludeUnborrowed] = useState(false)
  const deferredSearch = useDeferredValue(search)

  const unborrowedCount = useMemo(
    () => allBookRankings.filter((item) => item.count === 0).length,
    [allBookRankings],
  )

  const searchableRows = useMemo(() => {
    return allBookRankings.map((item) => ({
      item,
      searchText: normalizeSearchText(`${item.title} ${item.author ?? ''} ${item.typeName}`),
    }))
  }, [allBookRankings])

  const filteredRows = useMemo(() => {
    const tokens = normalizeSearchText(deferredSearch).trim().split(/\s+/).filter(Boolean)
    return searchableRows
      .filter(({ item, searchText }) => {
        if (!includeUnborrowed && item.count === 0) return false
        if (tokens.length === 0) return true
        return tokens.every((token) => searchText.includes(token))
      })
      .map(({ item }) => item)
  }, [searchableRows, deferredSearch, includeUnborrowed])

  return (
    <>
      <DialogTitle>Žebříček knih ({periodLabel})</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <TextField
              size="small"
              fullWidth
              label="🔍 Hledat knihu (název, autor, typ)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FormControlLabel
              sx={{ flexShrink: 0 }}
              control={
                <Switch
                  checked={includeUnborrowed}
                  onChange={(_, checked) => setIncludeUnborrowed(checked)}
                />
              }
              label={`Zahrnout nepůjčené (${unborrowedCount})`}
            />
          </Stack>

          <Box sx={{ height: 460, width: '100%' }}>
            <DataGrid
              rows={filteredRows}
              columns={COLUMNS}
              disableRowSelectionOnClick
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              pageSizeOptions={[10, 25, 50]}
              localeText={{
                noRowsLabel: deferredSearch.trim()
                  ? 'Hledání neodpovídá žádná kniha.'
                  : 'Ve zvoleném období nebyla půjčena žádná kniha.',
              }}
              sx={{
                '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
              }}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zavřít</Button>
      </DialogActions>
    </>
  )
}

export function TopBooksDialog({ open, periodLabel, allBookRankings, onClose }: TopBooksDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {open && (
        <TopBooksDialogContent
          periodLabel={periodLabel}
          allBookRankings={allBookRankings}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}
