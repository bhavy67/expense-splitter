import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plus, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/common/Logo'
import { useThemeStore } from '@/store/theme'
import { useGroups } from '@/hooks/useStore'
import type { Group } from '@/types'

const GROUP_ICONS: Record<string, string> = {
  travel: '✈️', roommates: '🏠', friends: '👯', dinner: '🍽️', other: '👥',
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

function GroupLink({ group }: { group: Group }) {
  return (
    <NavLink
      to={`/g/${group.id}`}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors',
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-medium'
            : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
        )
      }
    >
      <span className="text-base leading-none w-5 text-center shrink-0">{GROUP_ICONS[group.type] ?? '👥'}</span>
      <span className="flex-1 truncate">{group.name}</span>
      <span className="text-xs text-gray-400 dark:text-zinc-600 shrink-0">{group.members.length}p</span>
    </NavLink>
  )
}

export function Sidebar() {
  const groups = useGroups()
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-4">
      <Link to="/" className="px-2 mb-6">
        <Logo size={26} />
      </Link>

      <nav className="flex flex-col gap-0.5">
        <NavItem to="/" end icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
      </nav>

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
          {groups.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-zinc-600 px-3 py-2">No groups yet</p>
          )}
          {groups.map((g) => <GroupLink key={g.id} group={g} />)}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-0.5 mt-2">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}
