import type { DbSlices } from '@shared/types'
import { useAppStore, type AppState } from './app-store'

const SAVED_KEYS = [
  'tournaments',
  'rosters',
  'settingsById',
  'pending',
  'live',
  'finished',
  'waitingBase',
  'theme',
  'palette',
  'matchCard',
] as const

/** Sends only the slices whose reference changed to the main process. Also seeds the DB on first run. */
export function startPersistence(): void {
  let last: Partial<AppState> = {}
  const flush = (s: AppState) => {
    const changed = (keys: readonly (keyof AppState)[]) => keys.some((k) => last[k] !== s[k])
    const out: DbSlices = {}
    if (changed(['tournaments', 'rosters', 'settingsById'])) {
      out.tournaments = s.tournaments
      out.rosters = s.rosters
      out.settingsById = s.settingsById
    }
    if (changed(['pending', 'live', 'finished']))
      out.matches = { pending: s.pending, live: s.live, finished: s.finished }
    if (changed(['waitingBase'])) out.waitingBase = s.waitingBase
    if (changed(['theme', 'palette', 'matchCard']))
      out.prefs = { theme: s.theme, palette: s.palette, matchCard: s.matchCard }
    last = Object.fromEntries(SAVED_KEYS.map((k) => [k, s[k]]))
    if (Object.keys(out).length) {
      try {
        window.rlb.save(out)
      } catch (e) {
        console.error(e)
      }
    }
  }
  flush(useAppStore.getState())
  useAppStore.subscribe(flush)
}
