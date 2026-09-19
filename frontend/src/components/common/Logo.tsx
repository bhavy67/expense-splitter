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
      {/* ₹ centered — electric lime in dark, deep olive in light (contrast-safe) */}
      <text
        x="16"
        y="24"
        textAnchor="middle"
        fontFamily="'DM Sans', 'Arial', sans-serif"
        fontWeight="900"
        fontSize="22"
        className="fill-[#4d6e08] dark:fill-[#b9f542]"
      >
        ₹
      </text>

      {/* 45° slash through center — cuts the ₹; near-black in light, cream in dark */}
      <line
        x1="29"
        y1="3"
        x2="3"
        y2="29"
        strokeWidth="3"
        strokeLinecap="round"
        className="stroke-[#0a0a0a] dark:stroke-[#f0ede5]"
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
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <span
        className={cn(
          'font-black uppercase tracking-[0.04em] leading-none',
          light
            ? 'text-[#f0ede5]'
            : 'text-[#0a0a0a] dark:text-[#f0ede5]',
          wordmarkClassName
        )}
        style={{ fontSize: size * 0.6 }}
      >
        Split<span className={light ? 'text-[#b9f542]' : 'text-[#4d6e08] dark:text-[#b9f542]'}>Itt</span>
      </span>
    </span>
  )
}
