import { app } from 'electron'
import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'
import type { DbSlices, DbSnapshot, Match, Player, Tournament } from '@shared/types'

let db: DatabaseSync

export function openDb(): void {
  db = new DatabaseSync(join(app.getPath('userData'), 'ras-les-boules.db'))
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, season TEXT, status TEXT NOT NULL,
      created_at TEXT NOT NULL, players INTEGER NOT NULL DEFAULT 0, progress INTEGER NOT NULL DEFAULT 0,
      mode TEXT, position INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY, tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      name TEXT NOT NULL, points INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'active',
      inactive INTEGER NOT NULL DEFAULT 0, license TEXT, position INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('pending','live','finished')),
      round INTEGER NOT NULL, p1_name TEXT NOT NULL, p1_rating INTEGER NOT NULL,
      p2_name TEXT NOT NULL, p2_rating INTEGER NOT NULL, table_no INTEGER, score TEXT, time TEXT, position INTEGER NOT NULL,
      bye INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS waiting (
      name TEXT PRIMARY KEY, rating INTEGER NOT NULL, next_round INTEGER NOT NULL, position INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS tournament_settings (
      tournament_id TEXT PRIMARY KEY REFERENCES tournaments(id) ON DELETE CASCADE, json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS prefs (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `)
  // databases created before exemptions existed
  const cols = db.prepare('PRAGMA table_info(matches)').all() as { name: string }[]
  if (!cols.some((c) => c.name === 'bye')) {
    db.exec('ALTER TABLE matches ADD COLUMN bye INTEGER NOT NULL DEFAULT 0')
  }
}

type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const q = (sql: string) => db.prepare(sql).all() as Row[]
const tournamentIds = () => new Set(q('SELECT id FROM tournaments').map((t) => t.id as string))

// ponytail: each slice is rewritten whole inside one transaction; fine for club-sized data, switch to row diffs if it grows.
const SLICES: { [K in keyof DbSlices]-?: (value: NonNullable<DbSlices[K]>) => void } = {
  tournaments(rows) {
    db.exec('DELETE FROM tournaments')
    const ins = db.prepare('INSERT INTO tournaments VALUES (?,?,?,?,?,?,?,?,?)')
    rows.forEach((t, i) =>
      ins.run(
        t.id,
        t.name,
        t.season ?? null,
        t.status,
        t.createdAt,
        t.players || 0,
        t.progress || 0,
        t.mode ?? null,
        i,
      ),
    )
  },
  rosters(map) {
    const ids = tournamentIds()
    db.exec('DELETE FROM players')
    const ins = db.prepare('INSERT INTO players VALUES (?,?,?,?,?,?,?,?)')
    for (const [tid, list] of Object.entries(map)) {
      if (!ids.has(tid)) continue // roster of a deleted tournament
      list.forEach((p, i) =>
        ins.run(
          p.id,
          tid,
          p.name,
          p.points,
          p.status || 'active',
          p.inactive ? 1 : 0,
          p.license ?? null,
          i,
        ),
      )
    }
  },
  settingsById(map) {
    db.exec('DELETE FROM tournament_settings')
    const ins = db.prepare('INSERT INTO tournament_settings VALUES (?,?)')
    const ids = tournamentIds()
    for (const [tid, cfg] of Object.entries(map))
      if (ids.has(tid)) ins.run(tid, JSON.stringify(cfg))
  },
  matches({ pending, live, finished }) {
    db.exec('DELETE FROM matches')
    const ins = db.prepare(
      'INSERT INTO matches (id,kind,round,p1_name,p1_rating,p2_name,p2_rating,table_no,score,time,position,bye) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    )
    const kinds: [string, Match[]][] = [
      ['pending', pending],
      ['live', live],
      ['finished', finished],
    ]
    kinds.forEach(([kind, list]) =>
      list.forEach((m, i) =>
        ins.run(
          m.id,
          kind,
          m.round,
          m.p1.name,
          m.p1.rating,
          m.p2.name,
          m.p2.rating,
          m.table ?? null,
          m.score ?? null,
          m.time ?? null,
          i,
          m.bye ? 1 : 0,
        ),
      ),
    )
  },
  waitingBase(rows) {
    db.exec('DELETE FROM waiting')
    const ins = db.prepare('INSERT INTO waiting VALUES (?,?,?,?)')
    rows.forEach((p, i) => ins.run(p.name, p.rating, p.nextRound, i))
  },
  prefs(obj) {
    const up = db.prepare(
      'INSERT INTO prefs VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    )
    for (const [k, v] of Object.entries(obj)) if (v != null) up.run(k, String(v))
  },
}

export function load(): DbSnapshot | null {
  if (!db.prepare('SELECT 1 FROM tournaments LIMIT 1').get()) return null // first run: renderer seeds
  const rosters: Record<string, Player[]> = {}
  q('SELECT id FROM tournaments').forEach((t) => {
    rosters[t.id] = []
  })
  q('SELECT * FROM players ORDER BY position').forEach((p) =>
    rosters[p.tournament_id].push({
      id: p.id,
      name: p.name,
      points: p.points,
      status: p.status,
      ...(p.inactive ? { inactive: true } : {}),
      ...(p.license ? { license: p.license } : {}),
    }),
  )
  const matches: DbSnapshot['matches'] = { pending: [], live: [], finished: [] }
  q('SELECT * FROM matches ORDER BY position').forEach((m) =>
    matches[m.kind as keyof typeof matches].push({
      id: m.id,
      round: m.round,
      p1: { name: m.p1_name, rating: m.p1_rating },
      p2: { name: m.p2_name, rating: m.p2_rating },
      table: m.table_no,
      ...(m.score ? { score: m.score } : {}),
      ...(m.time ? { time: m.time } : {}),
      ...(m.bye ? { bye: true } : {}),
    }),
  )
  return {
    tournaments: q('SELECT * FROM tournaments ORDER BY position').map((t): Tournament => ({
      id: t.id,
      name: t.name,
      season: t.season,
      status: t.status,
      createdAt: t.created_at,
      players: t.players,
      progress: t.progress,
      ...(t.mode ? { mode: t.mode } : {}),
    })),
    rosters,
    settingsById: Object.fromEntries(
      q('SELECT * FROM tournament_settings').map((r) => [r.tournament_id, JSON.parse(r.json)]),
    ),
    matches,
    waitingBase: q('SELECT * FROM waiting ORDER BY position').map((w) => ({
      name: w.name,
      rating: w.rating,
      nextRound: w.next_round,
    })),
    prefs: Object.fromEntries(q('SELECT * FROM prefs').map((r) => [r.key, r.value])),
  }
}

export function save(slices: DbSlices): void {
  db.exec('BEGIN')
  try {
    // tournaments, rosters and settingsById are always sent together: deleting tournaments cascades to the other two
    for (const k of [
      'tournaments',
      'rosters',
      'settingsById',
      'matches',
      'waitingBase',
      'prefs',
    ] as const) {
      const value = slices[k]
      if (value) (SLICES[k] as (v: typeof value) => void)(value)
    }
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    console.error('db save failed', e)
  }
}
