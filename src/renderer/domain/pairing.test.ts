import { describe, expect, it } from 'vitest'
import { autoPair, computeWaiting, limitsFor } from './pairing'
import { DEFAULT_SETTINGS } from './defaults'
import { seedFirstRound } from './seeding'
import { computeRanking } from './ranking'
import { formatScore } from './scoring'
import { advantage } from './handicap'
import type { Match } from '@shared/types'

const p = (name: string, rating: number) => ({ name, rating })
const match = (id: string, round: number, a: string, b: string, table = 1): Match => ({
  id,
  round,
  p1: p(a, 1000),
  p2: p(b, 1000),
  table,
})

describe('seedFirstRound', () => {
  it('pairs top half with bottom half and gives the odd player an exemption', () => {
    const { matches, byes } = seedFirstRound(
      [p('A', 5), p('B', 4), p('C', 3), p('D', 2), p('E', 1)],
      'r1',
    )
    expect(matches.map((m) => [m.p1.name, m.p2.name, m.table])).toEqual([
      ['A', 'C', 1],
      ['B', 'D', 2],
    ])
    expect(byes.map((b) => [b.p1.name, b.round, b.bye])).toEqual([['E', 1, true]])
  })
  it('has no exemption for an even number of players', () => {
    expect(seedFirstRound([p('A', 2), p('B', 1)], 'r1').byes).toEqual([])
  })
})

describe('autoPair', () => {
  it('pairs free players of the same round, skipping rematches and busy tables', () => {
    const st = {
      pending: [match('x', 2, 'Z', 'Y', 1)],
      live: [],
      finished: [match('f', 1, 'A', 'B')],
      waitingBase: [{ name: 'C', rating: 900, nextRound: 2 }],
    }
    expect(
      computeWaiting(st)
        .map((w) => w.name)
        .sort(),
    ).toEqual(['A', 'B', 'C'])
    const created = autoPair(st, 'auto')
    // A and B already met → A takes C, B stays waiting
    expect(created).toHaveLength(1)
    expect([created[0].p1.name, created[0].p2.name]).toEqual(['A', 'C'])
    expect(created[0].table).toBe(2)
  })
})

describe('autoPair by record', () => {
  const done = (id: string, round: number, w: string, l: string): Match => ({
    ...match(id, round, w, l),
    score: '30-10',
  })
  // round 1: A beat B, C beat D (C and D still busy in another match of round 1 for the held-back cases)
  const base = (live: Match[]) => ({
    pending: [],
    live,
    finished: [done('f1', 1, 'A', 'B')],
    waitingBase: [],
  })

  it('keeps a winner waiting while another winner could still come', () => {
    // C–D is being played: A (1 win) must not take B (0 win) while C may become a second 1-win player
    const st = base([match('l', 1, 'C', 'D', 1)])
    expect(autoPair(st, 'x')).toEqual([])
  })
  it('pairs the closest records once nobody else can arrive', () => {
    const st = {
      ...base([]),
      finished: [done('f1', 1, 'A', 'B'), done('f2', 1, 'C', 'D')],
    }
    const [m] = autoPair(st, 'x').filter((x) => x.round === 2)
    const names = autoPair(st, 'x').map((x) => [x.p1.name, x.p2.name].sort().join('-'))
    expect(m).toBeDefined()
    expect(names.sort()).toEqual(['A-C', 'B-D']) // winners together, losers together
  })
  it('plays at once when the records are equal', () => {
    const st = {
      ...base([match('l', 1, 'C', 'D', 1)]),
      finished: [done('f1', 1, 'A', 'B'), done('f2', 1, 'E', 'F')],
    }
    const names = autoPair(st, 'x').map((x) => [x.p1.name, x.p2.name].sort().join('-'))
    expect(names).toContain('A-E')
  })
})

