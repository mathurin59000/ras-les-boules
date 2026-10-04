import { useAppStore } from '@/stores/app-store'
import { CompactCard } from './CompactCard'
import { DuelCard } from './DuelCard'
import { LinesCard } from './LinesCard'
import type { MatchCardProps } from './view'
import { TicketCard } from './TicketCard'
import type { MatchCardVariant } from './variants'

const CARDS: Record<MatchCardVariant, (props: MatchCardProps) => React.JSX.Element> = {
  duel: DuelCard,
  lignes: LinesCard,
  compacte: CompactCard,
  ticket: TicketCard,
}

/** Renders the match card in the variant chosen in the settings. */
export function MatchCard(props: MatchCardProps) {
  const Card = CARDS[useAppStore((s) => s.matchCard)]
  return <Card {...props} />
}
