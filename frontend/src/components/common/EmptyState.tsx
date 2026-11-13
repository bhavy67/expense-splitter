import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="mb-5 flex size-16 items-center justify-center rounded-lg bg-surface-subtle text-fg [&_svg]:size-7 [&_svg]:stroke-[1.75]">
          {icon}
        </div>
      )}
      <h3 className="text-title text-fg">{title}</h3>
      {description && <p className="mt-2 max-w-xs text-body text-fg-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
