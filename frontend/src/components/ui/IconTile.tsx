import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconTileProps {
  icon: LucideIcon
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { tile: 'size-6 rounded-sm', icon: 'size-3.5' },
  md: { tile: 'size-10 rounded-md', icon: 'size-5' },
  lg: { tile: 'size-16 rounded-lg', icon: 'size-7' },
}

// Monochrome replacement for category / group-type emojis.
export function IconTile({ icon: Icon, size = 'md', className }: IconTileProps) {
  const s = sizes[size]
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center bg-surface-subtle text-fg', s.tile, className)}>
      <Icon className={s.icon} strokeWidth={1.75} aria-hidden />
    </span>
  )
}
