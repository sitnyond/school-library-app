import type { ReactElement } from 'react'
import { AppBar, Box, Button, Container, Stack, Tab, Tabs, Toolbar, Typography } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'

import { supabase } from '../supabaseClient'
import { useHashTab } from '../hooks/useHashTab'
import { LibraryDataProvider } from '../context/LibraryDataProvider'
import { BooksTab } from './tabs/BooksTab'
import { LoansTab } from './tabs/LoansTab'
import { PlaceholderTab } from './tabs/PlaceholderTab'
import { SettingsTab } from './tabs/SettingsTab'

const TAB_KEYS = ['prehled', 'vypujcky', 'knihy', 'nastaveni'] as const
type TabKey = (typeof TAB_KEYS)[number]

const TABS: { key: TabKey; label: string; icon: ReactElement }[] = [
  { key: 'prehled', label: 'Přehled', icon: <DashboardIcon /> },
  { key: 'vypujcky', label: 'Výpůjčky', icon: <SwapHorizIcon /> },
  { key: 'knihy', label: 'Knihy', icon: <MenuBookIcon /> },
  { key: 'nastaveni', label: 'Nastavení', icon: <SettingsIcon /> },
]

interface AppShellProps {
  userEmail: string
}

export function AppShell({ userEmail }: AppShellProps) {
  const [tab, setTab] = useHashTab(TAB_KEYS, 'prehled')

  return (
    <LibraryDataProvider>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
            <Typography variant="h5" component="h1" color="primary" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
              School library 📚
            </Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Přihlášen: {userEmail}
              </Typography>
              <Button variant="outlined" color="inherit" size="small" startIcon={<LogoutIcon />} onClick={() => supabase.auth.signOut()}>
                Odhlásit
              </Button>
            </Stack>
          </Toolbar>
          <Tabs
            value={tab}
            onChange={(_, value: TabKey) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {TABS.map((t) => (
              <Tab key={t.key} value={t.key} label={t.label} icon={t.icon} iconPosition="start" sx={{ minHeight: 48 }} />
            ))}
          </Tabs>
        </Container>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box role="tabpanel">
          {tab === 'prehled' && (
            <PlaceholderTab title="Přehled" description="Statistiky, grafy a zpožděné výpůjčky – připravujeme." />
          )}
          {tab === 'vypujcky' && <LoansTab />}
          {tab === 'knihy' && <BooksTab />}
          {tab === 'nastaveni' && <SettingsTab />}
        </Box>
      </Container>
    </LibraryDataProvider>
  )
}
