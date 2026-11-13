import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string
}

// 44×44 hit area, 40×40 visual circle inside it.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'group inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      <span className="flex size-10 items-center justify-center rounded-full transition-[background-color,transform] duration-[120ms] ease-out group-hover:bg-surface-subtle group-active:scale-95 [&_svg]:size-5">
        {children}
      </span>
    </button>
  )
)

IconButton.displayName = 'IconButton'
