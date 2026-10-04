import type {
  CriterionKey,
  EndConditionType,
  TournamentMode,
  TournamentStatus,
} from '@shared/types'

export type StatusTone = 'neutral' | 'pending' | 'live' | 'success'

export const STATUS_META: Record<
  TournamentStatus,
  { label: string; tone: StatusTone; dot: boolean }
> = {
  draft: { label: 'Brouillon', tone: 'neutral', dot: false },
  upcoming: { label: 'À venir', tone: 'pending', dot: false },
  in_progress: { label: 'En cours', tone: 'live', dot: true },
  completed: { label: 'Terminé', tone: 'success', dot: false },
}

export const STATUSES = Object.keys(STATUS_META) as TournamentStatus[]

export const MODE_OPTIONS: { value: TournamentMode; label: string }[] = [
  { value: 'swiss_async', label: 'Suisse asynchrone' },
]

export const DEFAULT_MODE: TournamentMode = 'swiss_async'

export const END_CONDITION_OPTIONS: { value: EndConditionType; label: string }[] = [
  { value: 'rounds', label: 'Nombre de tours' },
  { value: 'matches_per_player', label: 'Nombre fixe de matchs par joueur' },
  { value: 'total_matches', label: 'Nombre total de matchs' },
  { value: 'manual', label: 'Arrêt manuel' },
]

export const CRITERIA_LABELS: Record<CriterionKey, string> = {
  wins: 'Victoires',
  winRatio: 'Ratio de victoires',
  pointDiff: 'Différence de points',
  pointsScored: 'Points marqués',
  headToHead: 'Confrontation directe',
  initialRank: 'Classement initial',
}

export const DEFAULT_CRITERIA = Object.keys(CRITERIA_LABELS) as CriterionKey[]

export const SEASONS = ['2024-2025', '2025-2026']
export const CURRENT_SEASON = '2025-2026'

export const modeLabel = (mode: TournamentMode = DEFAULT_MODE) =>
  (MODE_OPTIONS.find((m) => m.value === mode) ?? MODE_OPTIONS[0]).label
