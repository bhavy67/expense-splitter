import { cn } from '@/lib/utils'

interface StickyActionBarProps {
  /** Optional summary on the left, e.g. "₹1,240 · split 4 ways". */
  summary?: React.ReactNode
  /** The primary action (usually one full-width Button). */
  children: React.ReactNode
  className?: string
}

// Fixed bottom CTA bar. It extends behind BottomNav and pads its content above it via
// --bottom-nav-h, which AppShell sets (0 when the nav is hidden); --sidebar-w keeps it
// clear of the desktop sidebar. Pages using this need
// bottom padding equal to the bar height so it never covers the last input.
export function StickyActionBar({ summary, children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn('fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 backdrop-blur', className)}
      style={{ left: 'var(--sidebar-w, 0px)', paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        {summary && <div className="min-w-0 shrink text-body-sm text-fg-muted">{summary}</div>}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
