import { useId } from 'react'
import { cn } from '@/lib/utils'

// The mark: a banknote snapped in two (split the bill). Each half keeps half of the
// centre "coin" and one corner dot; the halves tilt apart in a V. currentColor only.
// Same geometry as scripts/gen-icons.mjs (public/*.svg and the PNG icons).

interface LogoMarkProps {
  size?: number
  className?: string
  /** Crop to the note (wide box, `size` = height) for inline use next to the wordmark. */
  tight?: boolean
}

export function LogoMark({ size = 32, className, tight }: LogoMarkProps) {
  const id = useId()
  return (
    <svg
      width={tight ? size * 32 / 21 : size}
      height={size}
      viewBox={tight ? '0 5.5 32 21' : '0 0 32 32'} fill="none" aria-hidden="true" className={cn('shrink-0', className)}>
      <defs>
        <mask id={`${id}m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="16" cy="16" r="3.8" fill="black" />
          <circle cx="7.4" cy="12.2" r="1.1" fill="black" />
          <circle cx="24.6" cy="19.8" r="1.1" fill="black" />
        </mask>
        <clipPath id={`${id}l`}><path d="M0 0 H15.3 V32 H0 Z" /></clipPath>
        <clipPath id={`${id}r`}><path d="M16.7 0 H32 V32 H16.7 Z" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}l)`} transform="translate(-1.6 0) rotate(-8 9 16)">
        <rect x="3" y="8.5" width="26" height="15" rx="3" fill="currentColor" mask={`url(#${id}m)`} />
      </g>
      <g clipPath={`url(#${id}r)`} transform="translate(1.6 0) rotate(8 23 16)">
        <rect x="3" y="8.5" width="26" height="15" rx="3" fill="currentColor" mask={`url(#${id}m)`} />
      </g>
    </svg>
  )
}

export function Logo({ size = 28, className }: Omit<LogoMarkProps, 'tight'>) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-fg', className)}>
      <LogoMark size={size * 0.8} tight />
      <span className="leading-none font-semibold" style={{ fontSize: size * 0.68, letterSpacing: '-0.02em' }}>SplitItt</span>
    </span>
  )
}
