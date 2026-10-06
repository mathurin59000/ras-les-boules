import { describe, expect, it } from 'vitest'
import type { Match, Player, Tournament } from '@shared/types'
import { createBye } from './bye'
import { buildCsv, buildShareText, exportFileName } from './export'
import { computeRanking } from './ranking'

const t: Tournament = {
  id: 't1',
  name: 'Open "Noël"; 2026',
  season: null,
  status: 'completed',
  createdAt: '2026-10-06',
  players: 3,
  progress: 100,
}
const match = (id: string, round: number, a: string, b: string, score: string): Match => ({
  id,
  round,
  p1: { name: a, rating: 1500 },
  p2: { name: b, rating: 1400 },
  table: null,
  score,
  time: '10:00',
})
const roster: Player[] = ['Léa', 'Hugo', 'Sam'].map((name, i) => ({
  id: 'p' + i,
  name,
  points: 1500 - i * 100,
  status: i === 2 ? 'forfeit' : 'active',
}))
const finished = [
  match('m1', 1, 'Léa', 'Hugo', '30-10'),
  createBye({ name: 'Sam', rating: 1300 }, 1, 'b1'),
  match('m2', 2, 'Sam', 'Léa', '12-30'),
]

describe('buildCsv', () => {
  const csv = buildCsv({ tournament: t, roster, finished })
  const lines = csv.split('\r\n')

  it('starts with a BOM and escapes quotes and separators', () => {
    expect(csv.startsWith('﻿"Open ""Noël""; 2026"')).toBe(true)
  })
  it('has the three sections', () => {
    expect(lines).toContain('Classement')
    expect(lines).toContain('Historique')
    expect(lines).toContain('Joueurs')
  })
  it('lists history newest first and flags exemptions', () => {
    const h = lines.slice(lines.indexOf('Historique') + 2)
    expect(h[0]).toBe('2;10:00;Sam;Léa;12-30;non')
    expect(h[1]).toBe('1;;Sam;;;oui')
    expect(h[2]).toBe('1;10:00;Léa;Hugo;30-10;non')
  })
  it('exports the roster with forfeit status', () => {
    expect(lines).toContain('Sam;1300;Forfait')
  })
})

describe('buildShareText', () => {
  it('keeps the top 10 with podium emojis', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      name: 'J' + i,
      wins: 12 - i,
      losses: 0,
      diff: 0,
      points: (12 - i) * 3,
    }))
    const text = buildShareText('Open', many)
    expect(text.split('\n')).toHaveLength(2 + 10)
    expect(text).toContain('🥇 J0 — 36 pts (12 victoires)')
    expect(text).toContain('10. J9')
    expect(text).not.toContain('J10')
  })
  it('handles an exemption win in the ranking', () => {
    expect(buildShareText('Open', computeRanking(finished))).toContain('🥇 Léa — 6 pts')
  })
})

describe('exportFileName', () => {
  it('slugifies and appends the date', () => {
    expect(exportFileName('Tournoi de Noël 2026', new Date('2026-10-06'))).toBe(
      'tournoi-de-noel-2026-2026-10-06.csv',
    )
  })
})
