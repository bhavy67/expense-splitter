import { Avatar } from '@/components/common/Avatar'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { GroupMember } from '@/types'

interface ExactSplitEditorProps {
  members: GroupMember[]
  amounts: Record<string, number>
  totalAmount: number
  onChange: (amounts: Record<string, number>) => void
}

export function ExactSplitEditor({ members, amounts, totalAmount, onChange }: ExactSplitEditorProps) {
  const active = members.filter((m) => m.is_active)
  const assigned = Object.values(amounts).reduce((s, v) => s + (v || 0), 0)
  const remaining = Math.round((totalAmount - assigned) * 100) / 100
  const isValid = Math.abs(remaining) < 0.01

  const update = (userId: string, value: string) => {
    const num = parseFloat(value) || 0
    onChange({ ...amounts, [userId]: Math.round(num * 100) / 100 })
  }

  const splitRemaining = () => {
    // Evenly distribute remaining amount among members with 0
    const zeroMembers = active.filter((m) => !amounts[m.user.id])
    if (!zeroMembers.length) return
    const perMember = Math.round((remaining / zeroMembers.length) * 100) / 100
    const newAmts = { ...amounts }
    zeroMembers.forEach((m, i) => {
      newAmts[m.user.id] = i === zeroMembers.length - 1
        ? Math.round((remaining - perMember * (zeroMembers.length - 1)) * 100) / 100
        : perMember
    })
    onChange(newAmts)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Remaining indicator */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-3">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-200',
              isValid ? 'bg-emerald-500' : assigned > totalAmount ? 'bg-red-500' : 'bg-indigo-500'
            )}
            style={{ width: `${Math.min((assigned / totalAmount) * 100, 100)}%` }}
          />
        </div>
        <span className={cn('text-xs font-semibold shrink-0', isValid ? 'text-emerald-600' : remaining < 0 ? 'text-red-500' : 'text-gray-600')}>
          {isValid ? 'Perfect ✓' : remaining > 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
        </span>
      </div>

      {!isValid && remaining > 0 && (
        <div className="flex justify-end">
          <button type="button" onClick={splitRemaining} className="text-xs font-medium text-indigo-600 hover:underline">
            Split remaining equally
          </button>
        </div>
      )}

      {active.map((m) => (
        <div key={m.user.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 bg-white">
          <Avatar name={m.user.name} src={m.user.avatar_url} size="sm" />
          <span className="flex-1 text-sm font-medium text-gray-800">{m.user.name}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-400">₹</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amounts[m.user.id] ?? ''}
              placeholder="0"
              onChange={(e) => update(m.user.id, e.target.value)}
              className="w-24 h-8 rounded-lg border border-gray-300 text-right pr-2 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
