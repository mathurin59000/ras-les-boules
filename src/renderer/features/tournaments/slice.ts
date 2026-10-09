import type { StateCreator } from 'zustand'
import type { Tournament, TournamentMode, TournamentSettings } from '@shared/types'
import type { AppState } from '@/stores/app-store'
import { CURRENT_SEASON } from '@/domain/constants'
import { DEFAULT_SETTINGS } from '@/domain/defaults'
import { seedFirstRound } from '@/domain/seeding'
import { byeSentence } from '@/domain/bye'
import { nextId } from '@/lib/ids'
import { notify } from '@/lib/notify'

const omit = <T>(obj: Record<string, T>, key: string) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key))

const today = () => new Date().toISOString().slice(0, 10)

export interface TournamentsSlice {
  tournaments: Tournament[]
  settingsById: Record<string, TournamentSettings>
  createTournament: (name: string, settings: TournamentSettings) => string
  duplicateTournament: (id: string) => void
  renameTournament: (id: string, name: string) => void
  deleteTournament: (id: string) => void
  saveSettings: (id: string, settings: TournamentSettings) => void
  startTournament: (id: string) => void
  closeTournament: (id: string, options?: { silent?: boolean }) => void
}

export const createTournamentsSlice =
  (
    initial: Pick<TournamentsSlice, 'tournaments' | 'settingsById'>,
  ): StateCreator<AppState, [], [], TournamentsSlice> =>
  (set, get) => {
    const patch = (id: string, fields: Partial<Tournament>) =>
      set((s) => ({
        tournaments: s.tournaments.map((t) => (t.id === id ? { ...t, ...fields } : t)),
      }))
    const find = (id: string) => get().tournaments.find((t) => t.id === id)

    return {
      ...initial,

      createTournament: (name, settings) => {
        const id = nextId('t')
        const mode: TournamentMode = settings.mode ?? DEFAULT_SETTINGS.mode
        const tournament: Tournament = {
          id,
          name,
          season: CURRENT_SEASON,
          status: 'draft',
          createdAt: today(),
          players: 0,
          progress: 0,
          mode,
        }
        set((s) => ({
          tournaments: [tournament, ...s.tournaments],
          rosters: { ...s.rosters, [id]: [] },
          settingsById: { ...s.settingsById, [id]: settings },
        }))
        notify.success(
          'Tournoi créé',
          `${name} a été créé. Inscrivez des joueurs avant de le démarrer.`,
        )
        return id
      },

      duplicateTournament: (id) => {
        const row = find(id)
        if (!row) return
        const copy: Tournament = {
          ...row,
          id: nextId('t'),
          name: `${row.name} (copie)`,
          status: 'draft',
          progress: 0,
          createdAt: today(),
        }
        set((s) => ({ tournaments: [copy, ...s.tournaments] }))
        notify.success('Tournoi dupliqué', `${copy.name} a été créé en brouillon.`)
      },

      renameTournament: (id, name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        patch(id, { name: trimmed })
        notify.success('Tournoi renommé', 'Le nouveau nom a été enregistré.')
      },

      deleteTournament: (id) => {
        const row = find(id)
        set((s) => ({
          tournaments: s.tournaments.filter((t) => t.id !== id),
          rosters: omit(s.rosters, id),
          settingsById: omit(s.settingsById, id),
        }))
        if (row) notify.success('Tournoi supprimé', `${row.name} a été supprimé.`)
      },

      saveSettings: (id, settings) => {
        const row = find(id)
        set((s) => ({ settingsById: { ...s.settingsById, [id]: settings } }))
        patch(id, { mode: settings.mode })
        if (row)
          notify.success(
            'Paramètres enregistrés',
            `Les paramètres de « ${row.name} » ont été mis à jour.`,
          )
      },

      startTournament: (id) => {
        const s = get()
        const roster = (s.rosters[id] ?? []).filter((p) => !p.inactive && p.status !== 'forfeit')
        if (roster.length < 2) return
        const pool = roster.map((p) => ({ name: p.name, rating: p.points || 1000 }))
        const { matches, byes } = seedFirstRound(pool, `r1-${Date.now()}`)
        set({ pending: matches, live: [], finished: byes, waitingBase: [] })
        patch(id, {
          status: 'in_progress',
          progress: 1,
          players: roster.length || find(id)?.players || 0,
        })
        const ready =
          matches.length > 1
            ? `${matches.length} matchs du tour 1 sont prêts à être lancés.`
            : 'Le match du tour 1 est prêt à être lancé.'
        notify.success('Tournoi démarré', ready + byeSentence(byes))
      },

      closeTournament: (id, options) => {
        patch(id, { status: 'completed', progress: 100 })
        if (!options?.silent)
          notify.success('Tournoi clôturé', 'Le classement final est disponible.')
      },
    }
  }
