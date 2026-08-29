import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { GroupMember } from '@/types'

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔', travel: '✈️', accommodation: '🏨',
  utilities: '💡', entertainment: '🎮', other: '📦',
}

const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-orange-400',
  travel: 'bg-blue-500',
  accommodation: 'bg-violet-500',
  utilities: 'bg-yellow-400',
  entertainment: 'bg-pink-500',
  other: 'bg-gray-400',
}

interface AnalyticsData {
  by_category: Record<string, number>
  by_payer: Record<string, number>
  monthly: { month: string; total: number }[]
}

function useGroupAnalytics(groupId: string) {
  return useQuery({
    queryKey: ['analytics', groupId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('group_analytics', { p_group_id: groupId })
      if (error) throw error
      return data as unknown as AnalyticsData
    },
    enabled: !!groupId,
  })
}

function formatMonth(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

interface GroupAnalyticsProps {
  groupId: string
  members: GroupMember[]
  currencyCode: string
}

export function GroupAnalytics({ groupId, members, currencyCode }: GroupAnalyticsProps) {
  const { data, isLoading } = useGroupAnalytics(groupId)
  const memberMap = Object.fromEntries(members.map((m) => [m.user.id, m.user]))

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 h-36" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const categoryEntries = Object.entries(data.by_category).sort((a, b) => b[1] - a[1])
  const payerEntries = Object.entries(data.by_payer).sort((a, b) => b[1] - a[1])
  const maxCategory = Math.max(...categoryEntries.map(([, v]) => v), 1)
  const maxPayer = Math.max(...payerEntries.map(([, v]) => v), 1)
  const maxMonthly = Math.max(...data.monthly.map((m) => m.total), 1)
  const totalSpend = categoryEntries.reduce((s, [, v]) => s + v, 0)

  if (categoryEntries.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 px-6 py-10 text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No expenses yet</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Add expenses to see spending insights</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Total spend */}
      <div className="bg-indigo-600 rounded-2xl px-5 py-4 text-white">
        <p className="text-xs font-medium opacity-70 mb-1">Total group spend</p>
        <p className="text-3xl font-bold">{formatCurrency(totalSpend, currencyCode)}</p>
        <p className="text-xs opacity-60 mt-1">{categoryEntries.length} categor{categoryEntries.length === 1 ? 'y' : 'ies'}</p>
      </div>

      {/* By category */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
          <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">By category</p>
        </div>
        <div className="px-4 py-3 flex flex-col gap-3">
          {categoryEntries.map(([cat, amount]) => (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{CATEGORY_ICONS[cat] ?? '📦'}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 capitalize">{cat}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    {formatCurrency(amount, currencyCode)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-zinc-500 ml-2">
                    {Math.round((amount / totalSpend) * 100)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', CATEGORY_COLORS[cat] ?? 'bg-gray-400')}
                  style={{ width: `${(amount / maxCategory) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By member */}
      {payerEntries.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Who paid</p>
          </div>
          <div className="px-4 py-3 flex flex-col gap-3">
            {payerEntries.map(([userId, amount]) => {
              const user = memberMap[userId]
              const name = user?.name ?? 'Unknown'
              return (
                <div key={userId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 truncate">{name}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 ml-2 shrink-0">
                      {formatCurrency(amount, currencyCode)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                      style={{ width: `${(amount / maxPayer) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {data.monthly.length > 1 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Monthly trend</p>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-end gap-2 h-24">
              {data.monthly.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                    <div
                      className="w-full rounded-t-lg bg-indigo-200 dark:bg-indigo-800 hover:bg-indigo-400 dark:hover:bg-indigo-600 transition-colors cursor-default"
                      style={{ height: `${Math.max((m.total / maxMonthly) * 100, 4)}%` }}
                      title={formatCurrency(m.total, currencyCode)}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate w-full text-center">
                    {formatMonth(m.month)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
