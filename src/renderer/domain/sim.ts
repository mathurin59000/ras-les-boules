import type { Match } from '@shared/types'
import { DEFAULT_SETTINGS } from './defaults'
import { advance, limitsFrom, type PairingState } from './pairing'
import { seedFirstRound } from './seeding'

export const rng = (seed: number) => () =>
  (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296

/**
 * Plays a whole tournament with matches finishing in any order (fifo / random). The stronger rating wins 75% of the
 * time. Returns, for every real match, the difference in wins between its players at the time they were paired.
 */
export function simulate(n: number, rounds: number, seed: number, mode: 'fifo' | 'random') {
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
  const wins = new Map<string, number>(seeded.byes.map((b) => [b.p1.name, 1]))
  const gaps: { round: number; gap: number }[] = []

  for (let step = 0; step < 2000 && (st.pending.length || st.live.length); step++) {
    const pickLive = st.live.length && (!st.pending.length || r() < 0.5)
    if (!pickLive) {
      const i = mode === 'fifo' ? 0 : Math.floor(r() * st.pending.length)
      const [m] = st.pending.splice(i, 1)
      st = { ...st, live: [...st.live, m] }
      continue
    }
    const i = mode === 'fifo' ? 0 : Math.floor(r() * st.live.length)
    const m = st.live[i]
    const live = st.live.filter((_, k) => k !== i)
    const strongerIsP1 = m.p1.rating >= m.p2.rating
    const p1Wins = r() < 0.75 ? strongerIsP1 : !strongerIsP1
    const done: Match = { ...m, score: p1Wins ? '30-10' : '10-30' }
    gaps.push({
      round: m.round,
      gap: Math.abs((wins.get(m.p1.name) ?? 0) - (wins.get(m.p2.name) ?? 0)),
    })
    const winner = p1Wins ? m.p1.name : m.p2.name
    wins.set(winner, (wins.get(winner) ?? 0) + 1)
    const finished = [...st.finished, done]
    const adv = advance({ ...st, live, finished }, `s${step}`, limits)
    for (const b of adv.byes) wins.set(b.p1.name, (wins.get(b.p1.name) ?? 0) + 1)
    st = {
      ...st,
      live,
      finished: [...finished, ...adv.byes],
      pending: [...st.pending, ...adv.matches],
    }
  }
  return { gaps, left: st.pending.length + st.live.length, finished: st.finished }
}

/** Mean win gap between opponents from `fromRound` on, over many seeds. */
export function meanGap(n: number, rounds: number, fromRound = 3, seeds = 40) {
  let sum = 0
  let count = 0
  for (const mode of ['fifo', 'random'] as const) {
    for (let seed = 1; seed <= seeds; seed++) {
      for (const g of simulate(n, rounds, seed, mode).gaps) {
        if (g.round >= fromRound) {
          sum += g.gap
          count++
        }
      }
    }
  }
  return sum / count
}
