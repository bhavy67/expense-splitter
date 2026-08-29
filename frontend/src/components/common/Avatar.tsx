import { cn } from '@/lib/utils'
import { getPreset } from '@/lib/avatars'
import { AVATAR_SVG_MAP } from './AvatarSVGs'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
}

const sizes = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const COLORS = [
  'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500',
]

function colorFor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function Avatar({ name, src, size = 'md', className, animated = false }: AvatarProps) {
  const preset = getPreset(src)

  if (preset) {
    const SvgComponent = AVATAR_SVG_MAP[preset.id]
    return (
      <div
        className={cn('rounded-full shrink-0 overflow-hidden ring-2 ring-white dark:ring-zinc-900', sizes[size], animated && 'avatar-animated', className)}
        style={{
          background: preset.gradient,
          ['--avatar-glow' as string]: preset.glow,
        }}
        title={`${name} (${preset.label})`}
      >
        {SvgComponent ? <SvgComponent /> : null}
      </div>
    )
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-white dark:ring-zinc-900', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white dark:ring-zinc-900 shrink-0',
        colorFor(name),
        sizes[size],
        className
      )}
      title={name}
    >
      {initials(name)}
    </div>
  )
}
