import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroups } from '@/hooks/useStore'
import { getExpenses } from '@/lib/storage'
import { getTotalExpenses } from '@/lib/calculations'
import { formatCurrency } from '@/lib/currency'
import type { Group } from '@/types'

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

function GroupCard({ group }: { group: Group }) {
  const expenses = getExpenses(group.id)
  const total = getTotalExpenses(expenses)

  return (
    <motion.div variants={cardVariants}>
      <Link
        to={`/g/${group.id}`}
        className="block bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] p-4 shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-100 group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded bg-[#0a0a0a] dark:bg-[#b9f542] flex items-center justify-center text-xl shrink-0">
              {GROUP_ICONS[group.type] ?? '👥'}
            </div>
            <div className="min-w-0">
              <h3 className="font-black uppercase tracking-[0.04em] text-[#0a0a0a] dark:text-[#f0ede5] truncate group-hover:text-[#b9f542] transition-colors">
                {group.name}
              </h3>
              <p className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880] mt-0.5 uppercase tracking-wider">
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                {total > 0 && ` · ${formatCurrency(total, group.currency)} total`}
              </p>
            </div>
          </div>
          {expenses.length > 0 && (
            <span className="shrink-0 text-[9px] font-mono font-medium bg-[#f0ede5] dark:bg-[#1a1a17] text-[#4a4940] dark:text-[#a09880] border border-[#0a0a0a] dark:border-[#f0ede5]/30 px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Member dots */}
        <div className="flex items-center gap-1 mt-3">
          {group.members.slice(0, 6).map((m) => (
            <div
              key={m.id}
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ring-1 ring-white dark:ring-[#1e1e1a]"
              style={{ background: m.color }}
              title={m.name}
            >
              {m.name[0]?.toUpperCase()}
            </div>
          ))}
          {group.members.length > 6 && (
            <span className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880] ml-1">+{group.members.length - 6}</span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCreate, setShowCreate] = useState(searchParams.get('new') === '1')
  const groups = useGroups()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreate(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <AppShell>
      <TopBar
        title="My Groups"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5" />
            New
          </Button>
        }
      />

      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-black uppercase tracking-[0.04em] text-[#0a0a0a] dark:text-[#f0ede5]">My Groups</h1>
              <p className="text-[11px] font-mono text-[#4a4940] dark:text-[#a09880] mt-0.5 uppercase tracking-wider">
                {groups.length === 0
                  ? 'Create a group to start splitting instantly'
                  : `${groups.length} group${groups.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                New group
              </Button>
            </div>
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              }
              title="No groups yet"
              description="No accounts needed — just create a group, add names, and start splitting."
              action={
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4" />
                  Create first group
                </Button>
              }
            />
          ) : (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3"
            >
              {groups.map((g) => <GroupCard key={g.id} group={g} />)}
            </motion.div>
          )}
        </div>
      </PageTransition>

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} />
    </AppShell>
  )
}
