import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useJoinGroup } from '@/hooks/useGroups'
import { useAuthStore } from '@/store/auth'

export default function JoinGroupPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const join = useJoinGroup()
  const attempted = useRef(false)

  useEffect(() => {
    // Redirect to login first if not authenticated, preserving the invite URL
    if (!user) {
      navigate(`/auth/login?next=/join/${inviteCode}`, { replace: true })
      return
    }
    // Auto-join once on mount
    if (!attempted.current && inviteCode) {
      attempted.current = true
      join.mutate(inviteCode, {
        onSuccess: (group) => navigate(`/groups/${group.id}`, { replace: true }),
      })
    }
  }, [user, inviteCode]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-indigo-600" />
        </div>

        {join.isPending && (
          <>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Joining group…</h1>
            <p className="text-sm text-gray-500">Just a moment</p>
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mt-5" />
          </>
        )}

        {join.isError && (
          <>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Couldn't join</h1>
            <p className="text-sm text-gray-500 mb-6">
              {(join.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
                ?? 'The invite link may be invalid or expired.'}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => navigate('/')}>
                Go home
              </Button>
              <Button className="flex-1" onClick={() => join.mutate(inviteCode!)}>
                Try again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
