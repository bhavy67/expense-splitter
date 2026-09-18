import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/currency'
import type { Expense, Member } from '@/types'

export const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍔', travel: '✈️', accommodation: '🏨', utilities: '⚡',
  entertainment: '🎭', shopping: '🛍️', medical: '💊', other: '📦',
}

const SPLIT_LABELS: Record<string, string> = {
  equal: 'equally', shares: 'by shares', percentage: 'by %',
  exact: 'exact', itemized: 'itemized',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

interface Props {
  expense: Expense
  members: Member[]
  groupId: string
}

export function ExpenseCard({ expense, members, groupId }: Props) {
  const payer = members.find((m) => m.id === expense.paidBy)

  return (
    <Link
      to={`/g/${groupId}/expenses/${expense.id}`}
      className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center text-xl shrink-0">
        {CATEGORY_EMOJIS[expense.category] ?? '📦'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
          {expense.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {payer && (
            <>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: payer.color }} />
              <span className="text-xs text-gray-400 dark:text-zinc-500">{payer.name}</span>
              <span className="text-xs text-gray-300 dark:text-zinc-600">·</span>
            </>
          )}
          <span className="text-xs text-gray-400 dark:text-zinc-500">{fmtDate(expense.date)}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
          {formatCurrency(expense.amount, expense.currency)}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
          {SPLIT_LABELS[expense.splitType] ?? expense.splitType}
        </p>
      </div>
    </Link>
  )
}
