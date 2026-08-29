import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroups } from '@/hooks/useGroups'
import { useAuthStore } from '@/store/auth'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { GroupSummary } from '@/types'

const GROUP_ICONS: Record<string, string> = {
  travel: '✈️', roommates: '🏠', friends: '👯', dinner: '🍽️', other: '👥',
}

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
}

function SummaryCard({ label, amount, variant }: { label: string; amount: number; variant: 'owe' | 'owed' | 'net' }) {
  const palette =
    variant === 'owe'
      ? { card: 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400', accent: 'bg-red-400 dark:bg-red-500' }
      : variant === 'owed'
        ? { card: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400', accent: 'bg-emerald-400 dark:bg-emerald-500' }
        : amount >= 0
          ? { card: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400', accent: 'bg-indigo-500' }
          : { card: 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400', accent: 'bg-red-400 dark:bg-red-500' }
  const Icon = variant === 'owe' ? TrendingDown : variant === 'owed' ? TrendingUp : Minus

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border p-4 pt-5', palette.card)}>
      <span className={cn('absolute inset-x-0 top-0 h-1', palette.accent)} />
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{formatCurrency(Math.abs(amount))}</p>
    </div>
  )
}

function GroupCard({ group }: { group: GroupSummary }) {
  const net = group.owed_to_you - group.you_owe
  const netPositive = net >= 0

  return (
    <motion.div variants={cardVariants}>
      <Link
        to={`/groups/${group.id}`}
        className="block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-100/60 dark:hover:shadow-none transition-all duration-200 group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-xl shrink-0">
              {GROUP_ICONS[group.type]}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-zinc-100 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                {group.name}
              </h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                {group.member_count} member{group.member_count !== 1 ? 's' : ''} · {formatCurrency(group.total_expenses)} total
              </p>
            </div>
          </div>

          {net !== 0 && (
            <div className={`shrink-0 rounded-xl px-2.5 py-1 text-sm font-semibold ${
              netPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
            }`}>
              {netPositive ? '+' : '−'}{formatCurrency(Math.abs(net))}
            </div>
          )}
          {net === 0 && group.total_expenses > 0 && (
            <div className="shrink-0 rounded-xl px-2.5 py-1 text-sm font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
              Settled
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function GroupCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 w-32 bg-gray-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-3 w-48 bg-gray-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="h-7 w-16 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('new') === '1')
  const user = useAuthStore((s) => s.user)
  const { data: groups, isLoading } = useGroups()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreateModal(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const totalOwe  = groups?.reduce((sum, g) => sum + g.you_owe, 0) ?? 0
  const totalOwed = groups?.reduce((sum, g) => sum + g.owed_to_you, 0) ?? 0
  const net = totalOwed - totalOwe

  return (
    <AppShell>
      <TopBar
        title="Dashboard"
        actions={
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-3.5 h-3.5" />
            New
          </Button>
        }
      />

      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          {/* Greeting */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                Hey, {user?.name.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Here's your expense summary</p>
            </div>
            <Button className="hidden md:flex" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              New group
            </Button>
          </div>

          {/* Summary cards */}
          {(groups?.length ?? 0) > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <SummaryCard label="You owe"     amount={totalOwe}  variant="owe" />
              <SummaryCard label="Owed to you" amount={totalOwed} variant="owed" />
              <SummaryCard label="Net balance" amount={net}       variant="net" />
            </div>
          )}

          {/* Groups list */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3">
              Your groups
            </h2>

            {isLoading && (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => <GroupCardSkeleton key={i} />)}
              </div>
            )}

            {!isLoading && groups?.length === 0 && (
              <EmptyState
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                }
                title="No groups yet"
                description="Create your first group and invite friends to start splitting expenses."
                action={
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" />
                    Create group
                  </Button>
                }
              />
            )}

            {!isLoading && (groups?.length ?? 0) > 0 && (
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-3"
              >
                {groups!.map((g) => <GroupCard key={g.id} group={g} />)}
              </motion.div>
            )}
          </div>
        </div>
      </PageTransition>

      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </AppShell>
  )
}
