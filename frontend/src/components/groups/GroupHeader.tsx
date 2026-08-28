import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { InviteModal } from './InviteModal'
import { formatCurrency } from '@/lib/currency'
import type { Group, GroupSummary } from '@/types'

const GROUP_ICONS: Record<string, string> = {
  travel: '✈️', roommates: '🏠', friends: '👯', dinner: '🍽️', other: '👥',
}

interface GroupHeaderProps {
  group: Group
  summary?: GroupSummary
}

export function GroupHeader({ group, summary }: GroupHeaderProps) {
  const [showInvite, setShowInvite] = useState(false)
  const navigate = useNavigate()
  const activeMembers = group.members.filter((m) => m.is_active)

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-5">
        <div className="max-w-5xl mx-auto">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0">
                {GROUP_ICONS[group.type]}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{group.name}</h1>
                {group.description && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">{group.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setShowInvite(true)}>
                <UserPlus className="w-3.5 h-3.5" />
                Invite
              </Button>
              <button
                onClick={() => navigate(`/groups/${group.id}/settings`)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Group settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom row: members + stats */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <button
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => setShowInvite(true)}
            >
              <div className="flex -space-x-2">
                {activeMembers.slice(0, 5).map((m) => (
                  <Avatar
                    key={m.user.id}
                    name={m.user.name}
                    src={m.user.avatar_url}
                    size="sm"
                    className="ring-2 ring-white"
                  />
                ))}
                {activeMembers.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-xs font-medium text-gray-600">
                    +{activeMembers.length - 5}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                {activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}
              </span>
            </button>

            {summary && (
              <div className="flex items-center gap-5 text-right">
                <div>
                  <p className="text-xs text-gray-400">Total spent</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatCurrency(summary.total_expenses, group.currency_code)}
                  </p>
                </div>
                {summary.you_owe > 0 && (
                  <div>
                    <p className="text-xs text-gray-400">You owe</p>
                    <p className="text-sm font-semibold text-red-600">
                      {formatCurrency(summary.you_owe, group.currency_code)}
                    </p>
                  </div>
                )}
                {summary.owed_to_you > 0 && (
                  <div>
                    <p className="text-xs text-gray-400">Owed to you</p>
                    <p className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(summary.owed_to_you, group.currency_code)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvite && <InviteModal group={group} onClose={() => setShowInvite(false)} />}
    </>
  )
}
