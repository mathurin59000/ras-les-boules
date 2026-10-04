import type { Match, Matches, TournamentSettings, WaitingBase } from '@shared/types'
import { createBye, isBye, realPlayers } from './bye'
import { computeRanking } from './ranking'

export interface PairingState extends Matches {
  waitingBase: WaitingBase[]
}

/** Caps coming from the tournament's end condition. */
export interface PairingLimits {
  maxMatchesPerPlayer?: number
  maxTotalMatches?: number
}

const positive = (n: number) => (Number.isFinite(n) && n > 0 ? n : undefined)

/**
 * What pairing can enforce. A player's round is his own match count (an exemption is a round too), so "number of
 * rounds" caps the matches per player like "matches per player" does. "Manual" has no cap.
 */
export function limitsFrom(settings: TournamentSettings): PairingLimits {
  const v = positive(settings.endConditionValue)
  if (
    settings.endConditionType === 'matches_per_player' ||
    settings.endConditionType === 'rounds'
  ) {
    return { maxMatchesPerPlayer: v }
  }
  if (settings.endConditionType === 'total_matches') return { maxTotalMatches: v }
  return {}
}

/** True when the end condition caps the tournament (anything but a manual end). */
export const hasLimit = (limits: PairingLimits) => Object.values(limits).some(Boolean)

const pairKey = (a: string, b: string) => [a, b].sort().join('|')

/** Matches played or booked per player; an exemption counts as a match. */
function countMatches(st: PairingState): Map<string, number> {
  const count = new Map<string, number>()
  for (const m of [...st.pending, ...st.live, ...st.finished]) {
    for (const p of realPlayers(m)) count.set(p.name, (count.get(p.name) ?? 0) + 1)
  }
  return count
}

/** Round each known player is waiting for, before any skipping (from the seed and finished matches). */
function rawNextRounds(st: PairingState): Map<string, WaitingBase> {
  const map = new Map<string, WaitingBase>()
  st.waitingBase.forEach((p) => map.set(p.name, { ...p }))
  st.finished.forEach((m) =>
    realPlayers(m).forEach((pl) => {
      const prev = map.get(pl.name)
      if (!prev || prev.nextRound < m.round + 1) {
        map.set(pl.name, { name: pl.name, rating: pl.rating, nextRound: m.round + 1 })
      }
    }),
  )
  return map
}

interface PlayerState {
  name: string
  rating: number
  /** Round the player plays next: his last finished round + 1, or his current match round + 1. */
  level: number
  busy: boolean
  capped: boolean
}

/** Every known player with the round he is at; a capped player has reached the end condition. */
function playerStates(st: PairingState, limits: PairingLimits): PlayerState[] {
  const states = new Map<string, PlayerState>()
  rawNextRounds(st).forEach((p, name) => {
    states.set(name, { name, rating: p.rating, level: p.nextRound, busy: false, capped: false })
  })
  for (const m of [...st.pending, ...st.live]) {
    for (const p of realPlayers(m)) {
      states.set(p.name, {
        name: p.name,
        rating: p.rating,
        level: m.round + 1,
        busy: true,
        capped: false,
      })
    }
  }
  const count = countMatches(st)
  const max = limits.maxMatchesPerPlayer
  states.forEach((p) => {
    p.capped = !!max && (count.get(p.name) ?? 0) >= max
  })
  return [...states.values()]
}

/** Players free to play, each with the round they are waiting for (nobody skips a round). */
export function computeWaiting(st: PairingState, limits: PairingLimits = {}): WaitingBase[] {
  return playerStates(st, limits)
    .filter((p) => !p.busy && !p.capped)
    .map((p) => ({ name: p.name, rating: p.rating, nextRound: p.level }))
    .sort((a, b) => a.nextRound - b.nextRound || b.rating - a.rating)
}

/**
 * Exemptions to grant now. Free players are grouped by the round they wait for (without skipping). A group is
 * final when nobody else can still reach that round; if it is odd, its lowest ranked player without a previous
 * exemption gets a forfeit win. Needs some other activity in that round, otherwise a manual-end tournament
 * would hand out exemptions forever.
 */
export function awardByes(st: PairingState, limits: PairingLimits, idPrefix: string): Match[] {
  const states = playerStates(st, limits).filter((p) => !p.capped)
  const free = states.filter((p) => !p.busy)
  const hadBye = new Set(st.finished.filter(isBye).map((m) => m.p1.name))
  const ranking = computeRanking(st.finished)
  const strength = (p: PlayerState) => {
    const r = ranking.find((x) => x.name === p.name)
    return [r?.wins ?? 0, r?.diff ?? 0, p.rating] as const
  }
  const hasActivity = (round: number) =>
    [...st.pending, ...st.live, ...st.finished].some((m) => m.round === round)

  const byes: Match[] = []
  const rounds = [...new Set(free.map((p) => p.level))].sort((a, b) => a - b)
  for (const r of rounds) {
    const group = free.filter((p) => p.level === r)
    if (group.length % 2 === 0 || !isFinal(states, group, r) || !hasActivity(r)) continue
    const pool = group.filter((p) => !hadBye.has(p.name))
    const [lowest] = [...(pool.length ? pool : group)].sort((a, b) => {
      const [aw, ad, ar] = strength(a)
      const [bw, bd, br] = strength(b)
      return aw - bw || ad - bd || ar - br
    })
    byes.push(
      createBye({ name: lowest.name, rating: lowest.rating }, r, `${idPrefix}-${byes.length}`),
    )
  }
  return byes
}

