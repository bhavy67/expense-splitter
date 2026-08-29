import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth'
import { ToastProvider } from '@/components/common/Toast'

// Auth pages are eagerly imported — they're always the entry point so lazy
// loading them causes a visible flash on first navigation between login/register.
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const GroupPage = lazy(() => import('@/pages/groups/GroupPage'))
const AddExpensePage = lazy(() => import('@/pages/expenses/AddExpensePage'))
const ExpenseDetailPage = lazy(() => import('@/pages/expenses/ExpenseDetailPage'))
const JoinGroupPage = lazy(() => import('@/pages/groups/JoinGroupPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const GroupSettingsPage = lazy(() => import('@/pages/groups/GroupSettingsPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}

export default function App() {
  const location = useLocation()

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            {/* Auth */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

            {/* Invite */}
            <Route path="/join/:inviteCode" element={<JoinGroupPage />} />

            {/* Protected */}
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/groups/:groupId" element={<ProtectedRoute><GroupPage /></ProtectedRoute>} />
            <Route path="/groups/:groupId/expenses/new" element={<ProtectedRoute><AddExpensePage /></ProtectedRoute>} />
            <Route path="/groups/:groupId/expenses/:expenseId" element={<ProtectedRoute><ExpenseDetailPage /></ProtectedRoute>} />
            <Route path="/groups/:groupId/settings" element={<ProtectedRoute><GroupSettingsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      <ToastProvider />
    </>
  )
}
