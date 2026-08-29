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
    'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 active:from-indigo-700 active:to-indigo-800 disabled:from-indigo-300 disabled:to-indigo-300 shadow-sm shadow-indigo-900/15',
  secondary:
    'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 active:bg-gray-100 dark:active:bg-zinc-600 disabled:opacity-50 shadow-sm',
  ghost:
    'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 active:bg-gray-200 dark:active:bg-zinc-700 disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50 shadow-sm',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed select-none',
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
