import { useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Settings, Plus, UserPlus, Search, X, ChevronDown, Check, Receipt } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { Chip, ChipGroup } from '@/components/ui/Chip'
import { SegmentedTabs, TabPanel } from '@/components/ui/SegmentedTabs'
import { Sheet } from '@/components/ui/Dialog'
import { ListRow } from '@/components/ui/ListRow'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { Money } from '@/components/ui/Money'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { ExpenseCard } from '@/components/expenses/ExpenseCard'
import { BalancesTab } from '@/components/groups/BalancesTab'
import { useGroup, useExpenses, usePayments } from '@/hooks/useStore'
import { getTotalExpenses } from '@/lib/calculations'
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/icons'
import { today } from '@/lib/utils'
import type { Expense, ExpenseCategory } from '@/types'

const AnalyticsTab = lazy(() => import('@/components/groups/AnalyticsTab'))

type Tab = 'expenses' | 'balances' | 'stats'

const TABS: { id: Tab; label: string }[] = [
  { id: 'expenses', label: 'Expenses' },
  { id: 'balances', label: 'Balances' },
  { id: 'stats', label: 'Stats' },
]

// "Today" / "Yesterday" / "12 Nov" (with the year when it isn't this year).
function dateLabel(iso: string) {
  const t = today()
  const y = new Date(); y.setDate(y.getDate() - 1)
  if (iso === t) return 'Today'
  if (iso === y.toLocaleDateString('en-CA')) return 'Yesterday'
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', ...(iso.slice(0, 4) !== t.slice(0, 4) && { year: 'numeric' }),
  })
}

