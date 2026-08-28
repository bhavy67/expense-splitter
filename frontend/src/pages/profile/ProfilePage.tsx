import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, Save } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { useAuthStore } from '@/store/auth'
import { useLogout, useUpdateProfile } from '@/hooks/useAuth'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const update = useUpdateProfile()

  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '')
  const dirty = name !== (user?.name ?? '') || avatarUrl !== (user?.avatar_url ?? '')

  useEffect(() => {
    setName(user?.name ?? '')
    setAvatarUrl(user?.avatar_url ?? '')
  }, [user])

  function save() {
    update.mutate({
      name: name || undefined,
      avatar_url: avatarUrl || undefined,
    })
  }

  return (
    <AppShell>
      <TopBar title="Profile" showBack />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back — desktop only */}
        <button
          onClick={() => navigate(-1)}
          className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Avatar preview */}
        <div className="flex flex-col items-center mb-8">
          <Avatar
            name={name || user?.name || '?'}
            src={avatarUrl || null}
            size="lg"
            className="!w-20 !h-20 !text-2xl mb-3"
          />
          <p className="text-lg font-bold text-gray-900">{name || user?.name}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Account info</p>
          </div>

          <div className="px-4 py-4 flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Email — read-only */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                Avatar URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="px-4 pb-4">
            <Button
              className="w-full"
              disabled={!dirty || !name.trim()}
              loading={update.isPending}
              onClick={save}
            >
              <Save className="w-4 h-4" />
              Save changes
            </Button>
          </div>
        </div>

        {/* Sign out */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Session</p>
          </div>
          <div className="px-4 py-4">
            <Button variant="danger" className="w-full" onClick={logout}>
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
