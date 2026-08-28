import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { Expense, GroupMember } from '@/types'

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔', travel: '✈️', accommodation: '🏨',
  utilities: '💡', entertainment: '🎮', other: '📦',
}

const SPLIT_LABELS: Record<string, string> = {
  equal: 'Equal', percentage: 'By %', exact: 'Custom', itemized: 'Itemized',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

interface ExpenseCardProps {
  expense: Expense
  currentUserId: string
  members: GroupMember[]
  onClick: () => void
}

export function ExpenseCard({ expense, currentUserId, members, onClick }: ExpenseCardProps) {
  const memberMap = Object.fromEntries(members.map((m) => [m.user.id, m.user]))

  const payer = memberMap[expense.paid_by]
  const payerName = payer?.id === currentUserId ? 'You' : payer?.name ?? 'Someone'
  const payerPaid = expense.paid_by === currentUserId

  // Find current user's share
  const myAllSplits = expense.split_type === 'itemized'
    ? expense.items.flatMap((item) => item.splits.filter((s) => s.user_id === currentUserId))
    : expense.splits.filter((s) => s.user_id === currentUserId)

  const myShare = myAllSplits.reduce((sum, s) => sum + s.amount, 0)

  // Net impact: if I paid, I'm owed (total - myShare); if others paid, I owe myShare
  const netAmount = payerPaid ? expense.total_amount - myShare : myShare
  const netLabel = payerPaid ? 'you lent' : 'your share'
  const netPositive = payerPaid

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-200 px-4 py-3.5 hover:border-indigo-300 hover:shadow-sm transition-all duration-150 group"
    >
      <div className="flex items-center gap-3">
        {/* Category icon */}
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg shrink-0">
          {CATEGORY_ICONS[expense.category]}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
              {expense.title}
            </p>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
              {SPLIT_LABELS[expense.split_type]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            <span className={payerPaid ? 'text-indigo-600 font-medium' : ''}>
              {payerName} paid {formatCurrency(expense.total_amount, expense.currency_code)}
            </span>
            {' · '}
            {formatDate(expense.expense_date)}
          </p>
        </div>

        {/* Net amount */}
        {myShare > 0 || payerPaid ? (
          <div className="text-right shrink-0">
            <p className={cn(
              'text-sm font-bold',
              netPositive ? 'text-emerald-600' : 'text-red-500'
            )}>
              {netPositive ? '+' : '−'}{formatCurrency(netAmount, expense.currency_code)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{netLabel}</p>
          </div>
        ) : (
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-gray-400">
              {formatCurrency(expense.total_amount, expense.currency_code)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">not involved</p>
          </div>
        )}
      </div>
    </button>
  )
}
