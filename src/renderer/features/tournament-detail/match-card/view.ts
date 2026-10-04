import type { Match, MatchPlayer, TournamentSettings } from '@shared/types'
import { advantage } from '@/domain/handicap'
import { splitName } from '@/domain/format'

export interface MatchCardProps {
  match: Match
  kind: 'pending' | 'live'
  settings: TournamentSettings
  onAction: () => void
}

export interface SideView {
  player: MatchPlayer
  first: string
  last: string
  ratingLabel: string
  adv: number
}

/** Names, formatted rating and handicap advance for both players of a match. */
export function matchSides({
  match,
  settings,
}: Pick<MatchCardProps, 'match' | 'settings'>): [SideView, SideView] {
  const view = (player: MatchPlayer, other: MatchPlayer): SideView => ({
    player,
    ...splitName(player.name),
    ratingLabel: `${player.rating.toLocaleString('fr-FR')} pts`,
    adv: advantage(player.rating, other.rating, settings),
  })
  return [view(match.p1, match.p2), view(match.p2, match.p1)]
}

export const CARD_CLASS =
  'bg-card cursor-pointer rounded-lg border shadow-sm transition-shadow hover:shadow-md'
