import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '@/store/auth'

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // No user in store → nothing to restore, render immediately
    if (!user) {
      setReady(true)
      return
    }
    // Token already in memory (e.g. hot reload in dev) → ready
    if (accessToken) {
      setReady(true)
      return
    }
    // User persisted but token gone (page refresh) → try to restore via cookie
    axios
      .post<{ access_token: string }>('/api/v1/auth/refresh', {}, { withCredentials: true })
      .then((res) => setAccessToken(res.data.access_token))
      .catch(() => clearAuth())
      .finally(() => setReady(true))
  }, []) // run once on mount only

  if (!ready) return <Spinner />
  return <>{children}</>
}
