import { describe, expect, it } from 'vitest'
import type { Match } from '@shared/types'
import { DEFAULT_SETTINGS } from './defaults'
import { isBye, realPlayers } from './bye'
import { advance, limitsFrom, type PairingState } from './pairing'
import { seedFirstRound } from './seeding'

function rng(seed: number) {
  return () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
}

function run(n: number, rounds: number, seed: number, mode: 'fifo' | 'random') {
  const r = rng(seed)
  const players = Array.from({ length: n }, (_, i) => ({ name: 'P' + i, rating: 2000 - i * 37 }))
  const limits = limitsFrom({
    ...DEFAULT_SETTINGS,
    endConditionType: 'rounds',
    endConditionValue: rounds,
  })
  const seeded = seedFirstRound(players, 'r1')
  let st: PairingState = {
    pending: seeded.matches,
    live: [],
    finished: seeded.byes,
    waitingBase: [],
  }
  for (let step = 0; step < 500 && (st.pending.length || st.live.length); step++) {
    const pickLive = st.live.length && (!st.pending.length || r() < 0.5)
    if (!pickLive) {
      const i = mode === 'fifo' ? 0 : Math.floor(r() * st.pending.length)
      const [m] = st.pending.splice(i, 1)
      st = { ...st, live: [...st.live, m] }
    } else {
      const i = mode === 'fifo' ? 0 : Math.floor(r() * st.live.length)
      const m = st.live[i]
      const live = st.live.filter((_, k) => k !== i)
      const done: Match = { ...m, score: r() < 0.5 ? '30-10' : '10-30' }
      const finished = [...st.finished, done]
      const adv = advance({ ...st, live, finished }, `s${step}`, limits)
      st = {
        ...st,
        live,
        finished: [...finished, ...adv.byes],
        pending: [...st.pending, ...adv.matches],
      }
    }
  }
  const played = new Map<string, number>()
  st.finished.forEach((m) =>
    realPlayers(m).forEach((x) => played.set(x.name, (played.get(x.name) ?? 0) + 1)),
  )
  return {
    rematches: rematches(st.finished),
    counts: players.map((p) => played.get(p.name) ?? 0),
    byes: st.finished.filter(isBye).map((b) => `${b.p1.name}@${b.round}`),
    left: st.pending.length + st.live.length,
  }
}

function rematches(finished: Match[]) {
  const seen = new Set<string>()
  let n = 0
  for (const m of finished.filter((x) => !isBye(x))) {
    const k = [m.p1.name, m.p2.name].sort().join('|')
    if (seen.has(k)) n++
    seen.add(k)
  }
  return n
}

describe('whole tournaments, matches finished in any order', () => {
  const cases = [
    { players: 9, rounds: 5, byes: 5, maxRematches: 4 }, // one exemption per round
    { players: 7, rounds: 3, byes: 3, maxRematches: 2 },
    { players: 8, rounds: 4, byes: 0, maxRematches: 0 },
    { players: 6, rounds: 5, byes: 0, maxRematches: 6 },
  ]
  for (const c of cases) {
    it(`${c.players} players, ${c.rounds} rounds: everybody plays every round`, () => {
      for (const mode of ['fifo', 'random'] as const) {
        for (let seed = 1; seed <= 100; seed++) {
          const res = run(c.players, c.rounds, seed, mode)
          const ctx = `${mode} seed ${seed}`
          expect(res.counts, ctx).toEqual(Array(c.players).fill(c.rounds))
          expect(res.byes.length, ctx).toBe(c.byes)
          expect(res.left, ctx).toBe(0)
          // a rematch is only a last resort for the final players, and stays rare
          expect(res.rematches, ctx).toBeLessThanOrEqual(c.maxRematches)
        }
      }
    })
  }
})
