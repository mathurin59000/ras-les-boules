import type { TournamentStatus } from '@shared/types'
import { appearAfter } from '@/lib/animation'
import { SearchInput } from '@/components/SearchInput'
import { STATUS_META, STATUSES } from '@/domain/constants'
import { cn } from '@/lib/utils'

interface Props {
  search: string
  onSearch: (value: string) => void
  statuses: TournamentStatus[]
  onToggleStatus: (status: TournamentStatus) => void
}

export function TournamentFilters({ search, onSearch, statuses, onToggleStatus }: Props) {
  return (
    <div
      className="flex animate-card-in flex-wrap items-center gap-3 rounded-xl border bg-card p-4"
      style={appearAfter(420)}
    >
      <SearchInput
        className="w-70"
        placeholder="Rechercher un tournoi…"
        value={search}
        onChange={onSearch}
      />
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => {
          const active = statuses.includes(s)
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => onToggleStatus(s)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                active
                  ? 'border-primary bg-accent text-primary'
                  : 'border-input text-muted-foreground hover:border-primary',
              )}
            >
              {STATUS_META[s].label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
