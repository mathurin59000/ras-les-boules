import { PlayerAvatar } from '@/components/PlayerAvatar'
import { ActionButton, AdvantageBadge, RoundPill, StatusPill } from './shared'
import { CARD_CLASS, matchSides, type MatchCardProps, type SideView } from './view'

function Line({ side }: { side: SideView }) {
  return (
    <div className="flex items-center gap-2.5">
      <PlayerAvatar name={side.player.name} className="size-8" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-semibold">{side.player.name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{side.ratingLabel}</span>
      </div>
      <AdvantageBadge adv={side.adv} long />
    </div>
  )
}

export function LinesCard(props: MatchCardProps) {
  const [a, b] = matchSides(props)
  return (
    <div
      data-testid="match-card"
      onClick={props.onAction}
      className={`${CARD_CLASS} flex flex-col gap-3 px-4 py-3.5`}
    >
      <div className="flex items-center justify-between gap-2">
        <StatusPill kind={props.kind} />
        <RoundPill round={props.match.round} />
      </div>
      <Line side={a} />
      <div className="flex items-center gap-2.5">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-bold text-muted-foreground">VS</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <Line side={b} />
      <ActionButton kind={props.kind} onAction={props.onAction} />
    </div>
  )
}
