import type { StateCreator } from 'zustand'
import type { Match, TournamentSettings, WaitingBase } from '@shared/types'
import type { AppState } from '@/stores/app-store'
import { byeSentence } from '@/domain/bye'
import { advance, hasLimit, limitsFrom } from '@/domain/pairing'
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

    finishMatch: (id, winner, loserPoints, rules, tournamentId) => {
      const s = get()
      const m = s.live.find((x) => x.id === id)
      if (!m) return
      const score = formatScore(winner, rules.pointsPerSet || 30, loserPoints)
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const live = s.live.filter((x) => x.id !== id)
      const done = [...s.finished, { ...m, score, time }]
      const limits = limitsFrom(rules)
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
