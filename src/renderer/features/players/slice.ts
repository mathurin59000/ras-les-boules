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
  (set, get) => {
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
      setRoster: (tournamentId, players) => {
        const before = get().rosters[tournamentId] ?? []
        editRoster(tournamentId, () => players)
        const kept = new Set(players.map((p) => p.name))
        const changed = before.map((p) => p.name).filter((n) => !kept.has(n))
        // also brings back a name added again
        const added = players.map((p) => p.name).filter((n) => !before.some((b) => b.name === n))
        if (changed.length || added.length)
          get().reconcileRoster(tournamentId, [...changed, ...added])
      },
      updatePlayer: (tournamentId, id, patch) => {
        const before = get().rosters[tournamentId]?.find((p) => p.id === id)
        editRoster(tournamentId, (list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))
        if (before && patch.name && patch.name !== before.name)
          get().renamePlayerInMatches(before.name, patch.name)
        if (before && ('inactive' in patch || 'status' in patch))
          get().reconcileRoster(tournamentId, [patch.name ?? before.name])
        notify.success('Joueur mis à jour', 'Les informations du joueur ont été enregistrées.')
      },
      toggleForfeit: (tournamentId, id) => {
        editRoster(tournamentId, (list) =>
          list.map((p) =>
            p.id === id ? { ...p, status: p.status === 'forfeit' ? 'active' : 'forfeit' } : p,
          ),
        )
        const p = get().rosters[tournamentId]?.find((x) => x.id === id)
        if (p) get().reconcileRoster(tournamentId, [p.name])
      },
      removePlayer: (tournamentId, id) => {
        const p = get().rosters[tournamentId]?.find((x) => x.id === id)
        editRoster(tournamentId, (list) => list.filter((x) => x.id !== id))
        if (p) get().reconcileRoster(tournamentId, [p.name])
      },
    }
  }
