import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

// Toggle pill. 36px visual; the ::after extends the hit area to 44px.
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(({ selected = false, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-pressed={selected}
    className={cn(
      'relative inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-caption transition-[background-color,transform] duration-[120ms] ease-out active:scale-[0.97] disabled:opacity-50 [&_svg]:size-4 after:absolute after:inset-x-0 after:-inset-y-1',
      selected
        ? 'bg-inverse-bg text-inverse-fg'
        : 'border border-border bg-surface text-fg hover:bg-surface-subtle',
      className
    )}
    {...props}
  />
))
Chip.displayName = 'Chip'

interface ChipGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  'aria-label': string
}

export function ChipGroup({ className, ...props }: ChipGroupProps) {
  return (
    <div
      role="group"
      className={cn('-mx-4 flex gap-2 overflow-x-auto px-4 py-1 scrollbar-none', className)}
      {...props}
    />
  )
}
