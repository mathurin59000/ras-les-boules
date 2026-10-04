import type { StateCreator } from 'zustand'
import type { AppState } from '@/stores/app-store'
import type { PaletteKey } from '@/lib/palette'
import type { MatchCardVariant } from '@/features/tournament-detail/match-card/variants'

export type Theme = 'light' | 'dark'

export interface PrefsSlice {
  theme: Theme
  palette: PaletteKey
  matchCard: MatchCardVariant
  toggleTheme: () => void
  setPalette: (palette: PaletteKey) => void
  setMatchCard: (variant: MatchCardVariant) => void
}

export const createPrefsSlice =
  (
    initial: Pick<PrefsSlice, 'theme' | 'palette' | 'matchCard'>,
  ): StateCreator<AppState, [], [], PrefsSlice> =>
  (set) => ({
    ...initial,
    toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    setPalette: (palette) => set({ palette }),
    setMatchCard: (matchCard) => set({ matchCard }),
  })
