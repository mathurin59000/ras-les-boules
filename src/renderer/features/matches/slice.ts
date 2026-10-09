import type { StateCreator } from 'zustand'
import type { Match, TournamentSettings, WaitingBase } from '@shared/types'
import type { AppState } from '@/stores/app-store'
import { byeSentence, realPlayers } from '@/domain/bye'
import { advance, hasLimit, limitsFor } from '@/domain/pairing'
import { settingsFor } from '@/domain/defaults'
import { formatScore, type Side } from '@/domain/scoring'
import { notify } from '@/lib/notify'

export interface MatchesSlice {
  pending: Match[]
  live: Match[]
  finished: Match[]
  waitingBase: WaitingBase[]
  startMatch: (id: string) => void
  finishMatch: (
    id: string,
    winner: Side,
    loserPoints: number,
    rules: TournamentSettings,
    tournamentId: string,
  ) => void
  /**
   * A player left the loop (inactive, forfeit, removed) or came back: cancels his booked matches, lets the others
   * pair again. A match he is playing is left alone.
   */
  reconcileRoster: (tournamentId: string, changed: string[]) => void
  /** A player was renamed: his matches follow. */
  renamePlayerInMatches: (from: string, to: string) => void
  /** Corrects the score of a finished match (standings follow; pairings already made are kept). */
  editResult: (id: string, winner: Side, loserPoints: number, rules: TournamentSettings) => void
}

export const createMatchesSlice =
  (
    initial: Pick<MatchesSlice, 'pending' | 'live' | 'finished' | 'waitingBase'>,
  ): StateCreator<AppState, [], [], MatchesSlice> =>
  (set, get) => ({
    ...initial,

    startMatch: (id) => {
      const m = get().pending.find((x) => x.id === id)
      if (!m) return
      set((s) => ({ pending: s.pending.filter((x) => x.id !== id), live: [m, ...s.live] }))
      notify.success('Match lancé', `${m.p1.name} vs ${m.p2.name} est maintenant en cours.`)
    },

    reconcileRoster: (tournamentId, changed) => {
      const s = get()
      const t = s.tournaments.find((x) => x.id === tournamentId)
      if (!t || t.status !== 'in_progress') return
      const roster = s.rosters[tournamentId] ?? []
      const names = new Set(roster.map((p) => p.name))
      // matches are kept for one tournament only: do nothing if they are not this one's
      const all = [...s.pending, ...s.live, ...s.finished]
      if (!all.some((m) => realPlayers(m).some((p) => names.has(p.name)))) return
      const limits = limitsFor(settingsFor(t, s.settingsById), roster)
      const isDropped = (m: Match) =>
        realPlayers(m).some((p) => changed.includes(p.name) && limits.isOut?.(p.name))
      const dropped = s.pending.filter(isDropped)
      const pending = s.pending.filter((m) => !isDropped(m))
      // the opponent of a cancelled match goes back to waiting for that round
      const back = dropped.flatMap((m) =>
        realPlayers(m)
          .filter((p) => !limits.isOut?.(p.name))
          .map((p) => ({ name: p.name, rating: p.rating, nextRound: m.round })),
      )
      const waitingBase = [
        ...s.waitingBase.filter((w) => !back.some((b) => b.name === w.name)),
        ...back,
      ]
      const { matches, byes } = advance(
        { pending, live: s.live, finished: s.finished, waitingBase },
        `sync-${Date.now()}`,
        limits,
      )
      if (!dropped.length && !matches.length && !byes.length) return
      set({ pending: [...pending, ...matches], finished: [...s.finished, ...byes], waitingBase })
      if (dropped.length)
        notify.info(
          'Match annulé',
          `${dropped.map((m) => `${m.p1.name} vs ${m.p2.name}`).join(', ')} : un joueur n'est plus dans le tournoi.`,
        )
      if (matches.length)
        notify.success('Nouveaux matchs', `${matches.length} match(s) prêt(s) à être lancé(s).`)
    },

    renamePlayerInMatches: (from, to) => {
      const side = (p: Match['p1']) => (p.name === from ? { ...p, name: to } : p)
      const rename = (list: Match[]) => list.map((m) => ({ ...m, p1: side(m.p1), p2: side(m.p2) }))
      set((s) => ({
        pending: rename(s.pending),
        live: rename(s.live),
        finished: rename(s.finished),
        waitingBase: s.waitingBase.map((w) => (w.name === from ? { ...w, name: to } : w)),
      }))
    },

    editResult: (id, winner, loserPoints, rules) => {
      const m = get().finished.find((x) => x.id === id)
      if (!m || m.bye) return
      const score = formatScore(winner, rules.pointsPerSet || 30, loserPoints)
      set((s) => ({ finished: s.finished.map((x) => (x.id === id ? { ...x, score } : x)) }))
      notify.success('Résultat modifié', `${m.p1.name} vs ${m.p2.name} : ${score}.`)
    },

    finishMatch: (id, winner, loserPoints, rules, tournamentId) => {
      const s = get()
      const m = s.live.find((x) => x.id === id)
      if (!m) return
      const score = formatScore(winner, rules.pointsPerSet || 30, loserPoints)
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const live = s.live.filter((x) => x.id !== id)
      const done = [...s.finished, { ...m, score, time }]
      const limits = limitsFor(rules, s.rosters[tournamentId])
      const { matches, byes } = advance(
        { pending: s.pending, live, finished: done, waitingBase: s.waitingBase },
        `auto-${Date.now()}`,
        limits,
      )
      const finished = [...done, ...byes]
      set({ live, finished, pending: [...s.pending, ...matches] })
      const winnerName = (winner === 'p1' ? m.p1 : m.p2).name
      const next = matches.length
        ? ` ${matches.length} ${matches.length > 1 ? 'nouveaux matchs prêts' : 'nouveau match prêt'} à être lancé.`
        : ''
      // nothing left to play or to create: with an end condition the tournament is over
      const over = !matches.length && !live.length && !s.pending.length
      const closes = over && hasLimit(limits)
      if (closes) get().closeTournament(tournamentId, { silent: true })
      notify.success(
        closes ? 'Tournoi terminé' : 'Match terminé',
        `${winnerName} remporte le match ${score}.${next}${byeSentence(byes)}${closes ? ' Tous les matchs prévus ont été joués : le tournoi est terminé et le classement final est disponible.' : ''}`,
      )
    },
  })
