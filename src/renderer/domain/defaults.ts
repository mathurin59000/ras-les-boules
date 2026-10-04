import { DEFAULT_MODE, END_CONDITION_OPTIONS } from './constants'
import type { Tournament, TournamentSettings } from '@shared/types'

export const DEFAULT_SETTINGS: TournamentSettings = {
  mode: DEFAULT_MODE,
  pointsPerSet: 30,
  winningSets: 3,
  twoPointLead: false,
  handicapEnabled: false,
  handicapBracket: 100,
  handicapPerBracket: 2,
  handicapCap: 20,
  endConditionType: 'rounds',
  endConditionValue: 5,
}

export function settingsFor(
  tournament: Tournament,
  byId: Record<string, TournamentSettings>,
): TournamentSettings {
  const saved = byId[tournament.id]
  if (!saved) return { ...DEFAULT_SETTINGS, mode: tournament.mode ?? DEFAULT_SETTINGS.mode }
  // settings saved before the time-based end conditions were removed
  return END_CONDITION_OPTIONS.some((o) => o.value === saved.endConditionType)
    ? saved
    : { ...saved, endConditionType: 'manual' }
}
