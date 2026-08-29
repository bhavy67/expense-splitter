import { Avatar } from '@/components/common/Avatar'
import { cn } from '@/lib/utils'
import type { GroupMember } from '@/types'

interface PercentageSplitEditorProps {
  members: GroupMember[]
  percentages: Record<string, number>
  onChange: (percentages: Record<string, number>) => void
}

export function PercentageSplitEditor({ members, percentages, onChange }: PercentageSplitEditorProps) {
  const active = members.filter((m) => m.is_active)
  const total = Object.values(percentages).reduce((s, v) => s + (v || 0), 0)
  const remaining = Math.round((100 - total) * 100) / 100
  const isValid = Math.abs(remaining) < 0.01

  const update = (userId: string, value: string) => {
    const num = parseFloat(value) || 0
    onChange({ ...percentages, [userId]: num })
  }

  const distributeRemaining = () => {
    const perMember = Math.round((100 / active.length) * 100) / 100
    const newPcts: Record<string, number> = {}
    active.forEach((m, i) => {
      newPcts[m.user.id] = i === active.length - 1
        ? Math.round((100 - perMember * (active.length - 1)) * 100) / 100
        : perMember
    })
    onChange(newPcts)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Running total bar */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden mr-3">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-200',
              isValid ? 'bg-emerald-500' : total > 100 ? 'bg-red-500' : 'bg-indigo-500'
            )}
            style={{ width: `${Math.min(total, 100)}%` }}
          />
        </div>
        <span className={cn('text-xs font-semibold shrink-0', isValid ? 'text-emerald-600 dark:text-emerald-400' : total > 100 ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-zinc-300')}>
          {total.toFixed(0)}%
        </span>
      </div>

      {!isValid && (
        <div className="flex items-center justify-between">
          <p className={cn('text-xs', remaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400')}>
            {remaining > 0 ? `${remaining.toFixed(1)}% unassigned` : `${Math.abs(remaining).toFixed(1)}% over 100%`}
          </p>
          {remaining > 0 && (
            <button type="button" onClick={distributeRemaining} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Distribute equally
            </button>
          )}
        </div>
      )}

      {active.map((m) => (
        <div key={m.user.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <Avatar name={m.user.name} src={m.user.avatar_url} size="sm" />
          <span className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200">{m.user.name}</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={percentages[m.user.id] ?? 0}
              onChange={(e) => update(m.user.id, e.target.value)}
              className="w-16 h-8 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-center text-sm font-semibold text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-400 dark:text-zinc-500 w-4">%</span>
          </div>
        </div>
      ))}
    </div>
  )
}
