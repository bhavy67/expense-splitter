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

  return (
    <div className={cn('flex h-[100dvh] bg-[#fafaf7] dark:bg-[#0d0d0d] overflow-hidden', navH)}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto overscroll-none pb-nav-safe md:pb-0 bg-[#fafaf7] dark:bg-[#0d0d0d]" style={{ WebkitOverflowScrolling: 'touch' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
