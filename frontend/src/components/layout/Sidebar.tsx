import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UserCircle, LogOut, Plus, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/common/Avatar'
import { Logo } from '@/components/common/Logo'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import { useGroups } from '@/hooks/useGroups'
import { useLogout } from '@/hooks/useAuth'
import type { GroupSummary } from '@/types'

const GROUP_ICONS: Record<string, string> = {
  travel: '✈️',
  roommates: '🏠',
  friends: '👯',
  dinner: '🍽️',
  other: '👥',
}

function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400'
            : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

function GroupLink({ group }: { group: GroupSummary }) {
  const hasDebt = group.you_owe > 0
  const hasCredit = group.owed_to_you > 0

  return (
    <NavLink
      to={`/groups/${group.id}`}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors group',
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-medium'
            : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
        )
      }
    >
      <span className="text-base leading-none w-5 text-center">{GROUP_ICONS[group.type] ?? '👥'}</span>
      <span className="flex-1 truncate">{group.name}</span>
      {hasDebt && <span className="text-xs font-medium text-red-500 dark:text-red-400 shrink-0">−₹{group.you_owe.toFixed(0)}</span>}
      {hasCredit && !hasDebt && <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 shrink-0">+₹{group.owed_to_you.toFixed(0)}</span>}
    </NavLink>
  )
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { data: groups } = useGroups()
  const logout = useLogout()
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-4">
      {/* Logo */}
      <Link to="/" className="px-2 mb-6">
        <Logo size={26} />
      </Link>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5">
        <NavItem to="/" end icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
      </nav>

      {/* Groups */}
      <div className="mt-5 flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Groups</span>
          <button
            onClick={() => navigate('/?new=1')}
            className="p-0.5 rounded-md text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
            title="New group"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {groups?.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-zinc-600 px-3 py-2">No groups yet</p>
          )}
          {groups?.map((g) => <GroupLink key={g.id} group={g} />)}
        </div>
      </div>

      {/* Bottom: profile + theme toggle + sign out */}
      <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-0.5 mt-2">
        <NavItem to="/profile" icon={<UserCircle className="w-4 h-4" />} label="Profile" />

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <Link to="/profile" className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <Avatar name={user.name} src={user.avatar_url} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-zinc-100 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{user.email}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              className="p-1 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
