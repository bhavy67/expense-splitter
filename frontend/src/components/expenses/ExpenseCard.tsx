import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
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
  groupCurrency?: string
}

export function ExpenseCard({ expense, members, groupId, groupCurrency }: Props) {
  const payer = members.find((m) => m.id === expense.paidBy)

  return (
    <Link
      to={`/g/${groupId}/expenses/${expense.id}`}
      className="flex items-center gap-3 bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] p-3.5 shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#b9f542] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all duration-100 group"
    >
      <div className="w-9 h-9 rounded bg-[#0a0a0a] dark:bg-[#1a1a17] border border-[#0a0a0a] dark:border-[#f0ede5]/30 flex items-center justify-center text-lg shrink-0">
        {CATEGORY_EMOJIS[expense.category] ?? '📦'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#0a0a0a] dark:text-[#f0ede5] truncate group-hover:text-[#88bc20] transition-colors">
          {expense.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {payer && (
            <>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: payer.color }} />
              <span className="text-xs font-medium text-[#4a4940] dark:text-[#c8bfb0]">{payer.name}</span>
              <span className="text-[#a09880] dark:text-[#606060]">·</span>
            </>
          )}
          <span className="text-xs font-medium text-[#4a4940] dark:text-[#c8bfb0]">{fmtDate(expense.date)}</span>
          {expense.receiptImage && (
            <>
              <span className="text-[#a09880] dark:text-[#606060]">·</span>
              <Camera className="w-2.5 h-2.5 text-[#4a4940] dark:text-[#a09880]" />
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[13px] font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5]">
          {formatCurrency(expense.amount, groupCurrency ?? expense.currency)}
        </p>
        {expense.splitType === 'itemized' && expense.items?.length ? (
          <p className="text-[10px] font-mono font-medium text-[#4a4940] dark:text-[#a09880] mt-0.5 uppercase tracking-wider">
            {expense.items.length} item{expense.items.length !== 1 ? 's' : ''}
          </p>
        ) : (
          <p className="text-[10px] font-mono font-medium text-[#4a4940] dark:text-[#a09880] mt-0.5 uppercase tracking-wider">
            {SPLIT_LABELS[expense.splitType] ?? expense.splitType}
          </p>
        )}
      </div>
    </Link>
  )
}
