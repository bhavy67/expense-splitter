import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[#b9f542] text-[#0a0a0a] border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#0a0a0a]',
  secondary:
    'bg-white dark:bg-[#1e1e1a] text-[#0a0a0a] dark:text-[#f0ede5] border-2 border-[#0a0a0a] dark:border-[#f0ede5] shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50',
  ghost:
    'bg-transparent text-[#0a0a0a] dark:text-[#f0ede5] border-2 border-transparent hover:border-[#0a0a0a] dark:hover:border-[#f0ede5] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] disabled:opacity-50',
  danger:
    'bg-[#ff5c3d] text-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[11px] rounded gap-1.5',
  md: 'h-10 px-4 text-[12px] rounded gap-2',
  lg: 'h-12 px-5 text-[13px] rounded gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-bold uppercase tracking-[0.06em] transition-all duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9f542] focus-visible:ring-offset-2 disabled:cursor-not-allowed select-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
