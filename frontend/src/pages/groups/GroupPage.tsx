import { useParams, useNavigate } from 'react-router-dom'
import { Settings, Plus, Users } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroup } from '@/hooks/useStore'

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const group = useGroup(groupId!)

  if (!group) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen text-gray-500 dark:text-zinc-500">
          Group not found
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <TopBar
        title={group.name}
        showBack
        actions={
          <button
            onClick={() => navigate(`/g/${groupId}/settings`)}
            className="p-1.5 rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        }
      />

      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">{group.name}</h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                {group.members.length} member{group.members.length !== 1 ? 's' : ''} · {group.currency}
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

          {/* Members */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Members</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-xl px-3 py-2"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: m.color }}
                  >
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{m.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses — Phase 3 */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto mb-3 text-2xl">
              💸
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">No expenses yet</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">
              Add your first expense to start tracking splits
            </p>
            <Button size="sm" onClick={() => navigate(`/g/${groupId}/expenses/new`)}>
              <Plus className="w-3.5 h-3.5" />
              Add expense
            </Button>
          </div>
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
