import { ArrowDown, ArrowUp, Download, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import type { Tournament } from '@shared/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { modeLabel, STATUS_META } from '@/domain/constants'
import { frDate } from '@/domain/format'
import { appearAfter } from '@/lib/animation'
import { useProgressOf } from '@/stores/use-progress'
import { cn } from '@/lib/utils'
import type { SortDir, SortKey } from './selectors'

interface Props {
  rows: Tournament[]
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
  onOpen: (t: Tournament) => void
  onRename: (t: Tournament) => void
  onExport: (t: Tournament) => void
  onDelete: (t: Tournament) => void
}

function SortHead({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string
  k: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
  className?: string
}) {
  const Arrow = sortDir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead className={cn('cursor-pointer select-none', className)} onClick={() => onSort(k)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k && <Arrow className="size-3" />}
      </span>
    </TableHead>
  )
}

export function TournamentsTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  onOpen,
  onRename,
  onExport,
  onDelete,
}: Props) {
  const sort = { sortKey, sortDir, onSort }
  const progressOf = useProgressOf()
  return (
    <div
      className="animate-card-in overflow-hidden rounded-lg border bg-card"
      style={appearAfter(540)}
    >
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <SortHead label="Nom du tournoi" k="name" {...sort} />
            <TableHead>Mode</TableHead>
            <TableHead>Statut</TableHead>
            <SortHead label="Date de création" k="createdAt" {...sort} />
            <SortHead label="Joueurs" k="players" className="text-center" {...sort} />
            <TableHead className="w-40">Progression</TableHead>
            <TableHead className="w-14" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((t) => {
            const meta = STATUS_META[t.status]
            return (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => onOpen(t)}>
                <TableCell className="font-semibold">{t.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-full">
                    {modeLabel(t.mode)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={meta.tone} dot={meta.dot}>
                    {meta.label}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-muted-foreground">{frDate(t.createdAt)}</TableCell>
                <TableCell className="text-center tabular-nums">{t.players}</TableCell>
                <TableCell>
                  <Progress
                    value={progressOf(t).pct}
                    className={cn('h-2', t.status === 'completed' && '[&>*]:bg-success-500')}
                  />
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Actions">
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onRename(t)}>
                        <Pencil /> Renommer
                      </DropdownMenuItem>
                      {t.status === 'completed' && (
                        <DropdownMenuItem onClick={() => onExport(t)}>
                          <Download /> Exporter les résultats
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(t)}>
                        <Trash2 /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
