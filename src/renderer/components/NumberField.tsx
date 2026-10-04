import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function NumberField({ value, onChange, min, max, step, className }: Props) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      step={step}
      className={cn('w-32 tabular-nums', className)}
      onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
    />
  )
}
