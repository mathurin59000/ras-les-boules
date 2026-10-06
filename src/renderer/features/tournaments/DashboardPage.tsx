import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, Plus, Trophy } from 'lucide-react'
import type { Tournament, TournamentStatus } from '@shared/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { appearAfter } from '@/lib/animation'
import { useAppStore } from '@/stores/app-store'
import { useUiStore } from '@/stores/ui-store'
import { ExportDialog } from '@/features/tournament-detail/ExportDialog'
import { RenameDialog } from './RenameDialog'
import { StatCards } from './StatCards'
import { TournamentFilters } from './TournamentFilters'
import { TournamentsTable } from './TournamentsTable'
import { filterAndSort, PAGE_SIZE, type SortDir, type SortKey } from './selectors'

export function DashboardPage() {
  const navigate = useNavigate()
  const tournaments = useAppStore((s) => s.tournaments)
  const deleteTournament = useAppStore((s) => s.deleteTournament)
  const openWizard = useUiStore((s) => s.setWizardOpen)

  const [search, setSearch] = useState('')
  const [statuses, setStatuses] = useState<TournamentStatus[]>([])
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'createdAt',
    dir: 'desc',
  })
  const [page, setPage] = useState(1)
  const [renaming, setRenaming] = useState<Tournament | null>(null)
  const [deleting, setDeleting] = useState<Tournament | null>(null)
  const [exporting, setExporting] = useState<Tournament | null>(null)

  const rows = useMemo(
    () => filterAndSort(tournaments, { search, statuses, sortKey: sort.key, sortDir: sort.dir }),
    [tournaments, search, statuses, sort],
  )
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const paged = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const toggleStatus = (s: TournamentStatus) => {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
    setPage(1)
  }
  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-3">
        <h1 className="animate-card-in text-3xl font-bold tracking-tight">Tournois</h1>
        <p className="mt-1 animate-card-in text-muted-foreground" style={appearAfter(120)}>
          Créez, suivez et gérez les tournois du club : inscriptions, matchs en cours et
          classements.
        </p>
      </div>

      <StatCards tournaments={tournaments} />
      <TournamentFilters
        search={search}
        onSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        statuses={statuses}
        onToggleStatus={toggleStatus}
      />

      {rows.length === 0 ? (
        <div className="animate-card-in rounded-xl border bg-card" style={appearAfter(540)}>
          <EmptyState
            icon={Trophy}
            title="Aucun tournoi pour l'instant"
            description="Créez le premier tournoi interne de la saison pour commencer à suivre les inscriptions et les résultats."
            action={
              <Button onClick={() => openWizard(true)}>
                <Plus /> Créer mon premier tournoi
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <TournamentsTable
            rows={paged}
            sortKey={sort.key}
            sortDir={sort.dir}
            onSort={toggleSort}
            onOpen={(t) => navigate(`/tournaments/${t.id}`)}
            onRename={setRenaming}
            onExport={setExporting}
            onDelete={setDeleting}
          />
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft /> Précédent
            </Button>
            <span className="text-[13px] text-muted-foreground tabular-nums">
              {current} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={current >= totalPages}
              onClick={() => setPage(current + 1)}
            >
              Suivant <ChevronRight />
            </Button>
          </div>
        </>
      )}

      <RenameDialog tournament={renaming} onClose={() => setRenaming(null)} />
      {exporting && <ExportDialog tournament={exporting} open onClose={() => setExporting(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer ce tournoi ?"
        description={
          deleting &&
          `« ${deleting.name} » sera définitivement supprimé. Cette action est irréversible.`
        }
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => deleting && deleteTournament(deleting.id)}
      />
    </div>
  )
}
