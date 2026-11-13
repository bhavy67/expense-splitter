import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { House, Plus, Info } from 'lucide-react'
import { cn, hidesBottomNav } from '@/lib/utils'

function Tab({ to, end, icon: Icon, label }: { to: string; end?: boolean; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'relative flex h-full min-w-16 flex-col items-center justify-center gap-1 transition-colors duration-[120ms]',
          isActive ? 'text-fg' : 'text-fg-subtle hover:text-fg'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-fg" aria-hidden />}
          <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} />
          <span className="text-[11px] font-medium">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (hidesBottomNav(pathname)) return null
  // Inside a group the + adds an expense; everywhere else it creates a group.
  const groupId = pathname.match(/^\/g\/([^/]+)/)?.[1]

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 pb-safe backdrop-blur">
      <div className="flex h-16 items-center justify-around px-4">
        <Tab to="/" end icon={House} label="Home" />
        <button
          aria-label={groupId ? 'Add expense' : 'New group'}
          onClick={() => navigate(groupId ? `/g/${groupId}/expenses/new` : '/?new=1')}
          className="flex size-12 items-center justify-center rounded-full bg-inverse-bg text-inverse-fg shadow-float transition-transform duration-[120ms] ease-out active:scale-95"
        >
          <Plus className="size-6" strokeWidth={2} />
        </button>
        <Tab to="/privacy" icon={Info} label="About" />
      </div>
    </nav>
  )
}
