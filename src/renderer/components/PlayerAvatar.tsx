import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

export function PlayerAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn('size-9', className)}>
      <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
