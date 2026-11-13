import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const button = cva(
  'inline-flex items-center justify-center gap-2 shrink-0 font-medium rounded-md select-none transition-[background-color,transform,opacity] duration-[120ms] ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
  {
    variants: {
      variant: {
        primary: 'bg-inverse-bg text-inverse-fg hover:opacity-90',
        secondary: 'bg-surface text-fg border border-border-strong hover:bg-surface-subtle',
        ghost: 'bg-transparent text-fg hover:bg-surface-subtle',
        // Monochrome for now: wording, icon and ConfirmModal carry the meaning.
        danger: 'bg-surface text-negative border border-border-strong hover:bg-surface-subtle',
      },
      size: {
        sm: 'h-9 px-3 text-body-sm',
        md: 'h-11 px-4 text-body',
        lg: 'h-13 px-5 text-body',
        icon: 'size-11 p-0',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, fullWidth, loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(button({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
