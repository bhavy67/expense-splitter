import { useState } from 'react'
import { X, Copy, Check, RefreshCw, Link } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl dark:shadow-black/50 border border-transparent dark:border-zinc-800"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Invite to {group.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Invite link */}
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
                Share this link — anyone with it can join the group.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center h-10 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 min-w-0">
                  <span className="text-sm text-gray-600 dark:text-zinc-300 truncate">{inviteUrl}</span>
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
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                Members ({group.members.filter(m => m.is_active).length})
              </p>
              <div className="flex flex-col gap-2">
                {group.members.filter(m => m.is_active).map((m) => (
                  <div key={m.user.id} className="flex items-center gap-3">
                    <Avatar name={m.user.name} src={m.user.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{m.user.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{m.user.email}</p>
                    </div>
                    {m.role === 'admin' && (
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Regenerate link */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-xs text-gray-400 dark:text-zinc-500">Revoke current link and generate a new one</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => regenerate.mutate()}
                loading={regenerate.isPending}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset link
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
