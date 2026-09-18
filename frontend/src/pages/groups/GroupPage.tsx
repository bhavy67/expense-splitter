import { useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Settings, Plus, Users, Receipt, Scale, UserPlus, BarChart2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { ExpenseCard } from '@/components/expenses/ExpenseCard'
import { BalancesTab } from '@/components/groups/BalancesTab'
import { useGroup, useExpenses, usePayments } from '@/hooks/useStore'

const AnalyticsTab = lazy(() => import('@/components/groups/AnalyticsTab'))
import { formatCurrency } from '@/lib/currency'
import { getTotalExpenses } from '@/lib/calculations'
import { cn } from '@/lib/utils'

type Tab = 'expenses' | 'balances' | 'stats'

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const group = useGroup(groupId!)
  const expenses = useExpenses(groupId!)
  const payments = usePayments(groupId!)
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
              className="p-1.5 rounded text-[#b9f542] hover:bg-white/10 transition-colors"
              title="Add expense"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(`/g/${groupId}/settings`)}
              className="p-1.5 rounded text-[#f0ede5]/60 hover:text-[#f0ede5] hover:bg-white/10 transition-colors"
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
              <h1 className="text-xl font-black uppercase tracking-[0.04em] text-[#0a0a0a] dark:text-[#f0ede5]">{group.name}</h1>
              <p className="text-[11px] font-mono text-[#4a4940] dark:text-[#a09880] mt-0.5 uppercase tracking-wider">
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
          <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4a4940] dark:text-[#a09880]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880]">
                  Members
                </span>
                <span className="text-[9px] font-mono bg-[#f0ede5] dark:bg-[#1a1a17] border border-[#0a0a0a] dark:border-[#f0ede5]/30 px-1.5 py-0.5 rounded">
                  {group.members.length}
                </span>
              </div>
              <button
                onClick={() => navigate(`/g/${groupId}/settings`)}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#88bc20] hover:text-[#6b9418] transition-colors"
              >
                <UserPlus className="w-3 h-3" />
                Manage
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 bg-[#f0ede5] dark:bg-[#1a1a17] border border-[#0a0a0a] dark:border-[#f0ede5]/20 rounded px-2.5 py-1.5"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                    style={{ background: m.color }}
                  >
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-[12px] font-medium text-[#0a0a0a] dark:text-[#f0ede5]">{m.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-[#0a0a0a] dark:border-[#f0ede5] mb-4">
            {([
              { id: 'expenses', label: 'Expenses', icon: Receipt },
              { id: 'balances', label: 'Balances',  icon: Scale },
              { id: 'stats',    label: 'Stats',     icon: BarChart2 },
            ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-all',
                  tab === id
                    ? 'text-[#0a0a0a] dark:text-[#f0ede5] border-b-[3px] border-[#b9f542] -mb-[2px]'
                    : 'text-[#4a4940] dark:text-[#a09880] hover:text-[#0a0a0a] dark:hover:text-[#f0ede5]'
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
              <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] p-8 text-center">
                <div className="w-12 h-12 rounded bg-[#f0ede5] dark:bg-[#1a1a17] border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 flex items-center justify-center mx-auto mb-3 text-2xl shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#b9f542]">
                  💸
                </div>
                <p className="text-[12px] font-black uppercase tracking-[0.06em] text-[#0a0a0a] dark:text-[#f0ede5] mb-1">No expenses yet</p>
                <p className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880] mb-4">
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
                    groupCurrency={group.currency}
                  />
                ))}
              </div>
            )
          )}

          {/* Tab: Balances */}
          {tab === 'balances' && (
            <BalancesTab group={group} expenses={expenses} payments={payments} />
          )}

          {/* Tab: Stats — lazy-loaded so Recharts doesn't bloat the GroupPage chunk */}
          {tab === 'stats' && (
            <Suspense fallback={
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 border-[#b9f542] border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <AnalyticsTab group={group} expenses={expenses} />
            </Suspense>
          )}
        </div>
      </PageTransition>

      {/* Mobile FAB */}
      <button
        onClick={() => navigate(`/g/${groupId}/expenses/new`)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded bg-[#b9f542] flex items-center justify-center border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none z-30"
      >
        <Plus className="w-6 h-6 text-[#0a0a0a]" />
      </button>
    </AppShell>
  )
}
