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
          'flex items-center gap-3 px-3 py-2 rounded text-sm font-bold uppercase tracking-[0.06em] transition-colors',
          isActive
            ? 'bg-[#0a0a0a] dark:bg-[#b9f542] text-[#b9f542] dark:text-[#0a0a0a]'
            : 'text-[#0a0a0a]/60 dark:text-[#f0ede5]/60 hover:bg-[#0a0a0a]/5 dark:hover:bg-white/10 hover:text-[#0a0a0a] dark:hover:text-[#f0ede5]'
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
          'flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors',
          isActive
            ? 'bg-[#0a0a0a] dark:bg-[#b9f542] text-[#b9f542] dark:text-[#0a0a0a] font-bold'
            : 'text-[#0a0a0a]/60 dark:text-[#f0ede5]/60 hover:bg-[#0a0a0a]/5 dark:hover:bg-white/10 hover:text-[#0a0a0a] dark:hover:text-[#f0ede5]'
        )
      }
    >
      <span className="text-base leading-none w-5 text-center shrink-0">{GROUP_ICONS[group.type] ?? '👥'}</span>
      <span className="flex-1 truncate">{group.name}</span>
      <span className="text-[10px] font-mono text-[#0a0a0a]/30 dark:text-[#f0ede5]/30 shrink-0">{group.members.length}p</span>
    </NavLink>
  )
}

export function Sidebar() {
  const groups = useGroups()
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r-2 border-[#0a0a0a] dark:border-[#b9f542] bg-[#fafaf7] dark:bg-[#0d0d0d] px-3 py-4">
      <Link to="/" className="px-2 mb-6">
        <Logo size={26} />
      </Link>

      <nav className="flex flex-col gap-0.5">
        <NavItem to="/" end icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
      </nav>

      <div className="mt-5 flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-[9px] font-bold text-[#0a0a0a]/30 dark:text-[#f0ede5]/30 uppercase tracking-[0.15em] font-mono">Groups</span>
          <button
            onClick={() => navigate('/?new=1')}
            className="p-0.5 rounded text-[#0a0a0a]/40 dark:text-[#f0ede5]/40 hover:text-[#b9f542] hover:bg-[#0a0a0a]/5 dark:hover:bg-white/10 transition-colors"
            title="New group"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          {groups.length === 0 && (
            <p className="text-xs font-medium text-[#4a4940] dark:text-[#a09880] px-3 py-2">No groups yet</p>
          )}
          {groups.map((g) => <GroupLink key={g.id} group={g} />)}
        </div>
      </div>

      <div className="pt-3 border-t-2 border-[#0a0a0a]/20 dark:border-[#b9f542]/30 flex flex-col gap-0.5 mt-2">
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded text-sm font-bold uppercase tracking-[0.06em] text-[#0a0a0a]/60 dark:text-[#f0ede5]/60 hover:bg-[#0a0a0a]/5 dark:hover:bg-white/10 hover:text-[#0a0a0a] dark:hover:text-[#f0ede5] transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}
