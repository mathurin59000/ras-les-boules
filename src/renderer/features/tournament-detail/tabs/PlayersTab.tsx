import { useState } from 'react'
import { Plus, UserPlus, X } from 'lucide-react'
import type { Player, Tournament } from '@shared/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { EditPlayerDialog } from '@/features/players/EditPlayerDialog'
import { RegistrationDialog } from '@/features/players/RegistrationDialog'
import { useAppStore } from '@/stores/app-store'

export function PlayersTab({ tournament }: { tournament: Tournament }) {
  const roster = useAppStore((s) => s.rosters[tournament.id]) ?? []
  const removePlayer = useAppStore((s) => s.removePlayer)
  const [registering, setRegistering] = useState(false)
  const [editing, setEditing] = useState<Player | null>(null)
  const [removing, setRemoving] = useState<Player | null>(null)

  const addButton = (
    <Button onClick={() => setRegistering(true)}>
      <Plus /> Ajouter des joueurs
    </Button>
  )

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground">
          {roster.length} {roster.length > 1 ? 'joueurs inscrits' : 'joueur inscrit'}
        </span>
        {addButton}
      </div>

      {roster.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Aucun joueur inscrit pour l'instant"
          description="Ajoutez des joueurs manuellement."
          action={addButton}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
          {roster.map((p) => (
            <div
              key={p.id}
              onClick={() => setEditing(p)}
              className="relative flex cursor-pointer flex-col gap-2.5 rounded-lg border bg-card p-3.5 transition hover:border-input hover:shadow-md"
            >
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-2 right-2 size-6.5 rounded-full text-muted-foreground hover:text-destructive"
                aria-label="Retirer le joueur"
                title="Retirer le joueur"
                onClick={(e) => {
                  e.stopPropagation()
                  setRemoving(p)
                }}
              >
                <X />
              </Button>
              <div className="flex items-center gap-2.5 pr-5.5">
                <PlayerAvatar name={p.name} className="size-9.5" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">{p.points} pts</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge tone={p.inactive ? 'neutral' : 'success'}>
                  {p.inactive ? 'Inactif' : 'Actif'}
                </StatusBadge>
                {p.status === 'forfeit' && <StatusBadge tone="error">Forfait</StatusBadge>}
              </div>
            </div>
          ))}
        </div>
      )}

      <RegistrationDialog
        open={registering}
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        onClose={() => setRegistering(false)}
      />
      <EditPlayerDialog
        tournamentId={tournament.id}
        player={editing}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Retirer ce joueur ?"
        description={removing && `« ${removing.name} » sera retiré de ce tournoi.`}
        confirmLabel="Retirer"
        destructive
        onConfirm={() => removing && removePlayer(tournament.id, removing.id)}
      />
    </>
  )
}
