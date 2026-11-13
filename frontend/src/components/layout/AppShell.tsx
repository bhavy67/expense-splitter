import { useLocation } from 'react-router-dom'
import { cn, hidesBottomNav } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()
  // --bottom-nav-h lets fixed bars (StickyActionBar) clear the nav without knowing about it.
  const navH = hidesBottomNav(pathname) ? '[--bottom-nav-h:0px]' : '[--bottom-nav-h:4rem] md:[--bottom-nav-h:0px]'
  // --sidebar-w does the same for the desktop sidebar (w-[248px] in Sidebar).

  return (
    <div className={cn('flex h-[100dvh] overflow-hidden bg-bg text-fg md:[--sidebar-w:248px]', navH)}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto overscroll-none pb-nav-safe md:pb-0 bg-bg" style={{ WebkitOverflowScrolling: 'touch' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
