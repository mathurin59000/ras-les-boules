import { describe, expect, it } from 'vitest'
import type { Tournament } from '@shared/types'
import { filterAndSort, statCounts, type TournamentQuery } from './selectors'

const t = (
  id: string,
  name: string,
  status: Tournament['status'],
  players: number,
  createdAt: string,
): Tournament => ({
  id,
  name,
  status,
  players,
  createdAt,
  season: null,
  progress: 0,
})
const rows = [
  t('1', 'Noël', 'completed', 30, '2025-12-18'),
  t('2', 'avril', 'draft', 10, '2026-04-01'),
  t('3', 'Rentrée', 'completed', 20, '2025-09-05'),
]

describe('filterAndSort', () => {
  it('filters by search and status, sorts case-insensitively', () => {
    const q: TournamentQuery = { search: '', statuses: [], sortKey: 'name', sortDir: 'asc' }
    expect(filterAndSort(rows, q).map((r) => r.id)).toEqual(['2', '1', '3'])
    expect(filterAndSort(rows, { ...q, statuses: ['completed'] }).map((r) => r.id)).toEqual([
      '1',
      '3',
    ])
    expect(filterAndSort(rows, { ...q, search: ' ren ' }).map((r) => r.id)).toEqual(['3'])
  })
  it('sorts numerically and descending', () => {
    const q: TournamentQuery = { search: '', statuses: [], sortKey: 'players', sortDir: 'desc' }
    expect(filterAndSort(rows, q).map((r) => r.players)).toEqual([30, 20, 10])
  })
  it('counts by status', () => {
    expect(statCounts(rows)).toEqual({ total: 3, completed: 2, upcoming: 0, draft: 1 })
  })
})
