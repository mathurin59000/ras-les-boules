import type { Match, Player, Tournament } from '@shared/types'
import { computeRanking, type RankingRow } from './ranking'

const SEP = ';'
const cell = (v: string | number) => {
  const s = String(v)
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const line = (cells: (string | number)[]) => cells.map(cell).join(SEP)

interface ExportData {
  tournament: Tournament
  roster: Player[]
  finished: Match[]
}

/** One CSV with three titled sections (Classement, Historique, Joueurs); BOM so Excel reads UTF-8. */
export function buildCsv({ tournament, roster, finished }: ExportData): string {
  const ranking = computeRanking(finished)
  const history = [...finished].reverse().sort((a, b) => b.round - a.round) // newest first
  const rows = [
    line([tournament.name]),
    '',
    line(['Classement']),
    line(['Rang', 'Joueur', 'Victoires', 'Défaites', 'Différence', 'Points']),
    ...ranking.map((r, i) => line([i + 1, r.name, r.wins, r.losses, r.diff, r.points])),
    '',
    line(['Historique']),
    line(['Tour', 'Heure', 'Joueur 1', 'Joueur 2', 'Score', 'Exemption']),
    ...history.map((m) =>
      line([
        m.round,
        m.time ?? '',
        m.p1.name,
        m.bye ? '' : m.p2.name,
        m.bye ? '' : (m.score ?? ''),
        m.bye ? 'oui' : 'non',
      ]),
    ),
    '',
    line(['Joueurs']),
    line(['Nom', 'Points de départ', 'Statut']),
    ...roster.map((p) => line([p.name, p.points, p.status === 'forfeit' ? 'Forfait' : 'Actif'])),
  ]
  return '﻿' + rows.join('\r\n') + '\r\n'
}

const MEDALS = ['🥇', '🥈', '🥉']

/** Shareable standings: podium emojis then "4." … "10." with points and wins. */
export function buildShareText(tournamentName: string, ranking: RankingRow[], top = 10): string {
  const rows = ranking.slice(0, top).map((r, i) => {
    const wins = `${r.wins} victoire${r.wins > 1 ? 's' : ''}`
    return `${MEDALS[i] ?? `${i + 1}.`} ${r.name} — ${r.points} pts (${wins})`
  })
  return [`🏓 ${tournamentName} — Classement final`, '', ...rows].join('\n')
}

/** "Tournoi de Noël 2026" → "tournoi-de-noel-2026-2026-10-06.csv" */
export function exportFileName(name: string, date = new Date()): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'tournoi'}-${date.toISOString().slice(0, 10)}.csv`
}
