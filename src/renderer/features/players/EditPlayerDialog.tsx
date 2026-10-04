import { useState } from 'react'
import type { Player } from '@shared/types'
import { NumberField } from '@/components/NumberField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/stores/app-store'

interface Props {
  tournamentId: string
  player: Player | null
  onClose: () => void
}

export function EditPlayerDialog({ tournamentId, player, onClose }: Props) {
  return (
    <Dialog open={!!player} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {player && (
          <EditForm key={player.id} tournamentId={tournamentId} player={player} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditForm({ tournamentId, player, onClose }: Props & { player: Player }) {
  const updatePlayer = useAppStore((s) => s.updatePlayer)
  const [first = '', ...rest] = player.name.split(' ')
  const [firstName, setFirstName] = useState(first)
  const [lastName, setLastName] = useState(rest.join(' '))
  const [points, setPoints] = useState(player.points)
  const [active, setActive] = useState(!player.inactive)

  const save = () => {
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || player.name
    updatePlayer(tournamentId, player.id, { name, points, inactive: !active })
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Modifier le joueur</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="p-first">Prénom</Label>
            <Input id="p-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="p-last">Nom</Label>
            <Input id="p-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Points</Label>
          <NumberField value={points} onChange={setPoints} min={0} step={10} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <div>
            <div className="text-[13px] font-semibold">Statut : {active ? 'Actif' : 'Inactif'}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Un joueur inactif n'est plus apparié aux prochains tours.
            </div>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={save}>Sauvegarder</Button>
      </DialogFooter>
    </>
  )
}