// Presentation-level grouping over the already-filtered list; keeps its order.
function groupByDate(expenses: Expense[]) {
  const groups = new Map<string, Expense[]>()
  for (const e of expenses) groups.set(e.date, [...(groups.get(e.date) ?? []), e])
  return [...groups]
}

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
  const [paidBySheet, setPaidBySheet] = useState(false)

  if (!group) {
    return (
      <AppShell>
        <TopBar title="Group" showBack />
        <EmptyState title="Group not found" description="It may have been deleted on this device." />
      </AppShell>
    )
  }

  const total = getTotalExpenses(expenses)
  const toSettings = () => navigate(`/g/${groupId}/settings`)
  const toAdd = () => navigate(`/g/${groupId}/expenses/new`)

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
  const clearFilters = () => { setSearchQuery(''); setFilterCategory(null); setFilterPaidBy(null) }
  const paidByName = group.members.find((m) => m.id === filterPaidBy)?.name

  return (
    <AppShell>
      <TopBar
        title={group.name}
        showBack
        largeTitle
        actions={
          <IconButton aria-label="Group settings" onClick={toSettings}>
            <Settings />
          </IconButton>
        }
      />

      <PageTransition>
        <div className="mx-auto max-w-[640px] px-4 pt-4 pb-8 md:py-8">
          {/* Hero */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="break-words text-title-lg">{group.name}</h1>
              <p className="text-body-sm text-fg-muted">
                {group.members.length} member{group.members.length !== 1 ? 's' : ''} · {group.currency}
              </p>
            </div>
            <div className="hidden md:flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" onClick={toSettings}>
                <Settings className="size-4" />
                Settings
              </Button>
              <Button size="sm" onClick={toAdd}>
                <Plus className="size-4" />
                Add expense
              </Button>
            </div>
          </div>

          <div className="mt-5">
            <Money amount={total} currency={group.currency} size="display" className="block truncate" />
            <p className="text-caption text-fg-muted">Total spent</p>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <AvatarStack names={group.members.map((m) => m.name)} max={6} className="pl-1.5" />
            <Button variant="ghost" size="sm" onClick={toSettings} className="rounded-full">
              <UserPlus className="size-4" />
              Add
            </Button>
          </div>

          {/* Tabs — stick under the mobile TopBar */}
          <div className="sticky top-14 z-20 -mx-4 mt-6 bg-bg px-4 py-2 md:top-0">
            <SegmentedTabs id="group-tabs" aria-label="Group sections" tabs={TABS} value={tab} onChange={setTab} />
          </div>

          <TabPanel tabsId="group-tabs" value={tab} className="mt-3">
            {tab === 'expenses' && (
              expenses.length === 0 ? (
                <EmptyState
                  icon={<Receipt />}
                  title="No expenses yet"
                  description="Add your first expense to start splitting."
                  action={<Button onClick={toAdd}><Plus className="size-4" />Add expense</Button>}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
                    <Input
                      type="search"
                      aria-label="Search expenses"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search expenses"
                      className="px-9 [&::-webkit-search-cancel-button]:hidden"
                    />
                    {searchQuery && (
                      <IconButton aria-label="Clear search" onClick={() => setSearchQuery('')} className="absolute top-0 right-0">
                        <X />
                      </IconButton>
                    )}
                  </div>

                  <ChipGroup aria-label="Filter expenses">
                    <Chip selected={!filterCategory} onClick={() => setFilterCategory(null)}>All</Chip>
                    <Chip selected={!!filterPaidBy} onClick={() => setPaidBySheet(true)} aria-haspopup="dialog">
                      {paidByName ? `Paid by ${paidByName}` : 'Paid by'}
                      <ChevronDown />
                    </Chip>
                    {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map((cat) => {
                      const Icon = CATEGORY_ICONS[cat]
                      return (
                        <Chip
                          key={cat}
                          selected={filterCategory === cat}
                          onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                        >
                          <Icon />
                          {CATEGORY_LABELS[cat]}
                        </Chip>
                      )
                    })}
                  </ChipGroup>

                  {filteredExpenses.length === 0 ? (
                    <EmptyState
                      title="No expenses match"
                      description="Try a different search or filter."
                      action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
                    />
                  ) : (
                    <>
                      {(searchQuery || activeFilterCount > 0) && (
                        <p className="text-body-sm text-fg-muted">
                          {filteredExpenses.length} of {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                        </p>
                      )}
                      {groupByDate(filteredExpenses).map(([date, list]) => (
                        <section key={date}>
                          <SectionHeader as="h3" title={<span className="text-body-sm font-medium text-fg-muted">{dateLabel(date)}</span>} className="min-h-8" />
                          <Card className="overflow-hidden">
                            {list.map((expense) => (
                              <ExpenseCard
                                key={expense.id}
                                expense={expense}
                                members={group.members}
                                groupId={groupId!}
                                groupCurrency={group.currency}
                                divider
                              />
                            ))}
                          </Card>
                        </section>
                      ))}
                    </>
                  )}
                </div>
              )
            )}

            {tab === 'balances' && (
              <BalancesTab group={group} expenses={expenses} payments={payments} />
            )}

            {/* Stats — lazy-loaded so Recharts doesn't bloat the GroupPage chunk */}
            {tab === 'stats' && (
              <Suspense fallback={
                <div className="flex items-center justify-center py-16">
                  <div className="size-5 animate-spin rounded-full border-2 border-fg border-t-transparent" />
                </div>
              }>
                <AnalyticsTab group={group} expenses={expenses} />
              </Suspense>
            )}
          </TabPanel>
        </div>
      </PageTransition>

      <Sheet open={paidBySheet} onClose={() => setPaidBySheet(false)} title="Paid by">
        <div className="-mx-5">
          {[{ id: null, name: 'Anyone' }, ...group.members].map((m) => (
            <ListRow
              key={m.id ?? 'anyone'}
              as="button"
              type="button"
              aria-pressed={filterPaidBy === m.id}
              onClick={() => { setFilterPaidBy(m.id); setPaidBySheet(false) }}
              leading={m.id ? <Avatar name={m.name} /> : undefined}
              title={m.name}
              trailing={filterPaidBy === m.id ? <Check className="size-5" aria-hidden /> : undefined}
              className="px-5"
            />
          ))}
        </div>
      </Sheet>
    </AppShell>
  )
}
