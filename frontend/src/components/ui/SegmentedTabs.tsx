import { useRef } from 'react'
import { cn } from '@/lib/utils'

// Panel switching only (tablist/tab/tabpanel). For picking a value (Phase 3 split
// mode) build a SegmentedControl with role="radiogroup" instead — see DESIGN.md.

interface Tab<T extends string> {
  id: T
  label: React.ReactNode
}

interface SegmentedTabsProps<T extends string> {
  /** Unique prefix for tab/panel ids; pass the same value to <TabPanel tabsId>. */
  id: string
  tabs: Tab<T>[]
  value: T
  onChange: (id: T) => void
  'aria-label': string
  className?: string
}

export function SegmentedTabs<T extends string>({
  id, tabs, value, onChange, 'aria-label': label, className,
}: SegmentedTabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = Math.max(0, tabs.findIndex((t) => t.id === value))

  function onKeyDown(e: React.KeyboardEvent) {
    const last = tabs.length - 1
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('relative grid auto-cols-fr grid-flow-col rounded-md bg-surface-subtle p-1', className)}
    >
      {/* Sliding pill: segments are equal width, so translateX(index × 100%) lines it up. */}
      <div className="pointer-events-none absolute inset-1" aria-hidden>
        <div
          className="h-full rounded-sm border border-border bg-surface transition-transform duration-200 ease-out"
          style={{ width: `${100 / tabs.length}%`, transform: `translateX(${index * 100}%)` }}
        />
      </div>
      {tabs.map((t, i) => {
        const selected = t.id === value
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el }}
            type="button"
            role="tab"
            id={`${id}-tab-${t.id}`}
            aria-selected={selected}
            aria-controls={selected ? `${id}-panel-${t.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              'relative h-10 rounded-sm px-3 text-body-sm transition-colors duration-[120ms]',
              selected ? 'font-medium text-fg' : 'text-fg-muted hover:text-fg'
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

interface TabPanelProps {
  tabsId: string
  value: string
  children: React.ReactNode
  className?: string
}

export function TabPanel({ tabsId, value, children, className }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`${tabsId}-panel-${value}`}
      aria-labelledby={`${tabsId}-tab-${value}`}
      tabIndex={0}
      className={cn('focus-visible:outline-offset-4', className)}
    >
      {children}
    </div>
  )
}
