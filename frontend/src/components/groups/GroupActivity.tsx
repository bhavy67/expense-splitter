import { Receipt, Edit3, CreditCard } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { useGroupActivity } from '@/hooks/useGroups'
import { formatCurrency } from '@/lib/currency'
import { useAuthStore } from '@/store/auth'
import type { ActivityItem } from '@/types'
import { cn } from '@/lib/utils'

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TYPE_CONFIG = {
  expense_created: {
    icon: Receipt,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  expense_edited: {
    icon: Edit3,
    iconBg: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  payment_recorded: {
    icon: CreditCard,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
}

function activityLabel(item: ActivityItem, currentUserId: string): React.ReactNode {
  const actorName = item.actor?.id === currentUserId ? 'You' : (item.actor?.name ?? 'Someone')
  const bold = (t: string) => <span className="font-semibold text-gray-900 dark:text-zinc-100">{t}</span>

  switch (item.activity_type) {
    case 'expense_created':
      return (
        <span>
          {bold(actorName)} added{' '}
          {item.entity_title ? <>{bold(`"${item.entity_title}"`)}</> : 'an expense'}
          {item.total_amount != null && (
            <> for {bold(formatCurrency(item.total_amount))}</>
          )}
        </span>
      )
    case 'expense_edited':
      return (
        <span>
          {bold(actorName)} edited{' '}
          {item.entity_title ? <>{bold(`"${item.entity_title}"`)}</> : 'an expense'}
        </span>
      )
    case 'payment_recorded':
      return (
        <span>
          {bold(actorName)} recorded a payment
          {item.total_amount != null && (
            <> of {bold(formatCurrency(item.total_amount))}</>
          )}
        </span>
      )
  }
}

function ActivityRow({ item, currentUserId }: { item: ActivityItem; currentUserId: string }) {
  const cfg = TYPE_CONFIG[item.activity_type]
  const Icon = cfg.icon

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Avatar */}
      <Avatar name={item.actor?.name ?? '?'} src={item.actor?.avatar_url ?? null} size="sm" />

      {/* Icon + label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600 dark:text-zinc-300 leading-snug">
          {activityLabel(item, currentUserId)}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">{timeAgo(item.occurred_at)}</p>
      </div>

      {/* Type badge */}
      <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0', cfg.iconBg)}>
        <Icon className={cn('w-3.5 h-3.5', cfg.iconColor)} />
      </div>
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="flex flex-col divide-y divide-gray-50 dark:divide-zinc-800 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5 pt-1">
            <div className="h-3 w-48 bg-gray-100 dark:bg-zinc-800 rounded" />
            <div className="h-2.5 w-16 bg-gray-100 dark:bg-zinc-800 rounded" />
          </div>
          <div className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-zinc-800 shrink-0" />
        </div>
      ))}
    </div>
  )
}

interface Props {
  groupId: string
}

export function GroupActivity({ groupId }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const { data: activity = [], isLoading } = useGroupActivity(groupId)

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Recent activity</p>
      </div>

      {isLoading ? (
        <div className="px-4">
          <ActivitySkeleton />
        </div>
      ) : activity.length === 0 ? (
        <div className="px-4 py-8">
          <EmptyState
            icon={Receipt}
            title="No activity yet"
            description="Add your first expense to get started."
          />
        </div>
      ) : (
        <div className="px-4 divide-y divide-gray-50 dark:divide-zinc-800">
          {activity.map((item) => (
            <ActivityRow key={`${item.activity_type}-${item.entity_id}-${item.occurred_at}`} item={item} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
