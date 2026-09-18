import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Settings, Plus, Users, Receipt, Scale, UserPlus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { ExpenseCard } from '@/components/expenses/ExpenseCard'
import { useGroup, useExpenses } from '@/hooks/useStore'
import { formatCurrency } from '@/lib/currency'
import { getTotalExpenses } from '@/lib/calculations'
import { cn } from '@/lib/utils'

type Tab = 'expenses' | 'balances'

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const group = useGroup(groupId!)
  const expenses = useExpenses(groupId!)
  const [tab, setTab] = useState<Tab>('expenses')

  if (!group) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen text-gray-500 dark:text-zinc-500">
          Group not found
        </div>
      </AppShell>
    )
  }

  const total = getTotalExpenses(expenses)

  return (
    <AppShell>
      <TopBar
        title={group.name}
        showBack
        actions={
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/g/${groupId}/expenses/new`)}
              className="p-1.5 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
              title="Add expense"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(`/g/${groupId}/settings`)}
              className="p-1.5 rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{group.name}</h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                {total > 0 && ` · ${formatCurrency(total, group.currency)} total`}
                {' · '}{group.currency}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate(`/g/${groupId}/settings`)}>
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Button>
              <Button size="sm" onClick={() => navigate(`/g/${groupId}/expenses/new`)}>
                <Plus className="w-3.5 h-3.5" />
                Add expense
              </Button>
            </div>
          </div>

          {/* Members strip */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                  Members
                </span>
                <span className="text-xs text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                  {group.members.length}
                </span>
              </div>
              <button
                onClick={() => navigate(`/g/${groupId}/settings`)}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                <UserPlus className="w-3 h-3" />
                Manage
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-xl px-3 py-1.5"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                    style={{ background: m.color }}
                  >
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-800 dark:text-zinc-200">{m.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl mb-4">
            {([
              { id: 'expenses', label: 'Expenses', icon: Receipt },
              { id: 'balances', label: 'Balances',  icon: Scale },
            ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-all',
                  tab === id
                    ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Expenses */}
          {tab === 'expenses' && (
            expenses.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto mb-3 text-2xl">
                  💸
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">No expenses yet</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">
                  Add your first expense to start splitting
                </p>
                <Button size="sm" onClick={() => navigate(`/g/${groupId}/expenses/new`)}>
                  <Plus className="w-3.5 h-3.5" />
                  Add expense
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {expenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    members={group.members}
                    groupId={groupId!}
                  />
                ))}
              </div>
            )
          )}

          {/* Tab: Balances */}
          {tab === 'balances' && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3 text-2xl">
                ⚖️
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                {expenses.length === 0 ? 'No expenses yet' : 'Balances & settlements'}
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">
                {expenses.length === 0
                  ? 'Add expenses first to see who owes what'
                  : 'Debt simplification and settlement tracking is coming in Phase 4'}
              </p>
            </div>
          )}
        </div>
      </PageTransition>

      {/* Mobile FAB */}
      <button
        onClick={() => navigate(`/g/${groupId}/expenses/new`)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/30 transition-transform active:scale-95 z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </AppShell>
  )
}
