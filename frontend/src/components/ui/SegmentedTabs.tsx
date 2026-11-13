import { useRef } from 'react'
import { cn } from '@/lib/utils'

// Two primitives, one look: SegmentedTabs switches panels (tablist/tab/tabpanel);
// SegmentedControl picks a value (radiogroup/radio). See DESIGN.md.

interface Segment<T extends string> {
  id: T
  label: React.ReactNode
}

interface SegmentsProps<T extends string> {
  segments: Segment<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  className?: string
  kind: 'tabs' | 'radio'
  /** tabs only: id prefix shared with <TabPanel tabsId> */
  id?: string
}

function Segments<T extends string>({ segments, value, onChange, label, className, kind, id }: SegmentsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = Math.max(0, segments.findIndex((t) => t.id === value))
  const tabs = kind === 'tabs'

  function onKeyDown(e: React.KeyboardEvent) {
    const last = segments.length - 1
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    onChange(segments[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div
      role={tabs ? 'tablist' : 'radiogroup'}
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('relative grid auto-cols-fr grid-flow-col rounded-md bg-surface-subtle p-1', className)}
    >
      {/* Sliding pill: segments are equal width, so translateX(index × 100%) lines it up. */}
      <div className="pointer-events-none absolute inset-1" aria-hidden>
        <div
          className="h-full rounded-sm border border-border bg-surface transition-transform duration-200 ease-out"
          style={{ width: `${100 / segments.length}%`, transform: `translateX(${index * 100}%)` }}
        />
      </div>
      {segments.map((t, i) => {
        const selected = t.id === value
        return (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el }}
            type="button"
            role={tabs ? 'tab' : 'radio'}
            {...(tabs
              ? { id: `${id}-tab-${t.id}`, 'aria-selected': selected, 'aria-controls': selected ? `${id}-panel-${t.id}` : undefined }
              : { 'aria-checked': selected })}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              'relative h-10 min-w-0 truncate rounded-sm px-2 text-body-sm transition-colors duration-[120ms]',
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

interface SegmentedTabsProps<T extends string> {
  /** Unique prefix for tab/panel ids; pass the same value to <TabPanel tabsId>. */
  id: string
  tabs: Segment<T>[]
  value: T
  onChange: (id: T) => void
  'aria-label': string
  className?: string
}

export function SegmentedTabs<T extends string>({ id, tabs, value, onChange, 'aria-label': label, className }: SegmentedTabsProps<T>) {
  return <Segments kind="tabs" id={id} segments={tabs} value={value} onChange={onChange} label={label} className={className} />
}

interface SegmentedControlProps<T extends string> {
  options: Segment<T>[]
  value: T
  onChange: (id: T) => void
  'aria-label': string
  className?: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, 'aria-label': label, className }: SegmentedControlProps<T>) {
  return <Segments kind="radio" segments={options} value={value} onChange={onChange} label={label} className={className} />
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
