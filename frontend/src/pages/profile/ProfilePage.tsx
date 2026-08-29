import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, Save } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { useAuthStore } from '@/store/auth'
import { useLogout, useUpdateProfile } from '@/hooks/useAuth'
import { AVATAR_PRESETS, getPreset } from '@/lib/avatars'
import { AVATAR_SVG_MAP } from '@/components/common/AvatarSVGs'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const update = useUpdateProfile()

  const [name, setName] = useState(user?.name ?? '')
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url ?? 'avatar:0')

  const dirty = name !== (user?.name ?? '') || selectedAvatar !== (user?.avatar_url ?? '')

  useEffect(() => {
    setName(user?.name ?? '')
    setSelectedAvatar(user?.avatar_url ?? 'avatar:0')
  }, [user])

  function save() {
    update.mutate({ name: name || undefined, avatar_url: selectedAvatar })
  }

  const currentPreset = getPreset(selectedAvatar)

  return (
    <AppShell>
      <TopBar title="Profile" showBack />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back — desktop only */}
        <button
          onClick={() => navigate(-1)}
          className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-100 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Avatar preview */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3">
            <Avatar
              name={name || user?.name || '?'}
              src={selectedAvatar}
              size="lg"
              className="!w-20 !h-20 !text-3xl"
              animated
            />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">{name || user?.name}</p>
          <p className="text-sm text-gray-400 dark:text-zinc-500">{user?.email}</p>
          {currentPreset && (
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{currentPreset.label}</p>
          )}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Account info</p>
          </div>

          <div className="px-4 py-4 flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 block">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Email — read-only */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 block">Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800 cursor-not-allowed"
              />
            </div>

            {/* Avatar picker */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-3 block">Choose your avatar</label>
              <div className="grid grid-cols-5 gap-3">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedAvatar === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.id)}
                      className={cn(
                        'relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all duration-200',
                        isSelected
                          ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 scale-105'
                          : 'border-transparent hover:border-gray-200 dark:hover:border-zinc-700 hover:scale-105'
                      )}
                      title={preset.label}
                    >
                      <div
                        className={cn('w-11 h-11 rounded-full overflow-hidden shadow-md', isSelected && 'avatar-animated')}
                        style={{
                          background: preset.gradient,
                          ['--avatar-glow' as string]: preset.glow,
                        }}
                      >
                        {(() => { const S = AVATAR_SVG_MAP[preset.id]; return S ? <S /> : null })()}
                      </div>
                      <span className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 truncate w-full text-center">
                        {preset.label}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
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
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Session</p>
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
