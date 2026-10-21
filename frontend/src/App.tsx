import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { ToastProvider } from '@/components/common/Toast'
import { InstallPrompt } from '@/components/common/InstallPrompt'
import { UpdateBanner } from '@/components/common/UpdateBanner'

const DashboardPage     = lazy(() => import('@/pages/dashboard/DashboardPage'))
const GroupPage         = lazy(() => import('@/pages/groups/GroupPage'))
const GroupSettingsPage = lazy(() => import('@/pages/groups/GroupSettingsPage'))
const AddExpensePage    = lazy(() => import('@/pages/expenses/AddExpensePage'))
const ExpenseDetailPage = lazy(() => import('@/pages/expenses/ExpenseDetailPage'))
const AboutPage         = lazy(() => import('@/pages/about/AboutPage'))
const NotFoundPage      = lazy(() => import('@/pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#fafaf7] dark:bg-[#0d0d0d]">
      <div className="w-6 h-6 border-2 border-[#b9f542] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/"                                    element={<DashboardPage />} />
            <Route path="/g/:groupId"                          element={<GroupPage />} />
            <Route path="/g/:groupId/expenses/new"             element={<AddExpensePage />} />
            <Route path="/g/:groupId/expenses/:expenseId"      element={<ExpenseDetailPage />} />
            <Route path="/g/:groupId/settings"                 element={<GroupSettingsPage />} />
            <Route path="/privacy"                             element={<AboutPage />} />
            <Route path="*"                                    element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      <ToastProvider />
      <InstallPrompt />
      <UpdateBanner />
    </MotionConfig>
  )
}
