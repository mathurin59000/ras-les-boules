import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { Match, TournamentSettings } from '@shared/types'
import { NumberField } from '@/components/NumberField'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { formatScore, type Side } from '@/domain/scoring'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

interface Props {
  match: Match | null
  tournamentId: string
  settings: TournamentSettings
  onClose: () => void
}

export function ResultDialog({ match, tournamentId, settings, onClose }: Props) {
  return (
    <Dialog open={!!match} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {match && (
          <ResultForm
            key={match.id}
            match={match}
            tournamentId={tournamentId}
            settings={settings}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ResultForm({ match, tournamentId, settings, onClose }: Props & { match: Match }) {
  const finishMatch = useAppStore((s) => s.finishMatch)
  const editResult = useAppStore((s) => s.editResult)
  // a finished match carries its score: the dialog then corrects it
  const [s1, s2] = (match.score ?? '').split('-').map(Number)
  const editing = Number.isFinite(s1) && Number.isFinite(s2)
  const [winner, setWinner] = useState<Side | null>(editing ? (s1 > s2 ? 'p1' : 'p2') : null)
  const [loserPoints, setLoserPoints] = useState(editing ? Math.min(s1, s2) : 0)
  const target = settings.pointsPerSet || 30

  const confirm = () => {
    if (!winner) return
    if (editing) editResult(match.id, winner, loserPoints, settings)
    else finishMatch(match.id, winner, loserPoints, settings, tournamentId)
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? 'Modifier le résultat' : 'Résultat du match'}</DialogTitle>
        <DialogDescription>
          Tour {match.round} · {match.p1.name} vs {match.p2.name}
        </DialogDescription>
      </DialogHeader>
      <form
        id="result-form"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          confirm()
        }}
      >
        <div>
          <Label className="mb-2">Gagnant</Label>
          <div role="radiogroup" className="grid grid-cols-2 gap-2.5">
            {(['p1', 'p2'] as const).map((k) => {
              const p = match[k]
              const selected = winner === k
              return (
                <div
                  key={k}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => setWinner(k)}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.preventDefault()
                      setWinner(k)
                    } else if (e.key === 'Enter') {
                      e.preventDefault()
                      // Enter on the chosen winner confirms the result
                      if (selected) confirm()
                      else setWinner(k)
                    }
                  }}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-colors hover:border-primary',
                    selected && 'border-primary bg-primary/10',
                  )}
                >
                  <PlayerAvatar name={p.name} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[13px] font-semibold">{p.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {p.rating.toLocaleString('fr-FR')} pts
                    </span>
                  </div>
                  {selected && <CheckCircle2 className="size-4.5 text-primary" />}
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <Label className="mb-2">Points du perdant</Label>
            <NumberField value={loserPoints} onChange={setLoserPoints} min={0} max={target - 1} />
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Score final</div>
            <div className="text-2xl font-semibold tabular-nums">
              {winner ? formatScore(winner, target, loserPoints).replace('-', ' – ') : '— – —'}
            </div>
          </div>
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" form="result-form" disabled={!winner}>
          Confirmer
        </Button>
      </DialogFooter>
    </>
  )
}
