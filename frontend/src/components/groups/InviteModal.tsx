import { useState } from 'react'
import { X, Copy, Check, RefreshCw, Link } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { useRegenerateInvite } from '@/hooks/useGroups'
import type { Group } from '@/types'

interface InviteModalProps {
  group: Group
  onClose: () => void
}

export function InviteModal({ group, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false)
  const regenerate = useRegenerateInvite(group.id)

  const inviteUrl = `${window.location.origin}/join/${group.invite_code}`

  const copy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900">Invite to {group.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Invite link */}
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Share this link — anyone with it can join the group.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50 min-w-0">
                  <span className="text-sm text-gray-600 truncate">{inviteUrl}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copy}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* Current members */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Members ({group.members.filter(m => m.is_active).length})
              </p>
              <div className="flex flex-col gap-2">
                {group.members.filter(m => m.is_active).map((m) => (
                  <div key={m.user.id} className="flex items-center gap-3">
                    <Avatar name={m.user.name} src={m.user.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                    </div>
                    {m.role === 'admin' && (
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Regenerate link */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">Revoke current link and generate a new one</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => regenerate.mutate()}
                loading={regenerate.isPending}
                className="text-red-500 hover:bg-red-50 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset link
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
