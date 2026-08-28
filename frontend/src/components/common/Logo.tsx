import { cn } from '@/lib/utils'

interface LogoMarkProps {
  size?: number
  className?: string
}

/**
 * The SplitItt mark: a rounded square cut on a diagonal into two jade
 * tones — the "split" is the shape itself, not just a decorative crop.
 * Kept to two flat fills + one hairline seam so it stays legible all the
 * way down to a 16px browser-tab favicon.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="splititt-logo-clip">
          <rect x="2" y="2" width="28" height="28" rx="8" />
        </clipPath>
      </defs>
      <g clipPath="url(#splititt-logo-clip)">
        <rect x="2" y="2" width="28" height="28" fill="var(--color-indigo-800)" />
        <path
          d="M2 9 L23 30 L2 30 Z"
          fill="var(--color-indigo-400)"
          stroke="white"
          strokeWidth="1"
        />
      </g>
    </svg>
  )
}

interface LogoProps extends LogoMarkProps {
  wordmarkClassName?: string
}

/** Icon + wordmark lockup, used in the app shell and auth screens. */
export function Logo({ size = 28, className, wordmarkClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      <span
        className={cn('font-extrabold text-gray-900 tracking-tight leading-none', wordmarkClassName)}
        style={{ fontSize: size * 0.62 }}
      >
        Split<span className="text-indigo-700">Itt</span>
      </span>
    </span>
  )
}
