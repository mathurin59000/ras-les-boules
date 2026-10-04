import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type Tone = 'neutral' | 'pending' | 'live' | 'success' | 'error'

const TONES: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-neutral-tone-50 text-neutral-tone-700', dot: 'bg-neutral-tone-500' },
  pending: { badge: 'bg-pending-50 text-pending-700', dot: 'bg-pending-500' },
  live: { badge: 'bg-live-50 text-live-700', dot: 'bg-live-500' },
  success: { badge: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
  error: { badge: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
}

export function StatusBadge({
  tone = 'neutral',
  dot = false,
  className,
  children,
}: {
  tone?: Tone
  dot?: boolean
  className?: string
  children: ReactNode
}) {
  const t = TONES[tone]
  return (
    <Badge
      variant="secondary"
      className={cn('gap-1.5 rounded-full border-0 px-2.5 font-semibold', t.badge, className)}
    >
      {dot && (
        <span
          className={cn(
            'size-1.5 animate-[badge-pulse_1.6s_ease-in-out_infinite] rounded-full',
            t.dot,
          )}
        />
      )}
      {children}
    </Badge>
  )
}
