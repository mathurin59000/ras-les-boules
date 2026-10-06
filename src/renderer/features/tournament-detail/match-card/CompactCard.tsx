import { RoundPill, StatusPill } from './shared'
import { CARD_CLASS, matchSides, type MatchCardProps, type SideView } from './view'

function Row({ side }: { side: SideView }) {
  return (
    <div className="flex items-baseline justify-between gap-2.5">
      <span className="flex min-w-0 items-baseline gap-1.5 text-[13px]">
        <span>
          {side.first} <strong className="font-bold">{side.last}</strong>
        </span>
        {side.adv > 0 && (
          <span
            title="Points d'avance attribués par le handicap"
            className="text-xs font-bold text-success-700 tabular-nums"
          >
            (+{side.adv})
          </span>
        )}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">{side.ratingLabel}</span>
    </div>
  )
}

/** No action button: the whole card is clickable. */
export function CompactCard(props: MatchCardProps) {
  const [a, b] = matchSides(props)
  return (
    <div
      data-testid="match-card"
      onClick={props.onAction}
      className={`${CARD_CLASS} overflow-hidden`}
    >
      <div className="flex flex-col gap-2 px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <StatusPill kind={props.kind} />
          <RoundPill round={props.match.round} />
        </div>
        <Row side={a} />
        <Row side={b} />
      </div>
    </div>
  )
}
