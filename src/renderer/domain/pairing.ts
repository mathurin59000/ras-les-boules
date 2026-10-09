import type { Match, Matches, Player, TournamentSettings, WaitingBase } from '@shared/types'
import { createBye, isBye, realPlayers } from './bye'
import { computeRanking } from './ranking'

export interface PairingState extends Matches {
  waitingBase: WaitingBase[]
}

/** Caps coming from the tournament's end condition. */
export interface PairingLimits {
  maxMatchesPerPlayer?: number
  maxTotalMatches?: number
  /** Players who must not be given a new match (inactive, forfeit or removed): they finish what they play. */
  isOut?: (name: string) => boolean
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

/** Limits plus the roster rule: inactive, forfeit and removed players leave the pairing loop. */
export function limitsFor(settings: TournamentSettings, roster?: Player[]): PairingLimits {
  if (!roster?.length) return limitsFrom(settings) // no roster known: nobody can be told out
  const byName = new Map(roster.map((p) => [p.name, p]))
  return {
    ...limitsFrom(settings),
    isOut: (name) => {
      const p = byName.get(name)
      return !p || !!p.inactive || p.status === 'forfeit'
    },
  }
}

/** True when the end condition caps the tournament (anything but a manual end). */
export const hasLimit = (limits: PairingLimits) => Object.values(limits).some(Boolean)

const pairKey = (a: string, b: string) => [a, b].sort().join('|')

/** Pairs of players who met, or are booked to meet, in a real match. */
function playedPairs(st: PairingState): (a: string, b: string) => boolean {
  const played = new Set(
    [...st.pending, ...st.live, ...st.finished]
      .filter((m) => !isBye(m))
      .map((m) => pairKey(m.p1.name, m.p2.name)),
  )
  return (a, b) => played.has(pairKey(a, b))
}

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
    p.capped = (!!max && (count.get(p.name) ?? 0) >= max) || !!limits.isOut?.(p.name)
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
  const hasPlayed = playedPairs(st)
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
    const weakestFirst = [...(pool.length ? pool : group)].sort((a, b) => {
      const [aw, ad, ar] = strength(a)
      const [bw, bd, br] = strength(b)
      return aw - bw || ad - bd || ar - br
    })
    // the weakest player sits out, unless that leaves the others only rematches
    const lowest =
      weakestFirst.find((p) =>
        canAvoidRematches(
          group.filter((g) => g.name !== p.name).map((g) => g.name),
          hasPlayed,
        ),
      ) ?? weakestFirst[0]
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

/** Win record of a player, used to match players of the same level. */
type Record = (name: string) => { wins: number; diff: number }

/** A player about to reach the group's round: he is in a match of the previous round, so he ends with w or w+1 wins. */
interface Incoming {
  name: string
  wins: number
}

/** Win gap two players would have; 0 when equal. */
const gapOf = (rec: Record, a: string, b: string) => Math.abs(rec(a).wins - rec(b).wins)

/** Best record first: wins, then point difference, then initial rating. */
function byRecord(list: WaitingBase[], rec: Record): WaitingBase[] {
  return [...list].sort(
    (a, b) =>
      rec(b.name).wins - rec(a.name).wins ||
      rec(b.name).diff - rec(a.name).diff ||
      b.rating - a.rating,
  )
}

/**
 * Greedy by record: each player meets the unplayed opponent with the closest number of wins. A pair with a gap is
 * held back while a player about to arrive could give either of them a closer opponent (a free player is better
 * off waiting a little than meeting someone of a very different level).
 */
function pairByRecord(
  list: WaitingBase[],
  rec: Record,
  blocked: (a: string, b: string) => boolean,
  incoming: Incoming[] = [],
  /** Everybody who still has to be paired for this round (free, in a match of the previous round, or lagging). */
  pool?: string[],
): Pair[] {
  const rest = byRecord(list, rec)
  const left = new Set(pool)
  const pairs: Pair[] = []
  const couldBeCloser = (name: string, gap: number) =>
    incoming.some((x) => {
      if (blocked(name, x.name)) return false
      const w = rec(name).wins
      return Math.min(Math.abs(x.wins - w), Math.abs(x.wins + 1 - w)) < gap
    })
  while (rest.length >= 2) {
    const a = rest.shift()!
    // opponents never met, closest record first (then closest rank)
    const options = rest
      .map((b, i) => ({ b, i, gap: gapOf(rec, a.name, b.name) }))
      .filter((o) => !blocked(a.name, o.b.name))
      .sort((x, y) => x.gap - y.gap || x.i - y.i)
    if (!options.length) continue
    const { gap } = options[0]
    if (gap > 0 && (couldBeCloser(a.name, gap) || couldBeCloser(options[0].b.name, gap))) continue
    // a pair must not leave the rest of the round unable to avoid rematches
    const pick = pool
      ? options.find((o) =>
          canAvoidRematches(
            [...left].filter((n) => n !== a.name && n !== o.b.name),
            blocked,
          ),
        )
      : options[0]
    if (!pick) continue
    pairs.push([a, rest.splice(pick.i, 1)[0]])
    left.delete(a.name)
    left.delete(pick.b.name)
  }
  return pairs
}

/**
 * True if `names` can all be paired without a rematch (one may stay out when the number is odd: he gets an
 * exemption). Budgeted search; when the budget runs out it assumes yes rather than blocking the pairing.
 */
function canAvoidRematches(names: string[], blocked: (a: string, b: string) => boolean): boolean {
  let budget = 60000
  const solve = (rest: string[], skips: number): boolean => {
    if (rest.length <= 1) return true
    if (budget-- <= 0) return true
    const [a, ...others] = rest
    for (let i = 0; i < others.length; i++) {
      if (
        !blocked(a, others[i]) &&
        solve(
          others.filter((_, k) => k !== i),
          skips,
        )
      )
        return true
    }
    return skips > 0 && solve(others, skips - 1)
  }
  return solve(names, names.length % 2)
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
  // matches being played or booked count too: their players will have met before the next round
  const hasPlayed = playedPairs(st)
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
  const ranking = new Map(computeRanking(st.finished).map((r) => [r.name, r]))
  const rec: Record = (name) => ({
    wins: ranking.get(name)?.wins ?? 0,
    diff: ranking.get(name)?.diff ?? 0,
  })

  const created: Match[] = []
  byRound.forEach((list, round) => {
    const final = isFinal(states, list, round)
    const sorted = byRecord(list, rec)
    // players finishing a match of the previous round will soon be free for this round
    const incoming = states
      .filter((p) => p.busy && p.level === round)
      .map((p) => ({ name: p.name, wins: rec(p.name).wins }))
    // everybody who will still play this round, whatever he is doing now
    const pool = states.filter((p) => p.level <= round).map((p) => p.name)
    let pairs = final ? perfectPairs(sorted, hasPlayed) : null
    if (!pairs) pairs = pairByRecord(sorted, rec, hasPlayed, incoming, pool)
    if (final && pairs.length * 2 < list.length - (list.length % 2)) {
      pairs = pairByRecord(sorted, rec, () => false) // rematch as a last resort
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
