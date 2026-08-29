import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, Edit2, Trash2, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useExpense, useUpdateExpense, useDeleteExpense, useExpenseHistory } from '@/hooks/useExpenses'
import { ExpenseComments } from '@/components/expenses/ExpenseComments'
import { useGroup } from '@/hooks/useGroups'
import { useAuthStore } from '@/store/auth'

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔', travel: '✈️', accommodation: '🏨',
  utilities: '💡', entertainment: '🎮', other: '📦',
}

const CATEGORIES = ['food', 'travel', 'accommodation', 'utilities', 'entertainment', 'other']

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirmModal({ onConfirm, onCancel, loading }: {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div
          className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl dark:shadow-black/50 border border-transparent dark:border-zinc-800 p-6"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100 text-center mb-1">Delete expense?</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 text-center mb-6">
            This will remove it from the group and recalculate all balances.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={loading} onClick={onConfirm}>Delete</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6 animate-pulse">
        <div className="h-8 w-24 bg-gray-100 dark:bg-zinc-800 rounded-lg mb-6" />
        <div className="h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl mb-4" />
        <div className="h-32 bg-gray-100 dark:bg-zinc-800 rounded-2xl mb-4" />
        <div className="h-40 bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
      </div>
    </AppShell>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExpenseDetailPage() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>()
  const navigate = useNavigate()
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')

  const [editing, setEditing] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editPaidBy, setEditPaidBy] = useState('')

  const { data: expense, isLoading } = useExpense(groupId!, expenseId!)
  const { data: group } = useGroup(groupId!)
  const { data: history = [] } = useExpenseHistory(groupId!, expenseId!)
  const update = useUpdateExpense(groupId!, expenseId!)
  const remove = useDeleteExpense(groupId!)

  if (isLoading) return <Skeleton />
  if (!expense) return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-gray-500 dark:text-zinc-400">Expense not found.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    </AppShell>
  )

  const members = group?.members ?? []
  const memberMap = Object.fromEntries(members.map((m) => [m.user.id, m.user]))

  const payer = memberMap[expense.paid_by]
  const payerName = payer?.id === currentUserId ? 'You' : payer?.name ?? 'Someone'

  // Net impact for current user
  const allSplits = expense.split_type === 'itemized'
    ? expense.items.flatMap((item) => item.splits)
    : expense.splits
  const myShare = allSplits
    .filter((s) => s.user_id === currentUserId)
    .reduce((sum, s) => sum + s.amount, 0)
  const iPaid = expense.paid_by === currentUserId
  const netAmount = iPaid ? expense.total_amount - myShare : myShare
  const netPositive = iPaid

  function startEdit() {
    setEditTitle(expense!.title)
    setEditCategory(expense!.category)
    setEditDate(expense!.expense_date)
    setEditPaidBy(expense!.paid_by)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
  }

  function saveEdit() {
    update.mutate(
      { title: editTitle, category: editCategory, expense_date: editDate, paid_by: editPaidBy },
      { onSuccess: () => setEditing(false) }
    )
  }

  function confirmDelete() {
    remove.mutate(expenseId!, {
      onSuccess: () => navigate(`/groups/${groupId}`),
    })
  }

  // Aggregate splits for display (itemized collapses to per-user totals)
  const splitsByUser: Record<string, number> = {}
  if (expense.split_type === 'itemized') {
    expense.items.forEach((item) =>
      item.splits.forEach((s) => {
        splitsByUser[s.user_id] = (splitsByUser[s.user_id] ?? 0) + s.amount
      })
    )
  } else {
    expense.splits.forEach((s) => {
      splitsByUser[s.user_id] = (splitsByUser[s.user_id] ?? 0) + s.amount
    })
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {!editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <Button size="sm" loading={update.isPending} onClick={saveEdit}>
                <Check className="w-3.5 h-3.5" />
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Header card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 mb-4">
          {editing ? (
            /* ── Edit mode ── */
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditCategory(cat)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors capitalize',
                        editCategory === cat
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                      )}
                    >
                      <span>{CATEGORY_ICONS[cat]}</span>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 block">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 block">Paid by</label>
                  <select
                    value={editPaidBy}
                    onChange={(e) => setEditPaidBy(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
                Splits cannot be changed after creation
              </p>
            </div>
          ) : (
            /* ── View mode ── */
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center text-2xl shrink-0">
                  {CATEGORY_ICONS[expense.category]}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100 leading-tight">{expense.title}</h1>
                  {expense.description && (
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{expense.description}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{formatDate(expense.expense_date)}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="text-center py-3 border-t border-b border-gray-100 dark:border-zinc-800 mb-4">
                <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
                  {formatCurrency(expense.total_amount, expense.currency_code)}
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 capitalize">
                  {expense.split_type} split · {expense.currency_code}
                </p>
              </div>

              {/* Paid by */}
              <div className="flex items-center gap-2.5">
                <Avatar name={payer?.name ?? '?'} src={payer?.avatar_url} size="sm" />
                <span className="text-sm text-gray-600 dark:text-zinc-300">
                  <span className="font-semibold text-gray-900 dark:text-zinc-100">{payerName}</span>
                  {' paid for everyone'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Your net impact */}
        {!editing && (myShare > 0 || iPaid) && (
          <div className={cn(
            'rounded-2xl px-5 py-4 mb-4',
            netPositive ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'
          )}>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-0.5">Your share</p>
            <p className={cn('text-2xl font-bold', netPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
              {netPositive ? '+' : '−'}{formatCurrency(netAmount, expense.currency_code)}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              {netPositive
                ? `You paid ${formatCurrency(expense.total_amount, expense.currency_code)}, your share is ${formatCurrency(myShare, expense.currency_code)}`
                : `Your share of the total`}
            </p>
          </div>
        )}

        {/* Split breakdown */}
        {!editing && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
              <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Split breakdown</p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-zinc-800">
              {Object.entries(splitsByUser).map(([userId, amount]) => {
                const user = memberMap[userId]
                const isMe = userId === currentUserId
                const isPayer = userId === expense.paid_by
                return (
                  <div key={userId} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={user?.name ?? '?'} src={user?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
                        {isMe ? 'You' : user?.name ?? '?'}
                        {isPayer && (
                          <span className="ml-2 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-full">
                            paid
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                      {formatCurrency(amount, expense.currency_code)}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Itemized items preview */}
            {expense.split_type === 'itemized' && expense.items.length > 0 && (
              <div className="border-t border-gray-100 dark:border-zinc-800 px-4 py-3 bg-gray-50 dark:bg-zinc-800/50">
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-2">Items</p>
                <div className="flex flex-col gap-1.5">
                  {expense.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 dark:text-zinc-300">{item.description}</p>
                      <p className="text-xs font-medium text-gray-700 dark:text-zinc-200">
                        {formatCurrency(item.amount, expense.currency_code)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit history */}
        {!editing && history.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">History</p>
              {showHistory
                ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-zinc-500" />}
            </button>
            {showHistory && (
              <div className="border-t border-gray-100 dark:border-zinc-800 divide-y divide-gray-50 dark:divide-zinc-800">
                {history.map((entry) => {
                  const who = memberMap[entry.changed_by]
                  return (
                    <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                      <Avatar name={who?.name ?? '?'} src={who?.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 dark:text-zinc-300">
                          <span className="font-medium">{who?.name ?? 'Someone'}</span>
                          {' '}
                          <span className="capitalize">{entry.action}</span>
                          {' this expense'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{formatDateTime(entry.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Comments */}
        {!editing && <ExpenseComments expenseId={expenseId!} />}
      </div>

      {showDelete && (
        <DeleteConfirmModal
          onConfirm={confirmDelete}
          onCancel={() => setShowDelete(false)}
          loading={remove.isPending}
        />
      )}
    </AppShell>
  )
}
