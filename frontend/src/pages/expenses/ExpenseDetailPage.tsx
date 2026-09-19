import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroup } from '@/hooks/useStore'
import { getExpense, deleteExpense } from '@/lib/storage'
import { formatCurrency } from '@/lib/currency'
import { toast } from '@/components/common/Toast'
import { CATEGORY_EMOJIS } from '@/components/expenses/ExpenseCard'
import type { Member } from '@/types'

const SPLIT_LABELS: Record<string, string> = {
  equal: 'Split equally',
  shares: 'Split by shares',
  percentage: 'Split by percentage',
  exact: 'Exact amounts',
  itemized: 'Itemized split',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function MemberDot({ member }: { member: Member }) {
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
      style={{ background: member.color }}
    >
      {member.name[0]?.toUpperCase()}
    </div>
  )
}

export default function ExpenseDetailPage() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>()
  const navigate = useNavigate()
  const group = useGroup(groupId!)
  const [showReceipt, setShowReceipt] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!group) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[100dvh] text-[#4a4940] dark:text-[#a09880]">
          Group not found
        </div>
      </AppShell>
    )
  }

  const expense = getExpense(groupId!, expenseId!)

  if (!expense) {
    return (
      <AppShell>
        <TopBar title="Expense" showBack />
        <div className="flex items-center justify-center min-h-[100dvh] text-[#4a4940] dark:text-[#a09880]">
          Expense not found
        </div>
      </AppShell>
    )
  }

  const payer = group.members.find((m) => m.id === expense.paidBy)
  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]))

  function handleDelete() {
    deleteExpense(groupId!, expenseId!)
    toast.success('Expense deleted')
    navigate(`/g/${groupId}`, { replace: true })
  }

  return (
    <AppShell>
      <TopBar
        title={expense.title}
        showBack
        actions={
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/g/${groupId}/expenses/new?edit=${expenseId}`)}
              className="p-1.5 rounded text-[#b9f542] hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
              title="Edit expense"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded text-[#ff5c3d] hover:bg-[#ff5c3d]/10 transition-colors"
              title="Delete expense"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* Hero card */}
          <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542] p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded bg-[#0a0a0a] dark:bg-[#1a1a17] border-2 border-[#0a0a0a] dark:border-[#f0ede5]/30 flex items-center justify-center text-3xl shrink-0">
                {CATEGORY_EMOJIS[expense.category] ?? '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black uppercase tracking-[0.02em] text-[#0a0a0a] dark:text-[#f0ede5] truncate">
                  {expense.title}
                </h1>
                <p className="text-xs font-medium text-[#4a4940] dark:text-[#a09880] mt-0.5">
                  {fmtDate(expense.date)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-mono font-bold text-[#0a0a0a] dark:text-[#f0ede5]">
                  {formatCurrency(expense.amount, expense.currency)}
                </p>
                <p className="text-[10px] font-mono font-medium uppercase text-[#4a4940] dark:text-[#a09880] mt-0.5">
                  {expense.currency}
                </p>
              </div>
            </div>

            {/* Exchange rate badge */}
            {expense.exchangeRate && expense.currency !== group.currency && (
              <div className="flex items-center gap-2 mt-3 px-2 py-1.5 bg-[#f0ede5] dark:bg-[#1a1a17] border border-[#0a0a0a] dark:border-[#f0ede5]/30 rounded self-start">
                <span className="text-[10px] font-mono text-[#0a0a0a] dark:text-[#f0ede5]">
                  {(expense.amount / expense.exchangeRate).toFixed(2)} {expense.currency} × {expense.exchangeRate} = {group.currency}
                </span>
              </div>
            )}

            {/* Paid by */}
            {payer && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t-2 border-[#0a0a0a]/10 dark:border-[#f0ede5]/10">
                <span className="text-xs font-medium uppercase tracking-wide text-[#4a4940] dark:text-[#a09880]">Paid by</span>
                <MemberDot member={payer} />
                <span className="text-sm font-medium text-[#0a0a0a] dark:text-[#f0ede5]">{payer.name}</span>
              </div>
            )}
          </div>

          {/* Split breakdown */}
          <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542] overflow-hidden">
            <div className="bg-[#0a0a0a] dark:bg-[#1a1a17] px-4 py-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#f0ede5]">
                {SPLIT_LABELS[expense.splitType] ?? expense.splitType}
              </p>
            </div>

            {expense.splitType === 'itemized' && expense.items?.length ? (
              <div>
                {expense.items.map((item) => (
                  <div key={item.id} className="px-4 py-3 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 last:border-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-[#0a0a0a] dark:text-[#f0ede5]">{item.name}</span>
                      <span className="text-[13px] font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5]">
                        {formatCurrency(item.amount, expense.currency)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.splits.map((s) => {
                        const m = memberMap[s.memberId]
                        if (!m) return null
                        return (
                          <div key={s.memberId} className="flex items-center gap-1 bg-[#f0ede5] dark:bg-[#1a1a17] border border-[#0a0a0a] dark:border-[#f0ede5]/30 rounded px-2 py-0.5">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: m.color }} />
                            <span className="text-[10px] font-medium text-[#4a4940] dark:text-[#a09880]">{m.name}</span>
                            <span className="text-[10px] font-medium text-[#0a0a0a] dark:text-[#f0ede5] ml-1">
                              {formatCurrency(s.amount, expense.currency)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {expense.splits.map((split) => {
                  const m = memberMap[split.memberId]
                  if (!m) return null
                  const pct = split.percentage != null
                    ? split.percentage
                    : Math.round((split.amount / expense.amount) * 10000) / 100
                  const shares = split.shares
                  return (
                    <div
                      key={split.memberId}
                      className="flex items-center gap-3 px-4 py-3 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 last:border-0"
                    >
                      <MemberDot member={m} />
                      <span className="flex-1 text-sm text-[#0a0a0a] dark:text-[#f0ede5]">{m.name}</span>
                      {shares != null && (
                        <span className="text-xs font-medium text-[#4a4940] dark:text-[#a09880] mr-2">
                          {shares} share{shares !== 1 ? 's' : ''}
                        </span>
                      )}
                      {expense.splitType !== 'exact' && expense.splitType !== 'shares' && (
                        <span className="text-xs font-medium text-[#4a4940] dark:text-[#a09880] mr-2">
                          {pct.toFixed(1)}%
                        </span>
                      )}
                      <span className="text-[13px] font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5]">
                        {formatCurrency(split.amount, expense.currency)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#4a4940] dark:text-[#a09880] mb-2">Notes</p>
              <p className="text-[13px] text-[#0a0a0a] dark:text-[#f0ede5] whitespace-pre-wrap">{expense.notes}</p>
            </div>
          )}

          {/* Receipt */}
          {expense.receiptImage && (
            <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542] overflow-hidden">
              <button
                onClick={() => setShowReceipt((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-[12px] font-mono font-bold uppercase tracking-[0.08em] text-[#0a0a0a] dark:text-[#f0ede5] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] transition-colors"
              >
                <span>Receipt photo</span>
                {showReceipt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showReceipt && (
                <img
                  src={expense.receiptImage}
                  alt="Receipt"
                  className="w-full object-contain max-h-96 border-t-2 border-[#0a0a0a]/10 dark:border-[#f0ede5]/10"
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => navigate(`/g/${groupId}/expenses/new?edit=${expenseId}`)}
            >
              <Edit2 className="w-4 h-4" />
              Edit expense
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>

        </div>
      </PageTransition>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete "${expense.title}"?`}
          description="All split data will be lost and balances will be recalculated. This cannot be undone."
          confirmLabel="Delete expense"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </AppShell>
  )
}
