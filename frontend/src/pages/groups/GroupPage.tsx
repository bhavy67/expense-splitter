import { useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Settings, Plus, Users, Receipt, Scale, UserPlus, BarChart2, Search, SlidersHorizontal, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { ExpenseCard, CATEGORY_EMOJIS } from '@/components/expenses/ExpenseCard'
import { BalancesTab } from '@/components/groups/BalancesTab'
import { useGroup, useExpenses, usePayments } from '@/hooks/useStore'

const AnalyticsTab = lazy(() => import('@/components/groups/AnalyticsTab'))
import { formatCurrency } from '@/lib/currency'
import { getTotalExpenses } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import type { ExpenseCategory } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food', travel: 'Travel', accommodation: 'Stay',
  utilities: 'Bills', entertainment: 'Fun', shopping: 'Shopping',
  medical: 'Medical', other: 'Other',
}

type Tab = 'expenses' | 'balances' | 'stats'

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const group = useGroup(groupId!)
  const expenses = useExpenses(groupId!)
  const payments = usePayments(groupId!)
  const [tab, setTab] = useState<Tab>('expenses')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | null>(null)
  const [filterPaidBy, setFilterPaidBy] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  if (!group) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[100dvh] text-[#4a4940] dark:text-[#a09880]">
          Group not found
        </div>
      </AppShell>
    )
  }

  const total = getTotalExpenses(expenses)

  const activeFilterCount = [filterCategory, filterPaidBy].filter(Boolean).length
  const filteredExpenses = expenses.filter(e => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!e.title.toLowerCase().includes(q) && !e.notes?.toLowerCase().includes(q)) return false
    }
    if (filterCategory && e.category !== filterCategory) return false
    if (filterPaidBy && e.paidBy !== filterPaidBy) return false
    return true
  })

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
              <p className="text-xs font-medium text-[#4a4940] dark:text-[#a09880] mt-0.5">
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
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#4a4940] dark:text-[#a09880]">
                  Members
                </span>
                <span className="text-[10px] font-mono font-medium bg-[#f0ede5] dark:bg-[#1a1a17] border border-[#0a0a0a] dark:border-[#f0ede5]/30 px-1.5 py-0.5 rounded text-[#0a0a0a] dark:text-[#f0ede5]">
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
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {group.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 bg-[#f0ede5] dark:bg-[#1a1a17] border border-[#0a0a0a] dark:border-[#f0ede5]/20 rounded px-2.5 py-1.5 shrink-0"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: m.color }}
                  >
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-[#0a0a0a] dark:text-[#f0ede5]">{m.name}</span>
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
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition-all',
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
                <p className="text-sm font-black uppercase tracking-[0.06em] text-[#0a0a0a] dark:text-[#f0ede5] mb-1">No expenses yet</p>
                <p className="text-sm text-[#4a4940] dark:text-[#c8bfb0] mb-4">
                  Add your first expense to start splitting
                </p>
                <Button size="sm" onClick={() => navigate(`/g/${groupId}/expenses/new`)}>
                  <Plus className="w-3.5 h-3.5" />
                  Add expense
                </Button>
              </div>
            ) : (
              <>
                {/* Search + Filter bar */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1e1e1a]">
                    <Search className="w-3.5 h-3.5 text-[#4a4940] dark:text-[#a09880] shrink-0" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search expenses…"
                      className="flex-1 text-[12px] font-medium bg-transparent text-[#0a0a0a] dark:text-[#f0ede5] placeholder:text-[#4a4940]/40 dark:placeholder:text-[#a09880]/40 focus:outline-none"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="shrink-0 text-[#4a4940] dark:text-[#a09880] hover:text-[#0a0a0a] dark:hover:text-[#f0ede5] transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFilters(v => !v)}
                    className={cn(
                      'flex items-center gap-1.5 h-9 px-3 rounded border-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-all shrink-0',
                      showFilters || activeFilterCount > 0
                        ? 'border-[#0a0a0a] bg-[#b9f542] text-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                        : 'border-[#0a0a0a] dark:border-[#f0ede5]/50 text-[#4a4940] dark:text-[#a09880] bg-white dark:bg-[#1e1e1a] hover:border-[#0a0a0a] dark:hover:border-[#f0ede5]'
                    )}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Filter{activeFilterCount > 0 && <span>({activeFilterCount})</span>}
                  </button>
                </div>

                {/* Filter panel */}
                {showFilters && (
                  <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] p-3 mb-3 flex flex-col gap-3">
                    {/* Category */}
                    <div>
                      <p className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-2">Category</p>
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => setFilterCategory(null)}
                          className={cn(
                            'px-2.5 py-1 rounded border-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all',
                            !filterCategory
                              ? 'border-[#0a0a0a] bg-[#0a0a0a] text-[#f0ede5]'
                              : 'border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 text-[#4a4940] dark:text-[#a09880] hover:border-[#0a0a0a] dark:hover:border-[#f0ede5]'
                          )}
                        >
                          All
                        </button>
                        {(Object.keys(CATEGORY_EMOJIS) as ExpenseCategory[]).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                            className={cn(
                              'flex items-center gap-1 px-2.5 py-1 rounded border-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all',
                              filterCategory === cat
                                ? 'border-[#0a0a0a] bg-[#b9f542] text-[#0a0a0a] shadow-[1px_1px_0_#0a0a0a]'
                                : 'border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 text-[#4a4940] dark:text-[#a09880] hover:border-[#0a0a0a] dark:hover:border-[#f0ede5]'
                            )}
                          >
                            <span>{CATEGORY_EMOJIS[cat]}</span>
                            <span>{CATEGORY_LABELS[cat]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Paid by */}
                    <div>
                      <p className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-2">Paid by</p>
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => setFilterPaidBy(null)}
                          className={cn(
                            'px-2.5 py-1 rounded border-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all',
                            !filterPaidBy
                              ? 'border-[#0a0a0a] bg-[#0a0a0a] text-[#f0ede5]'
                              : 'border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 text-[#4a4940] dark:text-[#a09880] hover:border-[#0a0a0a] dark:hover:border-[#f0ede5]'
                          )}
                        >
                          Anyone
                        </button>
                        {group.members.map(m => (
                          <button
                            key={m.id}
                            onClick={() => setFilterPaidBy(filterPaidBy === m.id ? null : m.id)}
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1 rounded border-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all',
                              filterPaidBy === m.id
                                ? 'border-[#0a0a0a] text-[#0a0a0a] shadow-[1px_1px_0_#0a0a0a]'
                                : 'border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 text-[#4a4940] dark:text-[#a09880] hover:border-[#0a0a0a] dark:hover:border-[#f0ede5]'
                            )}
                            style={filterPaidBy === m.id ? { background: m.color } : undefined}
                          >
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: filterPaidBy === m.id ? 'rgba(255,255,255,0.3)' : m.color }} />
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear all */}
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => { setFilterCategory(null); setFilterPaidBy(null) }}
                        className="self-start flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#ff5c3d] hover:underline underline-offset-2 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}

                {/* Results */}
                {filteredExpenses.length === 0 ? (
                  <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] p-8 text-center">
                    <p className="text-sm font-mono font-bold text-[#0a0a0a] dark:text-[#f0ede5] uppercase tracking-[0.06em] mb-1">No results</p>
                    <p className="text-sm text-[#4a4940] dark:text-[#c8bfb0] mb-3">Try adjusting your search or filters</p>
                    <button
                      onClick={() => { setSearchQuery(''); setFilterCategory(null); setFilterPaidBy(null) }}
                      className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#88bc20] hover:underline underline-offset-2"
                    >
                      Clear all
                    </button>
                  </div>
                ) : (
                  <>
                    {(searchQuery || activeFilterCount > 0) && (
                      <p className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880] mb-2">
                        {filteredExpenses.length} of {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      {filteredExpenses.map(expense => (
                        <ExpenseCard
                          key={expense.id}
                          expense={expense}
                          members={group.members}
                          groupId={groupId!}
                          groupCurrency={group.currency}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
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
