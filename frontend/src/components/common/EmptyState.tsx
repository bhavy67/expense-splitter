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
        <div className="w-14 h-14 rounded bg-[#f0ede5] dark:bg-[#1a1a17] border-2 border-[#0a0a0a] dark:border-[#f0ede5] flex items-center justify-center mb-5 text-[#0a0a0a] dark:text-[#f0ede5] shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542]">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-black uppercase tracking-[0.06em] text-[#0a0a0a] dark:text-[#f0ede5]">{title}</h3>
      {description && (
        <p className="text-sm text-[#4a4940] dark:text-[#c8bfb0] mt-2 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
