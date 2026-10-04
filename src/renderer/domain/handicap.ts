import type { TournamentSettings } from '@shared/types'

type HandicapRules = Pick<
  TournamentSettings,
  'handicapEnabled' | 'handicapBracket' | 'handicapPerBracket' | 'handicapCap'
>

/** Points of advance granted to a player rated `own` against one rated `opponent`. */
export function advantage(own: number, opponent: number, rules: HandicapRules): number {
  if (!rules.handicapEnabled || own >= opponent) return 0
  const pts =
    Math.floor((opponent - own) / (rules.handicapBracket || 100)) * (rules.handicapPerBracket || 2)
  return rules.handicapCap ? Math.min(pts, rules.handicapCap) : pts
}
