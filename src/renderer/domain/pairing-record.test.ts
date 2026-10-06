import { describe, expect, it } from 'vitest'
import { meanGap, simulate } from './sim'

// Before pairing by record the mean gap was ~1.0 (8 players: 0.93, 12: 1.01, 16: 1.01, 32: 1.10)
describe('opponents have a close record', () => {
  for (const [players, rounds, max] of [
    [8, 4, 0.6],
    [12, 5, 0.6],
    [16, 5, 0.5],
    [32, 6, 0.4],
  ]) {
    it(`${players} players, ${rounds} rounds: mean win gap from round 3 ≤ ${max}`, () => {
      expect(meanGap(players, rounds)).toBeLessThanOrEqual(max)
    })
  }

  // Before: 6→2.00, 8→0, 10→3.92, 12→3.10, 16→0.61, 32→1.11 rematches per tournament
  for (const [players, rounds, max] of [
    [6, 3, 0.05],
    [8, 4, 0.05],
    [10, 5, 0.3],
    [12, 5, 0.6],
    [16, 5, 0.4],
    [32, 6, 0.8],
  ]) {
    it(`${players} players, ${rounds} rounds: ≤ ${max} rematch per tournament on average`, () => {
      let total = 0
      let runs = 0
      for (const mode of ['fifo', 'random'] as const) {
        for (let seed = 1; seed <= 50; seed++, runs++) {
          const seen = new Set<string>()
          for (const m of simulate(players, rounds, seed, mode).finished.filter((x) => !x.bye)) {
            const key = [m.p1.name, m.p2.name].sort().join('|')
            if (seen.has(key)) total++
            seen.add(key)
          }
        }
      }
      expect(total / runs).toBeLessThanOrEqual(max)
    })
  }

  it('never leaves a player stuck', () => {
    for (const [n, r] of [
      [6, 3],
      [9, 5],
      [16, 5],
      [33, 6],
    ]) {
      for (const mode of ['fifo', 'random'] as const) {
        for (let seed = 1; seed <= 20; seed++) expect(simulate(n, r, seed, mode).left).toBe(0)
      }
    }
  })
})
