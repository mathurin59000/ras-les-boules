import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { TournamentSettings } from '@shared/types'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MODE_OPTIONS } from '@/domain/constants'
import { DEFAULT_SETTINGS } from '@/domain/defaults'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'
import { useUiStore } from '@/stores/ui-store'
import { SettingsForm } from './SettingsForm'

const STEPS = ['Général', 'Paramètres']

export function CreateTournamentWizard() {
  const open = useUiStore((s) => s.wizardOpen)
  const setOpen = useUiStore((s) => s.setWizardOpen)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {/* mounted only while open so every opening starts from a blank form */}
        {open && <WizardBody onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function WizardBody({ onDone }: { onDone: () => void }) {
  const create = useAppStore((s) => s.createTournament)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [settings, setSettings] = useState<TournamentSettings>(DEFAULT_SETTINGS)

  const step1Valid = name.trim().length > 0

  const submit = () => {
    const id = create(name.trim() || 'Nouveau tournoi', settings)
    onDone()
    navigate(`/tournaments/${id}`)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouveau tournoi — Étape {step + 1}/2</DialogTitle>
      </DialogHeader>

      <ol className="flex items-center gap-3">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-6.5 items-center justify-center rounded-full text-xs font-bold',
                i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                'text-[13px]',
                i === step ? 'font-bold' : 'font-medium text-muted-foreground',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="wizard-name">Nom du tournoi</Label>
            <Input
              id="wizard-name"
              autoFocus
              placeholder="ex. Tournoi de Noël 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Mode du tournoi</Label>
            <Select
              value={settings.mode}
              onValueChange={(mode) =>
                setSettings({ ...settings, mode: mode as TournamentSettings['mode'] })
              }
            >
              <SelectTrigger className="w-full">
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
          </div>
        </div>
      ) : (
        <SettingsForm value={settings} onChange={setSettings} showMode={false} />
      )}

      <DialogFooter>
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(0)}>
            Précédent
          </Button>
        )}
        {step === 0 ? (
          <Button disabled={!step1Valid} onClick={() => setStep(1)}>
            Suivant
          </Button>
        ) : (
          <Button onClick={submit}>Créer le tournoi</Button>
        )}
      </DialogFooter>
    </>
  )
}
