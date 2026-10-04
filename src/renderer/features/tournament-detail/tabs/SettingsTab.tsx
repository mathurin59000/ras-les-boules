import { useState } from 'react'
import type { Tournament, TournamentSettings } from '@shared/types'
import { SettingsGroup, SettingsRow } from '@/components/SettingsGroup'
import { Button } from '@/components/ui/button'
import { END_CONDITION_OPTIONS, modeLabel } from '@/domain/constants'
import { useAppStore } from '@/stores/app-store'
import { SettingsForm } from '@/features/tournaments/SettingsForm'

const yesNo = (v: boolean) => (v ? 'Oui' : 'Non')
const END_UNIT: Partial<Record<TournamentSettings['endConditionType'], string>> = {
  matches_per_player: ' matchs',
  rounds: ' tours',
  total_matches: ' matchs',
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <SettingsRow label={label}>
      <span className="text-right font-semibold">{value}</span>
    </SettingsRow>
  )
}

function SettingsView({ cfg }: { cfg: TournamentSettings }) {
  const endOpt = END_CONDITION_OPTIONS.find((o) => o.value === cfg.endConditionType)
  return (
    <>
      <SettingsGroup title="Format">
        <Row label="Mode" value={modeLabel(cfg.mode)} />
        <Row label="Points par match" value={cfg.pointsPerSet} />
        <Row label="2 points d'écart" value={yesNo(cfg.twoPointLead)} />
      </SettingsGroup>
      <SettingsGroup title="Handicap au classement">
        <Row label="Activé" value={yesNo(cfg.handicapEnabled)} />
        {cfg.handicapEnabled && (
          <>
            <Row label="Tranche de points de différence" value={`${cfg.handicapBracket} pts`} />
            <Row label="Points de handicap par tranche" value={`${cfg.handicapPerBracket} pts`} />
            <Row
              label="Plafond maximum"
              value={cfg.handicapCap ? `${cfg.handicapCap} pts` : 'Aucun'}
            />
          </>
        )}
      </SettingsGroup>
      <SettingsGroup title="Fin du tournoi">
        <Row label="Condition" value={endOpt?.label ?? '—'} />
        {cfg.endConditionType !== 'manual' && (
          <Row
            label="Valeur"
            value={cfg.endConditionValue + (END_UNIT[cfg.endConditionType] ?? '')}
          />
        )}
      </SettingsGroup>
    </>
  )
}

export function SettingsTab({
  tournament,
  settings,
}: {
  tournament: Tournament
  settings: TournamentSettings
}) {
  const saveSettings = useAppStore((s) => s.saveSettings)
  const [draft, setDraft] = useState<TournamentSettings | null>(null)
  const locked = tournament.status === 'in_progress' || tournament.status === 'completed'

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground">
          Paramètres définis à la création du tournoi
        </span>
        {draft ? (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                saveSettings(tournament.id, draft)
                setDraft(null)
              }}
            >
              Enregistrer
            </Button>
          </div>
        ) : locked ? (
          <span className="text-xs text-muted-foreground">
            Non modifiables une fois le tournoi démarré
          </span>
        ) : (
          <Button variant="outline" onClick={() => setDraft({ ...settings })}>
            Modifier
          </Button>
        )}
      </div>
      {draft ? <SettingsForm value={draft} onChange={setDraft} /> : <SettingsView cfg={settings} />}
    </div>
  )
}
