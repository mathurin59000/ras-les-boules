import type { Tournament, TournamentStatus } from '@shared/types'

export type SortKey = 'name' | 'createdAt' | 'players'
export type SortDir = 'asc' | 'desc'

export interface TournamentQuery {
  search: string
  statuses: TournamentStatus[]
  sortKey: SortKey
  sortDir: SortDir
}

export const PAGE_SIZE = 6

export function filterAndSort(tournaments: Tournament[], q: TournamentQuery): Tournament[] {
  const needle = q.search.trim().toLowerCase()
  const rows = tournaments.filter(
    (t) =>
      (!needle || t.name.toLowerCase().includes(needle)) &&
      (!q.statuses.length || q.statuses.includes(t.status)),
  )
  const dir = q.sortDir === 'asc' ? 1 : -1
  return rows.sort((a, b) => {
    const av = a[q.sortKey]
    const bv = b[q.sortKey]
    const cmp =
      typeof av === 'string'
        ? av.toLowerCase().localeCompare((bv as string).toLowerCase())
        : av - (bv as number)
    return cmp * dir
  })
}

export function statCounts(tournaments: Tournament[]) {
  const count = (s: TournamentStatus) => tournaments.filter((t) => t.status === s).length
  return {
    total: tournaments.length,
    completed: count('completed'),
    upcoming: count('upcoming'),
    draft: count('draft'),
  }
}
