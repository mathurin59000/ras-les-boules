import { useState } from 'react'
import type { Tournament } from '@shared/types'
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
import { useAppStore } from '@/stores/app-store'

export function RenameDialog({
  tournament,
  onClose,
}: {
  tournament: Tournament | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!tournament} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {/* keyed so the draft resets for each tournament */}
        {tournament && <RenameForm key={tournament.id} tournament={tournament} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function RenameForm({ tournament, onClose }: { tournament: Tournament; onClose: () => void }) {
  const rename = useAppStore((s) => s.renameTournament)
  const [name, setName] = useState(tournament.name)
  const submit = () => {
    rename(tournament.id, name)
    onClose()
  }
  return (
    <>
      <DialogHeader>
        <DialogTitle>Renommer le tournoi</DialogTitle>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="rename">Nom du tournoi</Label>
        <Input
          id="rename"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && submit()}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button disabled={!name.trim()} onClick={submit}>
          Enregistrer
        </Button>
      </DialogFooter>
    </>
  )
}
