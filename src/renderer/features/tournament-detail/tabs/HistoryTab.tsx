import { useMemo, useState } from 'react'
import { History, SearchX } from 'lucide-react'
import type { Match } from '@shared/types'
import { EmptyState } from '@/components/EmptyState'
import { SearchInput } from '@/components/SearchInput'
import { StatusBadge, type Tone } from '@/components/StatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

type MatchStatus = 'pending' | 'live' | 'done'

const MATCH_STATUS: Record<
  MatchStatus,
  { label: string; tone: Tone; dot: boolean; order: number }
> = {
  pending: { label: 'À lancer', tone: 'pending', dot: false, order: 2 },
  live: { label: 'En cours', tone: 'live', dot: true, order: 1 },
  done: { label: 'Terminé', tone: 'success', dot: false, order: 0 },
}

interface Row {
  match: Match
  time: string
  round: number
  p1: string
  p2: string
  score: string
  status: MatchStatus
  bye: boolean
}

const toRow = (m: Match, status: MatchStatus): Row => ({
  match: m,
  time: m.time ?? '—',
  round: m.round,
  p1: m.p1.name,
  p2: m.p2.name,
  score: m.bye ? 'Victoire forfaitaire' : (m.score ?? '—'),
  status,
  bye: !!m.bye,
})

interface Props {
  started: boolean
  /** Opens the score dialog for a live match (enter it) or a finished one (correct it). */
  onEditResult: (m: Match) => void
}

export function HistoryTab({ started, onEditResult }: Props) {
  const pending = useAppStore((s) => s.pending)
  const live = useAppStore((s) => s.live)
  const finished = useAppStore((s) => s.finished)
  const [query, setQuery] = useState('')
  const [round, setRound] = useState('all')
  const [status, setStatus] = useState('all')

  const all = useMemo<Row[]>(
    () => [
      ...finished.map((m) => toRow(m, 'done')),
      ...live.map((m) => toRow(m, 'live')),
      ...pending.map((m) => toRow(m, 'pending')),
    ],
    [pending, live, finished],
  )
  const rounds = useMemo(() => [...new Set(all.map((r) => r.round))].sort((a, b) => a - b), [all])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    // finished matches are stored chronologically: reverse first so the stable sort keeps newest first
    return [...all]
      .reverse()
      .filter(
        (r) =>
          (status === 'all' || r.status === status) &&
          (round === 'all' || String(r.round) === round) &&
          (!q || r.p1.toLowerCase().includes(q) || r.p2.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) => b.round - a.round || MATCH_STATUS[b.status].order - MATCH_STATUS[a.status].order,
      )
  }, [all, query, round, status])

  if (!started) {
    return (
      <EmptyState
        icon={History}
        title="Aucun match terminé"
        description="L'historique des matchs joués apparaîtra ici au fil du tournoi."
      />
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          className="w-60"
          placeholder="Filtrer par joueur…"
          value={query}
          onChange={setQuery}
        />
        <Select value={round} onValueChange={setRound}>
          <SelectTrigger className="w-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les tours</SelectItem>
            {rounds.map((r) => (
              <SelectItem key={r} value={String(r)}>
                Tour {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {(Object.keys(MATCH_STATUS) as MatchStatus[]).map((k) => (
              <SelectItem key={k} value={k}>
                {MATCH_STATUS[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={History}
          title="Aucun match terminé"
          description="L'historique des matchs joués apparaîtra ici au fil du tournoi."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Aucun résultat"
          description="Aucun match ne correspond à ces filtres."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Heure</TableHead>
                <TableHead>Tour</TableHead>
                <TableHead>Match</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const st = MATCH_STATUS[r.status]
                const editable = r.status !== 'pending' && !r.bye
                return (
                  <TableRow
                    key={i}
                    className={cn(editable && 'cursor-pointer')}
                    tabIndex={editable ? 0 : undefined}
                    onClick={editable ? () => onEditResult(r.match) : undefined}
                    onKeyDown={
                      editable
                        ? (e) => e.key === 'Enter' && (e.preventDefault(), onEditResult(r.match))
                        : undefined
                    }
                  >
                    <TableCell className="text-muted-foreground tabular-nums">{r.time}</TableCell>
                    <TableCell className="text-muted-foreground">Tour {r.round}</TableCell>
                    <TableCell className="font-semibold">
                      {r.bye ? `${r.p1} — exemption` : `${r.p1} vs ${r.p2}`}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{r.score}</TableCell>
                    <TableCell>
                      <StatusBadge tone={st.tone} dot={st.dot}>
                        {st.label}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
