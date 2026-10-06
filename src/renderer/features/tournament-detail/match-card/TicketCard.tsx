import { ActionButton, AdvantageBadge, StatusPill } from './shared'
import { CARD_CLASS, matchSides, type MatchCardProps, type SideView } from './view'

function Half({ side }: { side: SideView }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-3.5">
      <span className="text-[13px] text-muted-foreground">{side.first}</span>
      <span className="-mt-1 font-bold">{side.last}</span>
      <span className="text-lg font-semibold tabular-nums">
        {side.player.rating} <span className="text-xs font-medium text-muted-foreground">pts</span>
      </span>
      <AdvantageBadge adv={side.adv} long />
    </div>
  )
}

export function TicketCard(props: MatchCardProps) {
  const [a, b] = matchSides(props)
  return (
    <div
      data-testid="match-card"
      onClick={props.onAction}
      className={`${CARD_CLASS} flex flex-col overflow-hidden`}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: 'color-mix(in srgb, var(--primary-400) 12%, var(--card))' }}
      >
        <span className="flex items-center gap-2.5">
          <StatusPill kind={props.kind} />
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
            TOUR {props.match.round}
          </span>
        </span>
        <span className="text-xs font-bold text-muted-foreground">VS</span>
      </div>
      <div className="flex">
        <Half side={a} />
        <div className="my-3 border-l border-dashed border-input" />
        <Half side={b} />
      </div>
      <div className="px-4 pb-3.5">
        <ActionButton kind={props.kind} onAction={props.onAction} />
      </div>
    </div>
  )
}
