import { Avatar } from '@/components/common/Avatar'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { GroupMember } from '@/types'

interface EqualSplitEditorProps {
  members: GroupMember[]
  selectedIds: string[]
  totalAmount: number
  onChange: (ids: string[]) => void
}

export function EqualSplitEditor({ members, selectedIds, totalAmount, onChange }: EqualSplitEditorProps) {
  const active = members.filter((m) => m.is_active)
  const perPerson = selectedIds.length > 0 ? totalAmount / selectedIds.length : 0

  const toggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      if (selectedIds.length === 1) return // keep at least one
      onChange(selectedIds.filter((id) => id !== userId))
    } else {
      onChange([...selectedIds, userId])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {perPerson > 0 && (
        <p className="text-xs text-gray-500 mb-1">
          {formatCurrency(perPerson)} per person · {selectedIds.length} of {active.length} members
        </p>
      )}
      {active.map((m) => {
        const selected = selectedIds.includes(m.user.id)
        return (
          <button
            key={m.user.id}
            type="button"
            onClick={() => toggle(m.user.id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left',
              selected
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
              selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
            )}>
              {selected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <Avatar name={m.user.name} src={m.user.avatar_url} size="sm" />
            <span className={cn('flex-1 text-sm font-medium', selected ? 'text-gray-900' : 'text-gray-500')}>
              {m.user.name}
            </span>
            {selected && perPerson > 0 && (
              <span className="text-sm font-semibold text-indigo-700">
                {formatCurrency(perPerson)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
