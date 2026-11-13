import { cn } from '@/lib/utils'

const sizes = {
  20: 'size-5 text-[9px]',
  28: 'size-7 text-[11px]',
  36: 'size-9 text-caption',
  48: 'size-12 text-body',
} as const

type AvatarSize = keyof typeof sizes

interface AvatarProps {
  name: string
  size?: AvatarSize
  /** Reserved for the future colour phase (member.color is persisted user data). Ignored for now. */
  color?: string
  className?: string
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

export function Avatar({ name, size = 36, className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full bg-surface-muted font-medium text-fg',
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </span>
  )
}

interface AvatarStackProps {
  names: string[]
  max?: number
  size?: AvatarSize
  className?: string
}

export function AvatarStack({ names, max = 5, size = 28, className }: AvatarStackProps) {
  const shown = names.slice(0, max)
  const extra = names.length - shown.length
  return (
    <div className={cn('flex items-center -space-x-1', className)}>
      {shown.map((n, i) => (
        <Avatar key={i} name={n} size={size} className="ring-2 ring-bg" />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full bg-surface-muted font-medium text-fg-muted ring-2 ring-bg',
            sizes[size]
          )}
          aria-label={`${extra} more`}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}
