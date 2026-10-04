import { useCallback } from 'react'
import type { Tournament } from '@shared/types'
import { settingsFor } from '@/domain/defaults'
import { computeProgress, type Progress } from '@/domain/progress'
import { useAppStore } from './app-store'

/** Live progress of a tournament, shared by the list and the detail page so they never disagree. */
export function useProgressOf(): (t: Tournament) => Progress {
  const pending = useAppStore((s) => s.pending)
  const live = useAppStore((s) => s.live)
  const finished = useAppStore((s) => s.finished)
  const waitingBase = useAppStore((s) => s.waitingBase)
  const settingsById = useAppStore((s) => s.settingsById)
  return useCallback(
    (t) =>
      computeProgress(t.status, settingsFor(t, settingsById), {
        pending,
        live,
        finished,
        waitingBase,
      }),
    [pending, live, finished, waitingBase, settingsById],
  )
}
