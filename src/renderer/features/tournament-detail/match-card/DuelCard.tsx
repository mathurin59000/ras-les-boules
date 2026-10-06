import { PlayerAvatar } from '@/components/PlayerAvatar'
import { ActionButton, AdvantageBadge, RoundPill, StatusPill } from './shared'
import { CARD_CLASS, matchSides, type MatchCardProps, type SideView } from './view'

function Side({ side }: { side: SideView }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <PlayerAvatar name={side.player.name} className="size-11" />
      <div className="flex flex-col">
        <span className="text-[13px] text-muted-foreground">{side.first}</span>
        <span className="font-bold">{side.last}</span>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{side.ratingLabel}</span>
      <AdvantageBadge adv={side.adv} />
    </div>
  )
}

export function DuelCard(props: MatchCardProps) {
  const [a, b] = matchSides(props)
  return (
    <div
      data-testid="match-card"
      onClick={props.onAction}
      className={`${CARD_CLASS} flex flex-col gap-3.5 p-4`}
    >
      <div className="flex items-center justify-between gap-2">
        <StatusPill kind={props.kind} />
        <RoundPill round={props.match.round} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
        <Side side={a} />
        <span className="pt-3.5 text-xs font-bold text-muted-foreground">VS</span>
        <Side side={b} />
      </div>
      <ActionButton kind={props.kind} onAction={props.onAction} />
    </div>
  )
}
