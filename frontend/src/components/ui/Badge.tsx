import { cn } from '@/lib/utils'

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex h-[22px] items-center gap-1 rounded-full bg-surface-muted px-2 text-caption text-fg-muted', className)}
      {...props}
    />
  )
}
