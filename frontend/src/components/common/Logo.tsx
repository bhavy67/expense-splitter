import { useId } from 'react'
import { cn } from '@/lib/utils'

// The mark: a ₹ drawn as strokes (no <text>, so it renders the same everywhere) with a
// division slash cutting the bar ends and the leg. currentColor only.
// Same geometry as scripts/gen-icons.mjs (public/*.svg and the PNG icons).
export const RUPEE_PATHS = ['M6 7 H21', 'M6 12.5 H21', 'M6 7 H11.5 A5.5 5.5 0 0 1 11.5 18 H6 L15.6 25.5']
export const SLASH_PATH = 'M25 4 L15.5 28'

interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 32, className }: LogoMarkProps) {
  const mask = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('shrink-0', className)}>
      <mask id={mask}>
        <rect width="32" height="32" fill="white" />
        <path d={SLASH_PATH} stroke="black" strokeWidth="5" strokeLinecap="round" />
      </mask>
      <g mask={`url(#${mask})`} stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        {RUPEE_PATHS.map((d) => <path key={d} d={d} />)}
      </g>
      <path d={SLASH_PATH} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ size = 28, className }: LogoMarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-fg', className)}>
      <LogoMark size={size} />
      <span className="leading-none font-semibold tracking-[-0.02em]" style={{ fontSize: size * 0.68 }}>SplitItt</span>
    </span>
  )
}
