import { useParams, useNavigate } from 'react-router-dom'
import { Trash2, ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroup } from '@/hooks/useStore'
import { deleteGroup } from '@/lib/storage'
import { toast } from '@/components/common/Toast'

export default function GroupSettingsPage() {
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

  function handleDelete() {
    if (!confirm(`Delete "${group!.name}"? All expenses and settlements will be lost.`)) return
    deleteGroup(group!.id)
    toast.success('Group deleted')
    navigate('/', { replace: true })
  }

  return (
    <AppShell>
      <TopBar title="Settings" showBack />

      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Desktop back */}
          <button
            onClick={() => navigate(`/g/${groupId}`)}
            className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {group.name}
          </button>

          <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-6">Group settings</h1>

          {/* Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 mb-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Name</span>
                <span className="font-medium text-gray-800 dark:text-zinc-200">{group.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Currency</span>
                <span className="font-medium text-gray-800 dark:text-zinc-200">{group.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Members</span>
                <span className="font-medium text-gray-800 dark:text-zinc-200">{group.members.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Created</span>
                <span className="font-medium text-gray-800 dark:text-zinc-200">
                  {new Date(group.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Members list */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">Members</p>
            <div className="flex flex-col gap-2">
              {group.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: m.color }}
                  >
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-800 dark:text-zinc-200">{m.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-3">
              Full member management (add, rename, remove) coming in Phase 2.
            </p>
          </div>

          {/* Danger zone */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-red-900/30 p-4">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Danger zone</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mb-3">
              Deleting a group permanently removes all its expenses and settlements.
            </p>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete group
            </Button>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}