describe('formatScore / advantage', () => {
  it('clamps the loser points', () => {
    expect(formatScore('p1', 30, 12)).toBe('30-12')
    expect(formatScore('p2', 30, 99)).toBe('29-30')
    expect(formatScore('p1', 30, -4)).toBe('30-0')
  })
  it('caps handicap and ignores the favourite', () => {
    const rules = {
      handicapEnabled: true,
      handicapBracket: 100,
      handicapPerBracket: 2,
      handicapCap: 10,
    }
    expect(advantage(1000, 1350, rules)).toBe(6)
    expect(advantage(1000, 2500, rules)).toBe(10)
    expect(advantage(1500, 1000, rules)).toBe(0)
    expect(advantage(1000, 1350, { ...rules, handicapEnabled: false })).toBe(0)
  })
})

describe('computeRanking', () => {
  it('ranks by wins then point difference', () => {
    const f = (id: string, a: string, b: string, score: string): Match => ({
      ...match(id, 1, a, b),
      score,
    })
    // A beats B 30-10, C beats A 30-29, B beats C 30-0
    const rows = computeRanking([
      f('1', 'A', 'B', '30-10'),
      f('2', 'C', 'A', '30-29'),
      f('3', 'B', 'C', '30-0'),
    ])
    expect(rows.map((r) => [r.name, r.wins, r.losses, r.diff, r.points])).toEqual([
      ['A', 1, 1, 19, 3],
      ['B', 1, 1, 10, 3],
      ['C', 1, 1, -29, 3],
    ])
  })
})

describe('end condition limits', () => {
  const base = {
    pending: [],
    live: [],
    finished: [match('f1', 1, 'A', 'B'), match('f2', 1, 'C', 'D')],
    waitingBase: [],
  }
  it('stops pairing players who reached their match quota', () => {
    expect(autoPair(base, 'x', { maxMatchesPerPlayer: 1 })).toEqual([])
    expect(computeWaiting(base, { maxMatchesPerPlayer: 1 })).toEqual([])
    expect(autoPair(base, 'x', { maxMatchesPerPlayer: 2 })).toHaveLength(2)
  })
  it('counts booked (pending/live) matches towards the quota', () => {
    const st = {
      ...base,
      finished: [match('f1', 1, 'A', 'B')],
      pending: [match('p1', 2, 'A', 'C')],
    }
    expect(computeWaiting(st, { maxMatchesPerPlayer: 1 }).map((p) => p.name)).toEqual([])
  })
  it('caps the total number of matches', () => {
    expect(autoPair(base, 'x', { maxTotalMatches: 3 })).toHaveLength(1)
    expect(autoPair(base, 'x', { maxTotalMatches: 2 })).toHaveLength(0)
  })
})

describe('players who left the loop', () => {
  const roster = [
    { id: '1', name: 'A', points: 1000, status: 'active' },
    { id: '2', name: 'B', points: 1000, status: 'active', inactive: true },
    { id: '3', name: 'C', points: 1000, status: 'forfeit' },
    { id: '4', name: 'D', points: 1000, status: 'active' },
    { id: '5', name: 'E', points: 1000, status: 'active' },
  ]
  // F is not on the roster any more (removed)
  const limits = limitsFor(DEFAULT_SETTINGS, roster)
  const st = (live: Match[] = []) => ({
    pending: [],
    live,
    finished: [],
    waitingBase: ['A', 'B', 'C', 'D', 'E', 'F'].map((name) => ({
      name,
      rating: 1000,
      nextRound: 2,
    })),
  })

  it('keeps inactive, forfeit and removed players out of waiting', () => {
    expect(
      computeWaiting(st(), limits)
        .map((w) => w.name)
        .sort(),
    ).toEqual(['A', 'D', 'E'])
  })
  it('never books them in a new match', () => {
    const names = autoPair(st(), 'x', limits).flatMap((m) => [m.p1.name, m.p2.name])
    expect(names.every((n) => ['A', 'D', 'E'].includes(n))).toBe(true)
  })
  it('lets them finish a live match without re-entering the loop', () => {
    // B plays C now; once finished neither is waiting nor paired
    const done: Match = { ...match('f', 1, 'B', 'C'), score: '30-10' }
    const after = { ...st(), finished: [done] }
    expect(computeWaiting(after, limits).map((w) => w.name)).not.toContain('B')
    expect(computeWaiting(after, limits).map((w) => w.name)).not.toContain('C')
  })
})
