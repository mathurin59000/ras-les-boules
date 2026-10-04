import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Download, Flag, Play, TriangleAlert, Users, type LucideIcon } from 'lucide-react'
import type { Match } from '@shared/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { modeLabel, STATUS_META } from '@/domain/constants'
import { settingsFor } from '@/domain/defaults'
import { frDate } from '@/domain/format'
import { appearAfter } from '@/lib/animation'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { RegistrationDialog } from '@/features/players/RegistrationDialog'
import { useAppStore } from '@/stores/app-store'
import { useProgressOf } from '@/stores/use-progress'
import { ResultDialog } from './ResultDialog'
import { HistoryTab } from './tabs/HistoryTab'
import { OverviewTab } from './tabs/OverviewTab'
import { PlayersTab } from './tabs/PlayersTab'
import { RankingTab } from './tabs/RankingTab'
import { SettingsTab } from './tabs/SettingsTab'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'players', label: 'Joueurs' },
  { value: 'ranking', label: 'Classement' },
  { value: 'history', label: 'Historique' },
  { value: 'settings', label: 'Paramètres' },
] as const

type TabValue = (typeof TABS)[number]['value']

export function TournamentDetailPage() {
  const { id, tab } = useParams()
  const navigate = useNavigate()
  const tournament = useAppStore((s) => s.tournaments.find((t) => t.id === id))
  const settingsById = useAppStore((s) => s.settingsById)
  const roster = useAppStore((s) => s.rosters[id ?? ''])
  const pending = useAppStore((s) => s.pending)
  const progressOf = useProgressOf()
  const { startTournament, closeTournament, startMatch } = useAppStore.getState()

  const [confirmStart, setConfirmStart] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [startingMatch, setStartingMatch] = useState<Match | null>(null)
  const [resultMatch, setResultMatch] = useState<Match | null>(null)

  if (!tournament) return <Navigate to="/" replace />
  const currentTab: TabValue = TABS.some((t) => t.value === tab) ? (tab as TabValue) : 'overview'

  const meta = STATUS_META[tournament.status]
  const settings = settingsFor(tournament, settingsById)
  const rosterCount = roster?.length ?? 0
  const started = tournament.status === 'in_progress' || tournament.status === 'completed'
  const progress = progressOf(tournament)

  const action: {
    label: string
    variant: 'default' | 'secondary' | 'outline'
    icon: LucideIcon
    run: () => void
  } =
    (tournament.status === 'draft' || tournament.status === 'upcoming') && rosterCount < 2
      ? {
          label: 'Inscrire des joueurs',
          variant: 'default',
          icon: Users,
          run: () => setRegistering(true),
        }
      : tournament.status === 'draft' || tournament.status === 'upcoming'
        ? {
            label: tournament.status === 'draft' ? 'Démarrer le tournoi' : 'Commencer',
            variant: 'default',
            icon: Play,
            run: () => setConfirmStart(true),
          }
        : tournament.status === 'in_progress'
          ? {
              label: 'Clôturer le tournoi',
              variant: 'secondary',
              icon: Flag,
              run: () => closeTournament(tournament.id),
            }
          : {
              label: 'Exporter les résultats',
              variant: 'outline',
              icon: Download,
              run: () =>
                notify.info(
                  'Export lancé',
                  `Les résultats de « ${tournament.name} » sont en cours d'export.`,
                ),
            }

  return (
    <div>
      <Breadcrumb className="animate-card-in">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Tournois</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tournament.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mt-3.5 mb-5 flex items-start justify-between gap-5">
        <div>
          <div className="flex animate-card-in items-center gap-3" style={appearAfter(60)}>
            <h1 className="text-4xl font-bold tracking-tight">{tournament.name}</h1>
            <StatusBadge tone={meta.tone} dot={meta.dot}>
              {meta.label}
            </StatusBadge>
          </div>
          <div
            className="mt-2.5 flex animate-card-in gap-5 text-[13px] text-muted-foreground"
            style={appearAfter(180)}
          >
            <span>
              {tournament.status === 'draft' ? rosterCount : tournament.players} joueurs inscrits
            </span>
            <span>Créé le {frDate(tournament.createdAt)}</span>
            <span>Mode : {modeLabel(tournament.mode)}</span>
          </div>
          <div className="mt-3.5 w-85 animate-card-in" style={appearAfter(240)}>
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>Avancement du tournoi</span>
              <span>{progress.label}</span>
            </div>
            <Progress
              value={progress.pct}
              className={cn('h-2', tournament.status === 'completed' && '[&>*]:bg-success-500')}
            />
          </div>
        </div>
        <Button
          className="animate-card-in"
          style={appearAfter(120)}
          variant={action.variant}
          onClick={action.run}
        >
          <action.icon /> {action.label}
        </Button>
      </header>

      {(tournament.status === 'draft' || tournament.status === 'upcoming') && rosterCount < 2 && (
        <div className="mb-4.5 flex items-center gap-3 rounded-lg border border-live-500/40 bg-live-50 px-4 py-3 text-[13px] text-live-700">
          <TriangleAlert className="size-4 shrink-0" />
          <span className="flex-1">
            Ajoutez au moins 2 joueurs pour pouvoir démarrer ce tournoi.
          </span>
          <Button size="sm" variant="outline" onClick={() => setRegistering(true)}>
            Inscrire des joueurs
          </Button>
        </div>
      )}

      <Tabs
        value={currentTab}
        onValueChange={(v) => navigate(`/tournaments/${tournament.id}/${v}`)}
        className="sticky -top-7 z-10 -mx-7 mt-5 animate-card-in bg-background/90 px-7 backdrop-blur"
        style={appearAfter(300)}
      >
        <TabsList variant="line" className="w-full justify-start border-b">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              {t.value === 'overview' && started && pending.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-5 animate-card-in" style={appearAfter(420)}>
        {currentTab === 'overview' && (
          <OverviewTab
            settings={settings}
            started={started || tournament.status === 'in_progress'}
            onStartMatch={setStartingMatch}
            onEnterResult={setResultMatch}
          />
        )}
        {currentTab === 'players' && <PlayersTab tournament={tournament} />}
        {currentTab === 'ranking' && <RankingTab started={started} />}
        {currentTab === 'history' && <HistoryTab started={started} />}
        {currentTab === 'settings' && (
          <SettingsTab key={tournament.id} tournament={tournament} settings={settings} />
        )}
      </div>

      <RegistrationDialog
        open={registering}
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        onClose={() => setRegistering(false)}
      />
      <ConfirmDialog
        open={confirmStart}
        onOpenChange={setConfirmStart}
        title="Commencer le tournoi ?"
        confirmLabel="J'ai compris"
        onConfirm={() => {
          startTournament(tournament.id)
          navigate(`/tournaments/${tournament.id}`)
        }}
      >
        <div className="flex flex-col gap-3 text-[13px] text-muted-foreground">
          <p>Une fois le tournoi commencé, certains paramètres ne pourront plus être modifiés :</p>
          <ul className="flex list-disc flex-col gap-1 pl-4.5 text-foreground">
            <li>le mode du tournoi</li>
            <li>les points par match et le handicap</li>
            <li>la condition de fin du tournoi</li>
          </ul>
          <p>Les matchs du premier tour seront créés et apparaîtront dans « Matchs à lancer ».</p>
        </div>
      </ConfirmDialog>
      <ConfirmDialog
        open={!!startingMatch}
        onOpenChange={(o) => !o && setStartingMatch(null)}
        title="Lancer ce match ?"
        description={
          startingMatch &&
          `Confirmez que le match ${startingMatch.p1.name} vs ${startingMatch.p2.name} (tour ${startingMatch.round}) a bien commencé. Il passera dans « Matchs en cours ».`
        }
        confirmLabel="Confirmer"
        onConfirm={() => startingMatch && startMatch(startingMatch.id)}
      />
      <ResultDialog
        match={resultMatch}
        tournamentId={tournament.id}
        settings={settings}
        onClose={() => setResultMatch(null)}
      />
    </div>
  )
}
