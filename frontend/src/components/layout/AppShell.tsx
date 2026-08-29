import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-gray-50 dark:bg-zinc-950">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
