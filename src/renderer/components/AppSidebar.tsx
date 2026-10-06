import { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import {
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Settings,
  Trophy,
} from 'lucide-react'
import type { UpdateState } from '@shared/types'
import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui-store'

const NAV = [
  { to: '/', label: 'Tournois', icon: Trophy, end: false },
  { to: '/settings', label: 'Paramètres', icon: Settings, end: true },
]

function UpdateButton({ collapsed }: { collapsed: boolean }) {
  const [state, setState] = useState<UpdateState>({ status: 'idle' })
  useEffect(() => window.rlb.onUpdate(setState), [])
  if (state.status === 'idle') return null

  const {
    label,
    icon: Icon,
    onClick,
  } = state.status === 'available'
    ? {
        label: `Télécharger la v${state.version}`,
        icon: Download,
        onClick: window.rlb.downloadUpdate,
      }
    : state.status === 'downloading'
      ? {
          label: `Téléchargement ${Math.round(state.percent)} %`,
          icon: Download,
          onClick: undefined,
        }
      : { label: 'Redémarrer et installer', icon: RefreshCw, onClick: window.rlb.installUpdate }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={collapsed ? label : undefined}
      className="flex h-10 items-center justify-center gap-2 rounded-md bg-white/10 text-[13px] font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-70"
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && label}
    </button>
  )
}

export function AppSidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)
  const openWizard = useUiStore((s) => s.setWizardOpen)

  return (
    <aside
      style={{ background: 'var(--sidebar-bg, var(--neutral-900))' }}
      className={cn(
        'flex shrink-0 flex-col gap-4.5 overflow-hidden py-4.5 text-white transition-[width]',
        collapsed ? 'w-18 px-4' : 'w-58 px-3.5',
      )}
    >
      <div className={cn('flex items-center gap-2.5', collapsed ? 'justify-center' : 'px-2')}>
        <img src={logo} alt="Ras les boules" className="size-7 shrink-0 object-cover" />
        {!collapsed && (
          <span className="font-serif text-[19px] leading-none tracking-tight whitespace-nowrap">
            Ras les boules
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => openWizard(true)}
        title={collapsed ? 'Nouveau tournoi' : undefined}
        className="flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 text-[13px] font-semibold text-white transition-colors hover:bg-brand-500"
      >
        <Plus className="size-4 shrink-0" />
        {!collapsed && 'Nouveau tournoi'}
      </button>

      <div className="border-t border-white/10" />

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md py-2.25 text-[13px] transition-colors',
                collapsed ? 'justify-center' : 'px-2.5',
                isActive
                  ? 'bg-white/10 font-semibold text-white'
                  : 'font-medium text-neutral-300 hover:bg-white/5',
                to === '/settings' && 'mt-auto',
              )
            }
          >
            <Icon className="size-4.25 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <UpdateButton collapsed={collapsed} />

      <div
        className={cn(
          'flex items-center justify-between gap-1.5 border-t border-white/10 pt-3',
          collapsed && 'flex-col-reverse',
        )}
      >
        <span className="text-xs whitespace-nowrap text-neutral-400">
          {collapsed ? __APP_VERSION__ : `Version ${__APP_VERSION__}`}
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-300 hover:bg-white/10"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4.5" />
          ) : (
            <PanelLeftClose className="size-4.5" />
          )}
        </button>
      </div>
    </aside>
  )
}
