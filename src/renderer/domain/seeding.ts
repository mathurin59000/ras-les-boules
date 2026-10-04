import type { Match, MatchPlayer } from '@shared/types'
import { createBye } from './bye'

/**
 * Round 1: sort by rating, top half plays bottom half.
 * With an odd number of players the lowest rated one gets an exemption.
 */
export function seedFirstRound(
  pool: MatchPlayer[],
  idPrefix: string,
): { matches: Match[]; byes: Match[] } {
  const sorted = [...pool].sort((a, b) => b.rating - a.rating)
  const half = Math.floor(sorted.length / 2)
  const matches: Match[] = []
  for (let i = 0; i < half; i++) {
    matches.push({
      id: `${idPrefix}-${i}`,
      round: 1,
      p1: sorted[i],
      p2: sorted[i + half],
      table: i + 1,
    })
  }
  const byes = sorted.length % 2 ? [createBye(sorted[sorted.length - 1], 1, `${idPrefix}-bye`)] : []
  return { matches, byes }
}
