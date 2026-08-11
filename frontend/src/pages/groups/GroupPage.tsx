import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { GroupHeader } from '@/components/groups/GroupHeader'
import { GroupAnalytics } from '@/components/groups/GroupAnalytics'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { SettlementPanel } from '@/components/settlements/SettlementPanel'
import { Button } from '@/components/common/Button'
import { useGroup, useGroups } from '@/hooks/useGroups'
import { useSettlements } from '@/hooks/useSettlements'
import { useGroupWebSocket } from '@/hooks/useWebSocket'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

type Tab = 'expenses' | 'settlements' | 'analytics'

const TABS: { value: Tab; label: string }[] = [
  { value: 'expenses', label: 'Expenses' },
  { value: 'settlements', label: 'Settlements' },
  { value: 'analytics', label: 'Insights' },
]

function GroupSkeleton() {
  return (
    <AppShell>
      <div className="animate-pulse">
        <div className="h-36 bg-gray-100 border-b border-gray-200" />
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[72px] bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </AppShell>
  )
}

function GroupNotFound() {
  const navigate = useNavigate()
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-gray-500">Group not found.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>Go home</Button>
      </div>
    </AppShell>
  )
}

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('expenses')

  const user = useAuthStore((s) => s.user)
  const { data: group, isLoading: groupLoading } = useGroup(groupId!)
  const { data: groups } = useGroups()
  const { data: settlements = [] } = useSettlements(groupId!)

  // Real-time updates
  useGroupWebSocket(groupId!)

  if (groupLoading) return <GroupSkeleton />
  if (!group) return <GroupNotFound />

  const summary = groups?.find((g) => g.id === groupId)
  const currentUserId = user?.id ?? ''

  const addExpenseBtn = (
    <Button size="sm" onClick={() => navigate(`/groups/${groupId}/expenses/new`)}>
      <Plus className="w-3.5 h-3.5" />
      Add
    </Button>
  )

  return (
    <AppShell>
      {/* Mobile top bar */}
      <TopBar title={group.name} showBack actions={addExpenseBtn} />

      {/* Group header — visible on desktop and mobile */}
      <GroupHeader group={group} summary={summary} />

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Mobile tabs */}
        <div className="flex gap-1 mb-5 md:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-medium transition-colors relative',
                activeTab === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
              )}
            >
              {tab.label}
              {tab.value === 'settlements' && settlements.length > 0 && (
                <span className={cn(
                  'absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1',
                  activeTab === 'settlements' ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
                )}>
                  {settlements.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Desktop layout: expenses + settlement side by side, analytics below */}
        <div className="md:grid md:grid-cols-[1fr,300px] md:gap-6">
          {/* Expenses — hidden on mobile when not expenses tab */}
          <div className={cn(activeTab !== 'expenses' && 'hidden md:block')}>
            <div className="hidden md:flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Expenses
              </h2>
              <Button size="sm" onClick={() => navigate(`/groups/${groupId}/expenses/new`)}>
                <Plus className="w-3.5 h-3.5" />
                Add expense
              </Button>
            </div>
            <ExpenseList
              groupId={groupId!}
              currentUserId={currentUserId}
              members={group.members}
            />
          </div>

          {/* Settlements — hidden on mobile when not settlements tab */}
          <div className={cn(activeTab !== 'settlements' && 'hidden md:block')}>
            <SettlementPanel
              groupId={groupId!}
              settlements={settlements}
              members={group.members}
              currentUserId={currentUserId}
            />
          </div>
        </div>

        {/* Analytics — mobile: only when analytics tab active; desktop: always below */}
        <div className={cn('md:mt-6', activeTab !== 'analytics' && 'hidden md:block')}>
          <h2 className="hidden md:block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Spending insights
          </h2>
          <GroupAnalytics
            groupId={groupId!}
            members={group.members}
            currencyCode={group.currency_code}
          />
        </div>
      </div>

      {/* Mobile FAB for adding expense */}
      <button
        onClick={() => navigate(`/groups/${groupId}/expenses/new`)}
        className="fixed bottom-20 right-4 md:hidden z-30 w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-300/50 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </AppShell>
  )
}