/** Nobody outside `group` can still reach round `r`, so the group will never grow. */
function isFinal(states: PlayerState[], group: { name: string }[], r: number): boolean {
  return !states.some((p) => p.level <= r && !group.some((g) => g.name === p.name))
}

type Pair = [WaitingBase, WaitingBase]

/** Greedy by rating: each player meets the best rated opponent he has not played yet. */
function greedyPairs(list: WaitingBase[], blocked: (a: string, b: string) => boolean): Pair[] {
  const rest = [...list]
  const pairs: Pair[] = []
  while (rest.length >= 2) {
    const a = rest.shift()!
    const idx = rest.findIndex((b) => !blocked(a.name, b.name))
    if (idx < 0) continue
    pairs.push([a, rest.splice(idx, 1)[0]])
  }
  return pairs
}

/** Pairs everybody without a rematch, if such a pairing exists (small final groups only). */
function perfectPairs(
  list: WaitingBase[],
  blocked: (a: string, b: string) => boolean,
): Pair[] | null {
  if (list.length % 2) return null
  let budget = 20000
  const solve = (rest: WaitingBase[]): Pair[] | null => {
    if (!rest.length) return []
    if (budget-- <= 0) return null
    const [a, ...others] = rest
    for (let i = 0; i < others.length; i++) {
      if (blocked(a.name, others[i].name)) continue
      const sub = solve(others.filter((_, k) => k !== i))
      if (sub) return [[a, others[i]], ...sub]
    }
    return null
  }
  return solve(list)
}

/**
 * New pending matches, per round, on the lowest free table. Players avoid rematches, except in a final group
 * (nobody else can join it) where a rematch beats leaving two players stuck for ever.
 */
export function autoPair(st: PairingState, idPrefix: string, limits: PairingLimits = {}): Match[] {
  const booked = [...st.pending, ...st.live, ...st.finished].filter((m) => !isBye(m)).length
  const played = new Set(
    st.finished.filter((m) => !isBye(m)).map((m) => pairKey(m.p1.name, m.p2.name)),
  )
  const usedTables = new Set([...st.pending, ...st.live].map((m) => m.table))
  const nextTable = () => {
    let t = 1
    while (usedTables.has(t)) t++
    usedTables.add(t)
    return t
  }
  const states = playerStates(st, limits).filter((p) => !p.capped)
  const byRound = new Map<number, WaitingBase[]>()
  computeWaiting(st, limits).forEach((p) =>
    byRound.set(p.nextRound, [...(byRound.get(p.nextRound) ?? []), p]),
  )
  const hasPlayed = (a: string, b: string) => played.has(pairKey(a, b))

  const created: Match[] = []
  byRound.forEach((list, round) => {
    const final = isFinal(states, list, round)
    let pairs = final ? perfectPairs(list, hasPlayed) : null
    if (!pairs) pairs = greedyPairs(list, hasPlayed)
    if (final && pairs.length * 2 < list.length - (list.length % 2)) {
      pairs = greedyPairs(list, () => false) // rematch as a last resort
    }
    for (const [a, b] of pairs) {
      if (limits.maxTotalMatches && booked + created.length >= limits.maxTotalMatches) return
      created.push({
        id: `${idPrefix}-${created.length}`,
        round,
        p1: { name: a.name, rating: a.rating },
        p2: { name: b.name, rating: b.rating },
        table: nextTable(),
      })
    }
  })
  return created
}

/**
 * Everything that follows a result: exemptions first, then new matches, repeated because an exemption moves a
 * player on to the next round and can unlock more pairings.
 */
export function advance(
  st: PairingState,
  idPrefix: string,
  limits: PairingLimits = {},
): { matches: Match[]; byes: Match[] } {
  let cur = st
  const matches: Match[] = []
  const byes: Match[] = []
  for (let i = 0; i < 20; i++) {
    const b = awardByes(cur, limits, `${idPrefix}-b${i}`)
    cur = { ...cur, finished: [...cur.finished, ...b] }
    const m = autoPair(cur, `${idPrefix}-m${i}`, limits)
    cur = { ...cur, pending: [...cur.pending, ...m] }
    byes.push(...b)
    matches.push(...m)
    if (!b.length && !m.length) break
  }
  return { matches, byes }
}
