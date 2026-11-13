import { Link, NavLink, useNavigate } from 'react-router-dom'
import { House, Plus, Sun, Moon, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/common/Logo'
import { IconTile } from '@/components/ui/IconTile'
import { GROUP_TYPE_ICONS } from '@/lib/icons'
import { useThemeStore } from '@/store/theme'
import { useGroups } from '@/hooks/useStore'
import type { Group } from '@/types'

const item = 'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-body-sm transition-colors duration-[120ms]'
const itemState = ({ isActive }: { isActive: boolean }) =>
  cn(item, isActive ? 'bg-surface-muted font-medium text-fg' : 'text-fg-muted hover:bg-surface-subtle hover:text-fg')

function GroupLink({ group }: { group: Group }) {
  return (
    <NavLink to={`/g/${group.id}`} className={itemState}>
      <IconTile icon={GROUP_TYPE_ICONS[group.type] ?? GROUP_TYPE_ICONS.other} size="sm" />
      <span className="min-w-0 flex-1 truncate">{group.name}</span>
      <span className="shrink-0 text-caption font-normal tabular-nums text-fg-subtle" aria-label={`${group.members.length} members`}>
        {group.members.length}
      </span>
    </NavLink>
  )
}

export function Sidebar() {
  const groups = useGroups()
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()

  return (
    <aside className="hidden md:flex sticky top-0 h-[100dvh] w-[248px] shrink-0 flex-col border-r border-border bg-bg px-3 py-4">
      <Link to="/" className="mb-6 px-2">
        <Logo size={26} />
      </Link>

      <nav className="flex flex-col gap-0.5">
        <NavLink to="/" end className={itemState}>
          <House className="size-4" />
          Dashboard
        </NavLink>
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto">
        <p className="mb-1 px-2.5 text-caption text-fg-subtle">Groups</p>
        <div className="flex flex-col gap-0.5">
          {groups.map((g) => <GroupLink key={g.id} group={g} />)}
          <button onClick={() => navigate('/?new=1')} className={cn(item, 'text-fg-muted hover:bg-surface-subtle hover:text-fg')}>
            <span className="flex size-6 items-center justify-center"><Plus className="size-4" /></span>
            New group
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-0.5 border-t border-border pt-3">
        <NavLink to="/privacy" className={itemState}>
          <Info className="size-4" />
          About & privacy
        </NavLink>
        <button onClick={toggle} className={cn(item, 'text-fg-muted hover:bg-surface-subtle hover:text-fg')}>
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}
