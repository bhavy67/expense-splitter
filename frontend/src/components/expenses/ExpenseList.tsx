import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Search, X } from 'lucide-react'
import { ExpenseCard } from './ExpenseCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/common/Button'
import { useExpenses } from '@/hooks/useExpenses'
import { cn } from '@/lib/utils'
import type { GroupMember } from '@/types'

type FilterTab = 'all' | 'you_paid' | 'others_paid'

interface ExpenseListProps {
  groupId: string
  currentUserId: string
  members: GroupMember[]
}

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'you_paid', label: 'You paid' },
  { value: 'others_paid', label: 'You owe' },
]

const PER_PAGE = 20

export function ExpenseList({ groupId, currentUserId, members }: ExpenseListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const navigate = useNavigate()

  const { data, isLoading } = useExpenses(groupId, {
    paid_by: activeFilter === 'you_paid' ? currentUserId : undefined,
    page,
    per_page: PER_PAGE,
  })

  const expenses = data?.data ?? []

  // Client-side filters: "others paid" + search
  const filtered = expenses
    .filter((e) => {
      if (activeFilter === 'others_paid') {
        return e.paid_by !== currentUserId && e.splits.some((s) => s.user_id === currentUserId)
      }
      return true
    })
    .filter((e) => {
      if (!search.trim()) return true
      return e.title.toLowerCase().includes(search.toLowerCase())
    })

  const total = data?.total ?? 0
  const hasMore = page * PER_PAGE < total && activeFilter === 'all' && !search

  function changeFilter(f: FilterTab) {
    setActiveFilter(f)
    setPage(1)
    setSearch('')
    setShowSearch(false)
  }

  return (
    <div>
      {/* Filter + search bar */}
      <div className="flex items-center gap-2 mb-4">
        {showSearch ? (
          <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 rounded-xl px-3 h-9">
            <Search className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses…"
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-500"
            />
            <button
              onClick={() => { setSearch(''); setShowSearch(false) }}
              className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Filter className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 shrink-0" />
            <div className="flex items-center gap-1 flex-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => changeFilter(tab.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
                    activeFilter === tab.value
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 rounded-xl text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] bg-gray-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
              />
            </svg>
          }
          title={search ? 'No matching expenses' : activeFilter === 'all' ? 'No expenses yet' : 'No expenses here'}
          description={
            search
              ? `No expenses match "${search}"`
              : activeFilter === 'all'
              ? 'Add your first expense to get started.'
              : 'No expenses match this filter.'
          }
        />
      )}

      {/* List */}
      <div className="flex flex-col gap-2.5">
        {filtered.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            currentUserId={currentUserId}
            members={members}
            onClick={() => navigate(`/groups/${groupId}/expenses/${expense.id}`)}
          />
        ))}
      </div>

      {/* Load more / pagination footer */}
      {!isLoading && (
        <div className="mt-4 flex flex-col items-center gap-2">
          {hasMore && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
            >
              Load more
            </Button>
          )}
          {total > 0 && (
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Showing {filtered.length} of {total} expense{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
