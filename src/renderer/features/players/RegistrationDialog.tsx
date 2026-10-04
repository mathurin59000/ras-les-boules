import { useState } from 'react'
import { X } from 'lucide-react'
import type { Player } from '@shared/types'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { nextId } from '@/lib/ids'
import { useAppStore } from '@/stores/app-store'

interface Props {
  tournamentId: string
  tournamentName: string
  open: boolean
  onClose: () => void
}

export function RegistrationDialog({ open, onClose, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        {open && <RegistrationForm onClose={onClose} {...rest} />}
      </DialogContent>
    </Dialog>
  )
}

/** Edits a draft list of players; closing (either way) commits it to the tournament roster. */
function RegistrationForm({ tournamentId, tournamentName, onClose }: Omit<Props, 'open'>) {
  const setRoster = useAppStore((s) => s.setRoster)
  const [players, setPlayers] = useState<Player[]>(
    () => useAppStore.getState().rosters[tournamentId] ?? [],
  )
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [points, setPoints] = useState(1500)

  const canAdd = first.trim() && last.trim() && Number.isFinite(points)
  const add = () => {
    if (!canAdd) return
    setPlayers((p) => [
      ...p,
      {
        id: nextId('p'),
        name: `${first.trim()} ${last.trim()}`,
        points: Math.round(points),
        status: 'active',
      },
    ])
    setFirst('')
    setLast('')
  }
  const close = () => {
    setRoster(tournamentId, players)
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Inscription des joueurs</DialogTitle>
        <DialogDescription>{tournamentName}</DialogDescription>
      </DialogHeader>
      {/* noValidate: step={50} drives the arrows only, any integer (e.g. 1029) is a valid rating */}
      <form
        noValidate
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <div className="grid min-w-35 flex-1 gap-1.5">
          <Label htmlFor="reg-first">Prénom</Label>
          <Input
            id="reg-first"
            placeholder="Prénom"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          />
        </div>
        <div className="grid min-w-35 flex-1 gap-1.5">
          <Label htmlFor="reg-last">Nom</Label>
          <Input
            id="reg-last"
            placeholder="Nom"
            value={last}
            onChange={(e) => setLast(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Points</Label>
          <NumberField value={points} onChange={setPoints} min={0} step={50} />
        </div>
        <Button type="submit" disabled={!canAdd}>
          Ajouter à la liste
        </Button>
      </form>

      <div className="border-t pt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-base font-semibold">Joueurs inscrits</div>
          <span className="text-xs text-muted-foreground">
            {players.length} {players.length > 1 ? 'joueurs inscrits' : 'joueur inscrit'}
          </span>
        </div>
        {players.length ? (
          <ul className="flex max-h-50 flex-col gap-1.5 overflow-y-auto">
            {players.map((p) => (
              <li key={p.id} className="flex items-center gap-2.5 rounded-md border px-2.5 py-1.5">
                <PlayerAvatar name={p.name} className="size-7.5" />
                <span className="flex-1 text-[13px]">{p.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{p.points} pts</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Retirer"
                  onClick={() => setPlayers((l) => l.filter((x) => x.id !== p.id))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-2.5 text-[13px] text-muted-foreground">
            Aucun joueur ajouté pour le moment.
          </div>
        )}
      </div>
      <DialogFooter>
        <Button onClick={close}>Terminer</Button>
      </DialogFooter>
    </>
  )
}
