import { Check } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  MATCH_CARD_LABELS,
  type MatchCardVariant,
} from '@/features/tournament-detail/match-card/variants'
import { PALETTES, type PaletteKey } from '@/lib/palette'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

/** Swatch colours, same lightness as the original palette picker. */
const swatch = ([h, c]: [number, number], l: number) => `oklch(${l} ${c} ${h})`

export function SettingsPage() {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const palette = useAppStore((s) => s.palette)
  const setPalette = useAppStore((s) => s.setPalette)
  const matchCard = useAppStore((s) => s.matchCard)
  const setMatchCard = useAppStore((s) => s.setMatchCard)

  return (
    <div>
      <div className="mb-5.5">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-muted-foreground">Préférences générales de l'application</p>
      </div>
      <div className="max-w-2xl rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-5 py-4.5">
          <div>
            <div className="font-semibold">Thème sombre</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              Basculer entre le thème clair et sombre
            </div>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </div>
        <div className="flex items-center justify-between gap-4 border-t px-5 py-4.5">
          <div>
            <div className="font-semibold">Cartes de match</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              Présentation des matchs à lancer et en cours
            </div>
          </div>
          <Select value={matchCard} onValueChange={(v) => setMatchCard(v as MatchCardVariant)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MATCH_CARD_LABELS) as MatchCardVariant[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {MATCH_CARD_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="border-t px-5 py-4.5">
          <div className="text-[13px] font-semibold">Palette de couleurs</div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            Couleurs utilisées dans toute l'application
          </div>
          <div className="mt-3.5 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
            {(Object.keys(PALETTES) as PaletteKey[]).map((key) => {
              const p = PALETTES[key]
              const selected = key === palette
              return (
                <button
                  key={key}
                  type="button"
                  role="button"
                  aria-pressed={selected}
                  onClick={() => setPalette(key)}
                  className={cn(
                    'flex flex-col gap-2.5 rounded-lg border bg-card p-3 text-left transition hover:border-input',
                    selected && 'border-primary ring-3 ring-primary/20',
                  )}
                >
                  <div className="flex h-7 overflow-hidden rounded-md">
                    <span className="flex-2" style={{ background: swatch(p.primary, 0.5) }} />
                    <span className="flex-1" style={{ background: swatch(p.secondary, 0.7) }} />
                    <span className="flex-1" style={{ background: swatch(p.accent, 0.7) }} />
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[13px] font-semibold">{p.label}</span>
                    {selected && <Check className="size-4 text-primary" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
