import type { EndConditionType, TournamentMode, TournamentSettings } from '@shared/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { NumberField } from '@/components/NumberField'
import { SettingsGroup, SettingsRow } from '@/components/SettingsGroup'
import { END_CONDITION_OPTIONS, MODE_OPTIONS } from '@/domain/constants'

interface Props {
  value: TournamentSettings
  onChange: (value: TournamentSettings) => void
  /** The mode can only be picked in the wizard's first step. */
  showMode?: boolean
}

/** Editable rules / handicap / end-condition form, shared by the creation wizard and the settings tab. */
export function SettingsForm({ value, onChange, showMode = true }: Props) {
  const set = <K extends keyof TournamentSettings>(key: K, v: TournamentSettings[K]) =>
    onChange({ ...value, [key]: v })
  const num = (key: keyof TournamentSettings) => (v: number) => set(key, v as never)

  return (
    <div className="flex flex-col gap-4">
      <SettingsGroup title="Format">
        {showMode && (
          <SettingsRow label="Mode">
            <Select value={value.mode} onValueChange={(v) => set('mode', v as TournamentMode)}>
              <SelectTrigger className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
        )}
        <SettingsRow label="Points par match">
          <NumberField value={value.pointsPerSet} onChange={num('pointsPerSet')} min={5} max={51} />
        </SettingsRow>
        <SettingsRow label="2 points d'écart">
          <Switch checked={value.twoPointLead} onCheckedChange={(v) => set('twoPointLead', v)} />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Handicap au classement">
        <SettingsRow label="Activé">
          <Switch
            checked={value.handicapEnabled}
            onCheckedChange={(v) => set('handicapEnabled', v)}
          />
        </SettingsRow>
        {value.handicapEnabled && (
          <>
            <SettingsRow label="Tranche de points de différence">
              <NumberField
                value={value.handicapBracket}
                onChange={num('handicapBracket')}
                min={10}
                step={10}
              />
            </SettingsRow>
            <SettingsRow label="Points de handicap par tranche">
              <NumberField
                value={value.handicapPerBracket}
                onChange={num('handicapPerBracket')}
                min={1}
              />
            </SettingsRow>
            <SettingsRow label="Plafond maximum (0 = aucun)">
              <NumberField value={value.handicapCap} onChange={num('handicapCap')} min={0} />
            </SettingsRow>
          </>
        )}
      </SettingsGroup>

      <SettingsGroup title="Fin du tournoi">
        <SettingsRow label="Condition">
          <Select
            value={value.endConditionType}
            onValueChange={(v) => set('endConditionType', v as EndConditionType)}
          >
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {END_CONDITION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        {value.endConditionType !== 'manual' && (
          <SettingsRow label="Valeur">
            <NumberField
              value={value.endConditionValue}
              onChange={num('endConditionValue')}
              min={1}
            />
          </SettingsRow>
        )}
      </SettingsGroup>
    </div>
  )
}
