import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { PageTransition } from '@/components/common/PageTransition'
import { Button } from '@/components/common/Button'

export default function ExpenseDetailPage() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <TopBar title="Expense" showBack />
      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-3xl">
            🧾
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Expense Detail</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-xs">
            Full expense details, editing, and comments are coming in Phase 3.
          </p>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </PageTransition>
    </AppShell>
  )
}
