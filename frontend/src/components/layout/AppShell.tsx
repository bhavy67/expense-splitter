import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-[#fafaf7] dark:bg-[#0d0d0d] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-[#fafaf7] dark:bg-[#0d0d0d]">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
