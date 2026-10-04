import { useMemo } from 'react'
import { BarChart2 } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { computeRanking } from '@/domain/ranking'
import { useAppStore } from '@/stores/app-store'

/** ponytail: wins then point difference only; the settings' ranking criteria are not applied yet. */
export function RankingTab({ started }: { started: boolean }) {
  const finished = useAppStore((s) => s.finished)
  const rows = useMemo(() => computeRanking(finished), [finished])

  if (!started || rows.length === 0) {
    return (
      <EmptyState
        icon={BarChart2}
        title="Classement pas encore disponible"
        description="Le classement s'affichera dès que les premiers matchs seront joués."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted px-4 py-2.5 text-[13px] font-semibold">
        Poule unique — Suisse asynchrone
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Joueur</TableHead>
            <TableHead className="text-center">V</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">+/-</TableHead>
            <TableHead className="text-right">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={r.name}>
              <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <PlayerAvatar name={r.name} className="size-7.5" />
                  <span className="font-semibold">{r.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-center tabular-nums">{r.wins}</TableCell>
              <TableCell className="text-center tabular-nums">{r.losses}</TableCell>
              <TableCell className="text-center tabular-nums">
                {r.diff > 0 ? `+${r.diff}` : r.diff}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{r.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
