import type { Matches, TournamentSettings, TournamentStatus, WaitingBase } from '@shared/types'
import { isBye, realPlayers } from './bye'

export interface Progress {
  pct: number
  label: string
}

/** Tournament progress: matches done (live ones count half) over the expected total. */
export function computeProgress(
  status: TournamentStatus,
  settings: TournamentSettings,
  m: Matches & { waitingBase: WaitingBase[] },
): Progress {
  if (status === 'completed') return { pct: 100, label: 'Terminé' }
  if (status !== 'in_progress') return { pct: 0, label: 'Non démarré' }
  const names = new Set(
    [...m.pending, ...m.live, ...m.finished]
      .flatMap((x) => realPlayers(x).map((p) => p.name))
      .concat(m.waitingBase.map((p) => p.name)),
  )
  const players = Math.max(names.size, 2)
  const perPlayer =
    settings.endConditionType === 'matches_per_player' || settings.endConditionType === 'rounds'
      ? settings.endConditionValue || 5
      : 5
  const byCap = settings.endConditionType !== 'total_matches' || !(settings.endConditionValue > 0)
  // with an odd number of players there is one exemption per round
  const expectedByes = byCap && players % 2 ? perPlayer : 0
  const total = byCap
    ? Math.max(1, (players * perPlayer - expectedByes) / 2)
    : settings.endConditionValue
  const byes = m.finished.filter(isBye).length
  const played = m.finished.length - byes
  const live = m.live.length
  // counted in player slots (a match fills two, an exemption one, a live match is half done)
  // so that the percentage stays exact while the label only shows whole matches
  const slots = 2 * played + byes + live
  const pct = Math.min(100, Math.round((slots / (2 * total + expectedByes)) * 100))
  const byeLabel = byes ? ` · ${byes} exemption${byes > 1 ? 's' : ''}` : ''
  const liveLabel = live ? ` · ${live} en cours` : ''
  return { pct, label: `${played}/${total} matchs joués${byeLabel}${liveLabel}` }
}
