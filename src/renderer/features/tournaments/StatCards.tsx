import { Calendar, CheckCircle2, FileText, Trophy, type LucideIcon } from 'lucide-react'
import type { Tournament } from '@shared/types'
import { appearAfter } from '@/lib/animation'
import { cn } from '@/lib/utils'
import { statCounts } from './selectors'

const CARDS: {
  key: keyof ReturnType<typeof statCounts>
  label: string
  icon: LucideIcon
  color: string
  tone: string
}[] = [
  {
    key: 'total',
    label: 'Tournois organisés',
    icon: Trophy,
    color: 'text-primary bg-primary/15',
    tone: '--primary',
  },
  {
    key: 'completed',
    label: 'Terminés',
    icon: CheckCircle2,
    color: 'text-success-500 bg-success-500/15',
    tone: '--success-500',
  },
  {
    key: 'upcoming',
    label: 'À venir',
    icon: Calendar,
    color: 'text-pending-500 bg-pending-500/15',
    tone: '--pending-500',
  },
  {
    key: 'draft',
    label: 'Brouillons',
    icon: FileText,
    color: 'text-muted-foreground bg-muted-foreground/15',
    tone: '--muted-foreground',
  },
]

export function StatCards({ tournaments }: { tournaments: Tournament[] }) {
  const counts = statCounts(tournaments)
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, color, tone }, i) => (
        <div
          key={key}
          style={{
            ...appearAfter(240 + i * 180),
            background: `linear-gradient(135deg, color-mix(in srgb, var(${tone}) 16%, var(--card)), var(--card) 65%)`,
          }}
          className="animate-card-in rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl font-bold tracking-tight tabular-nums">{counts[key]}</div>
              <div className="mt-1 text-[13px] text-muted-foreground">{label}</div>
            </div>
            <div className={cn('flex size-8 items-center justify-center rounded-lg', color)}>
              <Icon className="size-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
