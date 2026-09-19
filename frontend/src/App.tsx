import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ToastProvider } from '@/components/common/Toast'
import { InstallPrompt } from '@/components/common/InstallPrompt'

const DashboardPage     = lazy(() => import('@/pages/dashboard/DashboardPage'))
const GroupPage         = lazy(() => import('@/pages/groups/GroupPage'))
const GroupSettingsPage = lazy(() => import('@/pages/groups/GroupSettingsPage'))
const AddExpensePage    = lazy(() => import('@/pages/expenses/AddExpensePage'))
const ExpenseDetailPage = lazy(() => import('@/pages/expenses/ExpenseDetailPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fafaf7] dark:bg-[#0d0d0d]">
      <div className="w-6 h-6 border-2 border-[#b9f542] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/"                                    element={<DashboardPage />} />
            <Route path="/g/:groupId"                          element={<GroupPage />} />
            <Route path="/g/:groupId/expenses/new"             element={<AddExpensePage />} />
            <Route path="/g/:groupId/expenses/:expenseId"      element={<ExpenseDetailPage />} />
            <Route path="/g/:groupId/settings"                 element={<GroupSettingsPage />} />
            <Route path="*"                                    element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      <ToastProvider />
      <InstallPrompt />
    </>
  )
}
