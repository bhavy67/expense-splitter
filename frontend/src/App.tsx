import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ToastProvider } from '@/components/common/Toast'
import { InstallPrompt } from '@/components/common/InstallPrompt'
import { UpdateBanner } from '@/components/common/UpdateBanner'

// The landing route loads eagerly: one less round trip before first content.
import DashboardPage from '@/pages/dashboard/DashboardPage'
const GroupPage         = lazy(() => import('@/pages/groups/GroupPage'))
const GroupSettingsPage = lazy(() => import('@/pages/groups/GroupSettingsPage'))
const AddExpensePage    = lazy(() => import('@/pages/expenses/AddExpensePage'))
const ExpenseDetailPage = lazy(() => import('@/pages/expenses/ExpenseDetailPage'))
const AboutPage         = lazy(() => import('@/pages/about/AboutPage'))
const NotFoundPage      = lazy(() => import('@/pages/NotFoundPage'))
// Dev-only kitchen sink; `import.meta.env.DEV` is false in builds, so the chunk is dropped.
const KitchenSinkPage   = import.meta.env.DEV ? lazy(() => import('@/pages/dev/KitchenSinkPage')) : null
const SeedPage          = import.meta.env.DEV ? lazy(() => import('@/pages/dev/SeedPage')) : null

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-bg">
      <div className="w-6 h-6 border-2 border-fg border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/"                                    element={<DashboardPage />} />
          <Route path="/g/:groupId"                          element={<GroupPage />} />
          <Route path="/g/:groupId/expenses/new"             element={<AddExpensePage />} />
          <Route path="/g/:groupId/expenses/:expenseId"      element={<ExpenseDetailPage />} />
          <Route path="/g/:groupId/settings"                 element={<GroupSettingsPage />} />
          <Route path="/privacy"                             element={<AboutPage />} />
          {KitchenSinkPage && <Route path="/__ui"            element={<KitchenSinkPage />} />}
          {SeedPage && <Route path="/__seed"                 element={<SeedPage />} />}
          <Route path="*"                                    element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <ToastProvider />
      <InstallPrompt />
      <UpdateBanner />
    </>
  )
}
