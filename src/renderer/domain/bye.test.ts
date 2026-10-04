import { describe, expect, it } from 'vitest'
import type { Match, TournamentSettings } from '@shared/types'
import { isBye, realPlayers } from './bye'
import { DEFAULT_SETTINGS } from './defaults'
import { advance, autoPair, limitsFrom, type PairingState } from './pairing'
import { computeProgress } from './progress'
import { computeRanking } from './ranking'
import { seedFirstRound } from './seeding'

const p = (name: string, rating: number) => ({ name, rating })
const rules = (over: Partial<TournamentSettings>): TournamentSettings => ({
  ...DEFAULT_SETTINGS,
  ...over,
})

/** Plays a whole tournament: the first pending match is finished, p1 wins 30-10, repeat. */
function playAll(players: { name: string; rating: number }[], settings: TournamentSettings) {
  const limits = limitsFrom(settings)
  const seed = seedFirstRound(players, 'r1')
  let st: PairingState = { pending: seed.matches, live: [], finished: seed.byes, waitingBase: [] }
  for (let step = 0; st.pending.length && step < 100; step++) {
    const [m, ...rest] = st.pending
    const done: Match = { ...m, score: '30-10' }
    const next = advance(
      { ...st, pending: rest, finished: [...st.finished, done] },
      `s${step}`,
      limits,
    )
    st = {
      ...st,
      pending: [...rest, ...next.matches],
      finished: [...st.finished, done, ...next.byes],
    }
  }
  return st
}

describe('rounds end condition', () => {
  it('every player plays the same number of rounds, with exemptions for the odd one out', () => {
    const names = ['A', 'B', 'C', 'D', 'E']
    const st = playAll(
      names.map((n, i) => p(n, 5 - i)),
      rules({ endConditionType: 'rounds', endConditionValue: 2 }),
    )
    expect(st.pending).toEqual([])
    const played = new Map<string, number>()
    st.finished.forEach((m) =>
      realPlayers(m).forEach((x) => played.set(x.name, (played.get(x.name) ?? 0) + 1)),
    )
    expect(names.map((n) => played.get(n))).toEqual([2, 2, 2, 2, 2])
    const byes = st.finished.filter(isBye)
    expect(byes).toHaveLength(2)
    expect(new Set(byes.map((b) => b.p1.name)).size).toBe(2) // never the same player twice
    expect(byes.map((b) => b.round).sort()).toEqual([1, 2])
  })

  it('needs no exemption with an even number of players', () => {
    const st = playAll(
      ['A', 'B', 'C', 'D'].map((n, i) => p(n, 4 - i)),
      rules({ endConditionType: 'rounds', endConditionValue: 3 }),
    )
    expect(st.finished.filter(isBye)).toEqual([])
    expect(st.finished).toHaveLength(6) // 4 players x 3 rounds / 2
  })

  it('reads the number of rounds from the settings', () => {
    expect(limitsFrom(rules({ endConditionType: 'rounds', endConditionValue: 4 }))).toEqual({
      maxMatchesPerPlayer: 4,
    })
  })
})

describe('exemptions', () => {
  it('never hand out two exemptions for the same round, even when the end is manual', () => {
    const st = playAll(
      ['A', 'B', 'C'].map((n, i) => p(n, 3 - i)),
      rules({ endConditionType: 'manual' }),
    )
    const rounds = st.finished.filter(isBye).map((b) => b.round)
    expect(new Set(rounds).size).toBe(rounds.length)
  })

  it('count as played for the quota but not for the total-matches cap', () => {
    const [bye] = seedFirstRound(
      ['A', 'B', 'C', 'D', 'E'].map((n, i) => p(n, 5 - i)),
      'x',
    ).byes
    const st: PairingState = {
      pending: [],
      live: [],
      finished: [
        bye,
        { ...match2('m1', 1, 'A', 'C'), score: '30-1' },
        { ...match2('m2', 1, 'B', 'D'), score: '30-1' },
      ],
      waitingBase: [],
    }
    // 2 real matches played: the exemption is not one of them
    expect(autoPair(st, 'n', { maxTotalMatches: 2 })).toHaveLength(0)
    expect(autoPair(st, 'n', { maxTotalMatches: 3 })).toHaveLength(1)
    // but it does count towards the per-player quota: E has played once
    expect(autoPair(st, 'n', { maxMatchesPerPlayer: 1 })).toHaveLength(0)
  })

  it('give a win and 3 points without changing the point difference', () => {
    const [bye] = seedFirstRound([p('A', 3), p('B', 2), p('C', 1)], 'x').byes
    expect(computeRanking([bye])).toEqual([{ name: 'C', wins: 1, losses: 0, diff: 0, points: 3 }])
  })

  it('weigh half a match in the progress and are not counted as a player', () => {
    const st = playAll(
      ['A', 'B', 'C'].map((n, i) => p(n, 3 - i)),
      rules({ endConditionType: 'rounds', endConditionValue: 2 }),
    )
    const progress = computeProgress(
      'in_progress',
      rules({ endConditionType: 'rounds', endConditionValue: 2 }),
      { ...st, pending: [], live: [] },
    )
    expect(progress.pct).toBe(100)
    expect(progress.label).toMatch(/^\d+\/\d+ matchs joués/)
  })
})

function match2(id: string, round: number, a: string, b: string): Match {
  return { id, round, p1: p(a, 1000), p2: p(b, 1000), table: 1 }
}

describe('progress counter', () => {
  const settings = rules({ endConditionType: 'rounds', endConditionValue: 5 })
  const label = (st: PairingState) => computeProgress('in_progress', settings, st).label

  it('shows whole matches only, with the exact expected total (9 players, 5 rounds = 20 matches)', () => {
    const names = Array.from({ length: 9 }, (_, i) => p('P' + i, 2000 - i))
    const seed = seedFirstRound(names, 'r1')
    // one exemption played, nothing else: 0 matches, no decimals
    const st: PairingState = {
      pending: seed.matches,
      live: [],
      finished: seed.byes,
      waitingBase: [],
    }
    expect(label(st)).toBe('0/20 matchs joués · 1 exemption')
    const one = { ...st, finished: [...st.finished, { ...seed.matches[0], score: '30-1' }] }
    expect(label({ ...one, pending: seed.matches.slice(1) })).toBe(
      '1/20 matchs joués · 1 exemption',
    )
  })

  it('reaches exactly 100 % once every match and exemption is played', () => {
    const st = playAll(
      Array.from({ length: 9 }, (_, i) => p('P' + i, 2000 - i)),
      settings,
    )
    const progress = computeProgress('in_progress', settings, { ...st, pending: [], live: [] })
    expect(progress.pct).toBe(100)
    expect(progress.label).toBe('20/20 matchs joués · 5 exemptions')
  })
})
