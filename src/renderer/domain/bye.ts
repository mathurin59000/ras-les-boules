import type { Match, MatchPlayer } from '@shared/types'

export const BYE_NAME = 'Exemption'

export const isBye = (m: Match) => !!m.bye

/** Real players of a match (an exemption has a single one). */
export const realPlayers = (m: Match): MatchPlayer[] => (m.bye ? [m.p1] : [m.p1, m.p2])

/** A finished match crediting `player` a forfeit win for `round`. */
export function createBye(player: MatchPlayer, round: number, id: string): Match {
  return {
    id,
    round,
    p1: player,
    p2: { name: BYE_NAME, rating: 0 },
    table: null,
    score: BYE_NAME,
    bye: true,
  }
}

/** " Exemption : X (tour 2)." for toasts; empty when there is none. */
export function byeSentence(byes: Match[]): string {
  if (!byes.length) return ''
  return ` Exemption (victoire forfaitaire) : ${byes.map((b) => `${b.p1.name} (tour ${b.round})`).join(', ')}.`
}
