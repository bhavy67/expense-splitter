import { cn } from '@/lib/utils'

interface LogoMarkProps {
  size?: number
  className?: string
}

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
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#128a5c" />
      <path
        d="M10.5 24.5 L21.5 7.5"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface LogoProps extends LogoMarkProps {
  wordmarkClassName?: string
  light?: boolean
}

export function Logo({ size = 28, className, wordmarkClassName, light }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      <span
        className={cn(
          'font-extrabold tracking-tight leading-none',
          light
            ? 'text-white'
            : 'text-gray-900 dark:text-zinc-100',
          wordmarkClassName
        )}
        style={{ fontSize: size * 0.62 }}
      >
        Split<span className={light ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}>Itt</span>
      </span>
    </span>
  )
}
