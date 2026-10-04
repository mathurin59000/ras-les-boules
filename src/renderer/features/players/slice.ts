import type { StateCreator } from 'zustand'
import type { Player } from '@shared/types'
import type { AppState } from '@/stores/app-store'
import { notify } from '@/lib/notify'

export interface PlayersSlice {
  rosters: Record<string, Player[]>
  setRoster: (tournamentId: string, players: Player[]) => void
  updatePlayer: (tournamentId: string, id: string, patch: Partial<Player>) => void
  toggleForfeit: (tournamentId: string, id: string) => void
  removePlayer: (tournamentId: string, id: string) => void
}

export const createPlayersSlice =
  (initial: Record<string, Player[]>): StateCreator<AppState, [], [], PlayersSlice> =>
  (set) => {
    /** Applies `fn` to a roster and keeps the tournament's player count in sync. */
    const editRoster = (tournamentId: string, fn: (list: Player[]) => Player[]) =>
      set((s) => {
        const list = fn(s.rosters[tournamentId] ?? [])
        return {
          rosters: { ...s.rosters, [tournamentId]: list },
          tournaments: s.tournaments.map((t) =>
            t.id === tournamentId ? { ...t, players: list.length } : t,
          ),
        }
      })

    return {
      rosters: initial,
      setRoster: (tournamentId, players) => editRoster(tournamentId, () => players),
      updatePlayer: (tournamentId, id, patch) => {
        editRoster(tournamentId, (list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))
        notify.success('Joueur mis à jour', 'Les informations du joueur ont été enregistrées.')
      },
      toggleForfeit: (tournamentId, id) =>
        editRoster(tournamentId, (list) =>
          list.map((p) =>
            p.id === id ? { ...p, status: p.status === 'forfeit' ? 'active' : 'forfeit' } : p,
          ),
        ),
      removePlayer: (tournamentId, id) =>
        editRoster(tournamentId, (list) => list.filter((p) => p.id !== id)),
    }
  }
