import { create } from 'zustand'
import type { DbSnapshot } from '@shared/types'
import { seedIds } from '@/lib/ids'
import { createMatchesSlice, type MatchesSlice } from '@/features/matches/slice'
import { createPlayersSlice, type PlayersSlice } from '@/features/players/slice'
import { createPrefsSlice, type PrefsSlice } from '@/features/settings/slice'
import {
  DEFAULT_MATCH_CARD,
  isMatchCardVariant,
} from '@/features/tournament-detail/match-card/variants'
import { DEFAULT_PALETTE, isPaletteKey } from '@/lib/palette'
import { createTournamentsSlice, type TournamentsSlice } from '@/features/tournaments/slice'

export type AppState = TournamentsSlice & PlayersSlice & MatchesSlice & PrefsSlice

const EMPTY_SNAPSHOT: DbSnapshot = {
  tournaments: [],
  rosters: {},
  settingsById: {},
  matches: { pending: [], live: [], finished: [] },
  waitingBase: [],
  prefs: {},
}

function loadSnapshot(): DbSnapshot {
  try {
    const saved = window.rlb.load()
    if (saved) return saved
  } catch (e) {
    console.error(e)
  }
  return EMPTY_SNAPSHOT // first run
}

const snap = loadSnapshot()
seedIds([
  ...snap.tournaments.map((t) => t.id),
  ...Object.values(snap.rosters)
    .flat()
    .map((p) => p.id),
])

export const useAppStore = create<AppState>()((...a) => ({
  ...createTournamentsSlice({ tournaments: snap.tournaments, settingsById: snap.settingsById })(
    ...a,
  ),
  ...createPlayersSlice(snap.rosters)(...a),
  ...createMatchesSlice({ ...snap.matches, waitingBase: snap.waitingBase })(...a),
  ...createPrefsSlice({
    theme: snap.prefs.theme === 'dark' ? 'dark' : 'light',
    palette: isPaletteKey(snap.prefs.palette) ? snap.prefs.palette : DEFAULT_PALETTE,
    matchCard: isMatchCardVariant(snap.prefs.matchCard) ? snap.prefs.matchCard : DEFAULT_MATCH_CARD,
  })(...a),
}))
