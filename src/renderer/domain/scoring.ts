export type Side = 'p1' | 'p2'

/** The winner always scores `target`; the loser's points are clamped to 0..target-1. */
export function formatScore(winner: Side, target: number, loserPoints: number): string {
  const lp = Math.max(0, Math.min(target - 1, Number(loserPoints) || 0))
  return winner === 'p1' ? `${target}-${lp}` : `${lp}-${target}`
}
