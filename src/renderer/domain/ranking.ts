import type { Match } from '@shared/types'

export interface RankingRow {
  name: string
  wins: number
  losses: number
  diff: number
  points: number
}

export const POINTS_PER_WIN = 3

/**
 * Standings from finished matches: wins, then point difference. Scores look like "30-12".
 * An exemption is a win for its player with no point difference.
 */
export function computeRanking(finished: Match[]): RankingRow[] {
  const rows = new Map<string, RankingRow>()
  const row = (name: string) => {
    if (!rows.has(name)) rows.set(name, { name, wins: 0, losses: 0, diff: 0, points: 0 })
    return rows.get(name)!
  }
  for (const m of finished) {
    if (m.bye) {
      const p = row(m.p1.name)
      p.wins++
      p.points += POINTS_PER_WIN
      continue
    }
    const [s1, s2] = (m.score ?? '').split('-').map(Number)
    const a = row(m.p1.name)
    const b = row(m.p2.name)
    if (!Number.isFinite(s1) || !Number.isFinite(s2)) continue
    const [winner, loser] = s1 > s2 ? [a, b] : [b, a]
    winner.wins++
    winner.points += POINTS_PER_WIN
    loser.losses++
    a.diff += s1 - s2
    b.diff += s2 - s1
  }
  return [...rows.values()].sort(
    (x, y) => y.wins - x.wins || y.diff - x.diff || x.name.localeCompare(y.name),
  )
}
