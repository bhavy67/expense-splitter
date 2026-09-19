import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-[100dvh] bg-[#fafaf7] dark:bg-[#0d0d0d] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overscroll-none pb-nav-safe md:pb-0 bg-[#fafaf7] dark:bg-[#0d0d0d]" style={{ WebkitOverflowScrolling: 'touch' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
