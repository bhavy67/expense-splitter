import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ListRowProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  leading?: React.ReactNode // Avatar or IconTile
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode // Money + meta
  chevron?: boolean
  divider?: boolean
  /** Render as a link or button, e.g. `as={Link} to="…"`. */
  as?: React.ElementType
  [prop: string]: unknown
}

export function ListRow({
  leading, title, subtitle, trailing, chevron, divider, as: Comp = 'div', className, ...props
}: ListRowProps) {
  const interactive = Comp !== 'div'
  return (
    <Comp
      className={cn(
        'flex w-full min-h-14 items-center gap-3 px-4 py-3 text-left text-fg',
        divider && 'border-b border-border last:border-b-0',
        interactive && 'transition-colors duration-[120ms] hover:bg-surface-subtle',
        className
      )}
      {...props}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-body font-medium">{title}</div>
        {subtitle && <div className="truncate text-body-sm text-fg-muted">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
      {chevron && <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />}
    </Comp>
  )
}
