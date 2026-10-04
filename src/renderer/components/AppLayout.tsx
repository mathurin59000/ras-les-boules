import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { CreateTournamentWizard } from '@/features/tournaments/CreateTournamentWizard'
import { useAppStore } from '@/stores/app-store'
import { applyPalette } from '@/lib/palette'
import { AppSidebar } from './AppSidebar'

export function AppLayout() {
  const theme = useAppStore((s) => s.theme)
  const palette = useAppStore((s) => s.palette)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => applyPalette(palette), [palette])

  return (
    <div className="flex h-full overflow-hidden">
      <AppSidebar />
      <main
        style={{ background: 'var(--page-decor, none)', backgroundAttachment: 'local' }}
        className="flex min-w-0 flex-1 flex-col gap-5.5 overflow-y-auto p-7"
      >
        <Outlet />
      </main>
      <CreateTournamentWizard />
      <Toaster />
    </div>
  )
}
