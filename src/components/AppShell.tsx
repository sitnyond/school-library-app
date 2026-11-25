import type { ReactElement } from 'react'
import { AppBar, Box, Button, Container, Stack, Tab, Tabs, Toolbar, Typography } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'

import { APP_TITLE } from '../config'
import { supabase } from '../supabaseClient'
import { useHashTab } from '../hooks/useHashTab'
import { LibraryDataProvider } from '../context/LibraryDataProvider'
import { SnackbarProvider } from '../context/SnackbarProvider'
import { BooksTab } from './tabs/BooksTab'
import { LoansTab } from './tabs/LoansTab'
import { OverviewTab } from './tabs/OverviewTab'
import { SettingsTab } from './tabs/SettingsTab'
import type { UserRole } from '../types'

const ADMIN_TAB_KEYS = ['prehled', 'vypujcky', 'knihy', 'nastaveni'] as const
const TEACHER_TAB_KEYS = ['prehled', 'vypujcky', 'knihy'] as const
type TabKey = (typeof ADMIN_TAB_KEYS)[number]

const ALL_TABS: { key: TabKey; label: string; icon: ReactElement }[] = [
  { key: 'prehled', label: 'Přehled', icon: <DashboardIcon /> },
  { key: 'vypujcky', label: 'Výpůjčky', icon: <SwapHorizIcon /> },
  { key: 'knihy', label: 'Knihy', icon: <MenuBookIcon /> },
  { key: 'nastaveni', label: 'Nastavení', icon: <SettingsIcon /> },
]

interface AppShellProps {
  userEmail: string
  userRole: UserRole
}

export function AppShell({ userEmail, userRole }: AppShellProps) {
  const isAdmin = userRole === 'admin'
  const visibleTabKeys: readonly TabKey[] = isAdmin ? ADMIN_TAB_KEYS : TEACHER_TAB_KEYS
  const visibleTabs = isAdmin ? ALL_TABS : ALL_TABS.filter((t) => t.key !== 'nastaveni')
  const [tab, setTab] = useHashTab(visibleTabKeys, 'prehled')
  const activeTab: TabKey = visibleTabKeys.includes(tab) ? tab : 'prehled'

  return (
    <SnackbarProvider>
      <LibraryDataProvider>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
            <Typography variant="h5" component="h1" color="primary" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
              {APP_TITLE} 📚
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
            value={activeTab}
            onChange={(_, value: TabKey) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {visibleTabs.map((t) => (
              <Tab key={t.key} value={t.key} label={t.label} icon={t.icon} iconPosition="start" sx={{ minHeight: 48 }} />
            ))}
          </Tabs>
        </Container>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box role="tabpanel">
          {activeTab === 'prehled' && <OverviewTab />}
          {activeTab === 'vypujcky' && <LoansTab />}
          {activeTab === 'knihy' && <BooksTab />}
          {activeTab === 'nastaveni' && isAdmin && <SettingsTab />}
        </Box>
      </Container>
      </LibraryDataProvider>
    </SnackbarProvider>
  )
}
