import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, RefreshCw, Save, Trash2, UserMinus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { useGroup, useUpdateGroup, useRemoveMember, useLeaveGroup, useRegenerateInvite } from '@/hooks/useGroups'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/common/Toast'
import { cn } from '@/lib/utils'

const GROUP_TYPES = [
  { value: 'travel', label: '✈️ Travel' },
  { value: 'roommates', label: '🏠 Roommates' },
  { value: 'friends', label: '👯 Friends' },
  { value: 'dinner', label: '🍽️ Dinner' },
  { value: 'other', label: '👥 Other' },
]

function ConfirmModal({ title, description, confirmLabel = 'Confirm', danger = false, loading, onConfirm, onCancel }: {
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{description}</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button variant={danger ? 'danger' : 'primary'} className="flex-1" loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function GroupSettingsPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)

  const { data: group, isLoading } = useGroup(groupId!)
  const updateGroup = useUpdateGroup(groupId!)
  const removeMember = useRemoveMember(groupId!)
  const leaveGroup = useLeaveGroup(groupId!)
  const regenerateInvite = useRegenerateInvite(groupId!)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  useEffect(() => {
    if (group) {
      setName(group.name)
      setDescription(group.description ?? '')
      setType(group.type)
    }
  }, [group])

  if (isLoading || !group) return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6 animate-pulse flex flex-col gap-4">
        <div className="h-8 w-24 bg-gray-100 rounded-lg" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
    </AppShell>
  )

  const myMembership = group.members.find((m) => m.user.id === currentUser?.id)
  const isAdmin = myMembership?.role === 'admin'
  const dirty = name !== group.name || description !== (group.description ?? '') || type !== group.type

  const inviteUrl = `${window.location.origin}/join/${group.invite_code}`

  function copyInvite() {
    navigator.clipboard.writeText(inviteUrl)
    toast.success('Invite link copied!')
  }

  function saveChanges() {
    updateGroup.mutate({ name, description: description || undefined, type })
  }

  function handleLeave() {
    leaveGroup.mutate(undefined, {
      onSuccess: () => navigate('/', { replace: true }),
    })
  }

  function handleRemove(userId: string) {
    removeMember.mutate(userId, { onSuccess: () => setConfirmRemove(null) })
  }

  return (
    <AppShell>
      <TopBar title="Group settings" showBack />

      <div className="max-w-lg mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Group details */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Group details</p>
            </div>
            <div className="px-4 py-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this group for?"
                  className="w-full h-10 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {GROUP_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        'py-2 px-2 rounded-xl text-xs font-medium border transition-colors',
                        type === t.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                disabled={!dirty || !name.trim()}
                loading={updateGroup.isPending}
                onClick={saveChanges}
              >
                <Save className="w-4 h-4" />
                Save changes
              </Button>
            </div>
          </div>
        )}

        {/* Invite link */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Invite link</p>
          </div>
          <div className="px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
              <p className="flex-1 text-xs text-gray-600 font-mono truncate">{inviteUrl}</p>
              <button
                onClick={copyInvite}
                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            {isAdmin && (
              <Button variant="secondary" size="sm" loading={regenerateInvite.isPending} onClick={() => regenerateInvite.mutate()}>
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate link
              </Button>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">
              Members ({group.members.filter((m) => m.is_active).length})
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {group.members.filter((m) => m.is_active).map((m) => (
              <div key={m.user.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={m.user.name} src={m.user.avatar_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {m.user.id === currentUser?.id ? 'You' : m.user.name}
                  </p>
                  <p className="text-xs text-gray-400">{m.user.email}</p>
                </div>
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  m.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'
                )}>
                  {m.role}
                </span>
                {isAdmin && m.user.id !== currentUser?.id && (
                  <button
                    onClick={() => setConfirmRemove(m.user.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove member"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Leave group */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Danger zone</p>
          </div>
          <div className="px-4 py-4">
            <Button variant="danger" className="w-full" onClick={() => setConfirmLeave(true)}>
              <Trash2 className="w-4 h-4" />
              Leave group
            </Button>
          </div>
        </div>
      </div>

      {confirmLeave && (
        <ConfirmModal
          title="Leave group?"
          description={`You'll lose access to "${group.name}" and its expenses. You can rejoin via invite link.`}
          confirmLabel="Leave"
          danger
          loading={leaveGroup.isPending}
          onConfirm={handleLeave}
          onCancel={() => setConfirmLeave(false)}
        />
      )}

      {confirmRemove && (
        <ConfirmModal
          title="Remove member?"
          description={`This member will lose access to the group. They can rejoin via the invite link.`}
          confirmLabel="Remove"
          danger
          loading={removeMember.isPending}
          onConfirm={() => handleRemove(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </AppShell>
  )
}
