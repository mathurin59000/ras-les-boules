import { useMemo } from 'react'
import type { Match, TournamentSettings } from '@shared/types'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { computeWaiting, limitsFor } from '@/domain/pairing'
import { computeRanking } from '@/domain/ranking'
import { useAppStore } from '@/stores/app-store'
import { MatchCard } from '../match-card'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

const Placeholder = ({ children }: { children: string }) => (
  <div className="rounded-lg border border-dashed px-4 py-5.5 text-center text-[13px] text-muted-foreground">
    {children}
  </div>
)

function MatchGrid({
  matches,
  kind,
  settings,
  onAction,
  empty,
}: {
  matches: Match[]
  kind: 'pending' | 'live'
  settings: TournamentSettings
  onAction: (m: Match) => void
  empty: string
}) {
  if (!matches.length) return <Placeholder>{empty}</Placeholder>
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
      {[...matches]
        .sort((a, b) => a.round - b.round)
        .map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            kind={kind}
            settings={settings}
            onAction={() => onAction(m)}
          />
        ))}
    </div>
  )
}

interface Props {
  tournamentId: string
  settings: TournamentSettings
  started: boolean
  onStartMatch: (m: Match) => void
  onEnterResult: (m: Match) => void
}

export function OverviewTab({
  tournamentId,
  settings,
  started,
  onStartMatch,
  onEnterResult,
}: Props) {
  const pending = useAppStore((s) => s.pending)
  const live = useAppStore((s) => s.live)
  const finished = useAppStore((s) => s.finished)
  const waitingBase = useAppStore((s) => s.waitingBase)
  const roster = useAppStore((s) => s.rosters[tournamentId])
  const waiting = useMemo(
    () =>
      started
        ? computeWaiting({ pending, live, finished, waitingBase }, limitsFor(settings, roster))
        : [],
    [started, pending, live, finished, waitingBase, settings, roster],
  )

  const records = useMemo(
    () => new Map(computeRanking(finished).map((r) => [r.name, r])),
    [finished],
  )

  return (
    <div className="flex flex-col gap-7">
      <Section title="Matchs à lancer">
        <MatchGrid
          matches={started ? pending : []}
          kind="pending"
          settings={settings}
          onAction={onStartMatch}
          empty="Aucun match n'est prêt à être lancé"
        />
      </Section>
      <Section title="Matchs en cours">
        <MatchGrid
          matches={started ? live : []}
          kind="live"
          settings={settings}
          onAction={onEnterResult}
          empty="Aucun match en cours pour le moment"
        />
      </Section>
      <Section title="Joueurs en attente d'un adversaire">
        {waiting.length ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Joueur</TableHead>
                  <TableHead className="w-30 text-right">Points</TableHead>
                  <TableHead className="w-50">En attente (bilan)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waiting.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <PlayerAvatar name={p.name} className="size-7.5" />
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.rating.toLocaleString('fr-FR')} pts
                    </TableCell>
                    <TableCell>
                      <StatusBadge>
                        Tour {p.nextRound} · {records.get(p.name)?.wins ?? 0} V ·{' '}
                        {records.get(p.name)?.losses ?? 0} D
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Placeholder>Aucun joueur en attente d'adversaire</Placeholder>
        )}
      </Section>
    </div>
  )
}
