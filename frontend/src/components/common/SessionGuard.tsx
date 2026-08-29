import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types'

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

async function loadProfile(userId: string): Promise<User | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (!data) return null
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatar_url: data.avatar_url,
    created_at: data.created_at,
  }
}

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const ready = useAuthStore((s) => s.ready)
  const setUser = useAuthStore((s) => s.setUser)
  const setReady = useAuthStore((s) => s.setReady)
  const navigate = useNavigate()

  useEffect(() => {
    // Restores the session from localStorage (if any) before first render.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session ? await loadProfile(session.user.id) : null)
      setReady(true)
    })

    // Keeps the store in sync with sign-in/out and background token refresh.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password', { replace: true })
        return
      }
      setUser(session ? await loadProfile(session.user.id) : null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setReady, navigate])

  if (!ready) return <Spinner />
  return <>{children}</>
}
