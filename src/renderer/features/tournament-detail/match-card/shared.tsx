import type { MatchCardProps } from './view'

export function StatusPill({ kind }: { kind: 'pending' | 'live' }) {
  return kind === 'live' ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
      <span className="size-1.75 animate-[badge-pulse_1.6s_ease-in-out_infinite] rounded-full bg-primary" />
      En cours
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <span className="size-1.75 rounded-full bg-success-500" />
      Prêt
    </span>
  )
}

export function RoundPill({ round }: { round: number }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
      Tour {round}
    </span>
  )
}

export function AdvantageBadge({ adv, long }: { adv: number; long?: boolean }) {
  if (adv <= 0) return null
  return (
    <span
      title="Points d'avance attribués par le handicap"
      className="inline-flex items-center gap-1.5 rounded-full bg-success-500/15 px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
    >
      <span className="size-1.5 rounded-full bg-success-500" />+{adv} pts{long ? " d'avance" : ''}
    </span>
  )
}

export function ActionButton({ kind, onAction }: Pick<MatchCardProps, 'kind' | 'onAction'>) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onAction()
      }}
      className="h-8.5 w-full rounded-md border text-[13px] font-semibold transition-colors hover:bg-muted"
    >
      {kind === 'live' ? 'Saisir le résultat' : 'Lancer le match'}
    </button>
  )
}
