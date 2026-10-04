export type TournamentStatus = 'draft' | 'upcoming' | 'in_progress' | 'completed'
export type TournamentMode = 'swiss_async'
export type PlayerStatus = 'active' | 'forfeit'
export type EndConditionType = 'matches_per_player' | 'rounds' | 'total_matches' | 'manual'
export type CriterionKey =
  'wins' | 'winRatio' | 'pointDiff' | 'pointsScored' | 'headToHead' | 'initialRank'

export interface Tournament {
  id: string
  name: string
  season: string | null
  status: TournamentStatus
  createdAt: string // YYYY-MM-DD
  players: number
  progress: number
  mode?: TournamentMode
}

export interface Player {
  id: string
  name: string
  points: number
  status: PlayerStatus | string
  inactive?: boolean
  license?: string
}

export interface TournamentSettings {
  mode: TournamentMode
  pointsPerSet: number
  winningSets: number
  twoPointLead: boolean
  handicapEnabled: boolean
  handicapBracket: number
  handicapPerBracket: number
  handicapCap: number
  endConditionType: EndConditionType
  endConditionValue: number
}

export interface MatchPlayer {
  name: string
  rating: number
}

export interface Match {
  id: string
  round: number
  p1: MatchPlayer
  p2: MatchPlayer
  table: number | null
  score?: string
  time?: string
  /** Live set scores; not persisted by the database. */
  sets?: string[]
  /** Exemption: the lone player (p1) is credited a forfeit win, p2 is a placeholder. */
  bye?: boolean
}

export interface Matches {
  pending: Match[]
  live: Match[]
  finished: Match[]
}

export interface WaitingBase {
  name: string
  rating: number
  nextRound: number
}

export interface Prefs {
  theme?: string
}

/** Everything the database returns on load. */
export interface DbSnapshot {
  tournaments: Tournament[]
  rosters: Record<string, Player[]>
  settingsById: Record<string, TournamentSettings>
  matches: Matches
  waitingBase: WaitingBase[]
  prefs: Record<string, string>
}

/** Partial update sent to the database (only changed slices). */
export type DbSlices = Partial<Omit<DbSnapshot, 'matches' | 'prefs'>> & {
  matches?: Matches
  prefs?: Record<string, string | null | undefined>
}

export type UpdateState =
  | { status: 'idle' }
  | { status: 'available'; version: string }
  | { status: 'downloading'; percent: number }
  | { status: 'ready' }

export interface RlbApi {
  load: () => DbSnapshot | null
  save: (slices: DbSlices) => void
  onUpdate: (cb: (state: UpdateState) => void) => () => void
  downloadUpdate: () => void
  installUpdate: () => void
}
