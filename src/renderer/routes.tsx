import { createHashRouter } from 'react-router'
import { AppLayout } from '@/components/AppLayout'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { TournamentDetailPage } from '@/features/tournament-detail/TournamentDetailPage'
import { DashboardPage } from '@/features/tournaments/DashboardPage'

// Hash routing: the production build is served from file://
export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/tournaments/:id/:tab?', element: <TournamentDetailPage /> },
    ],
  },
])
