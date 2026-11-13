import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: React.ReactNode
  count?: number
  action?: React.ReactNode // e.g. <Button variant="ghost" size="sm">See all</Button>
  as?: 'h2' | 'h3'
  className?: string
}

export function SectionHeader({ title, count, action, as: H = 'h2', className }: SectionHeaderProps) {
  return (
    <div className={cn('flex min-h-11 items-center justify-between gap-3', className)}>
      <H className="text-title text-fg">
        {title}
        {count !== undefined && <span className="ml-2 font-normal tabular-nums text-fg-subtle">{count}</span>}
      </H>
      {action}
    </div>
  )
}
