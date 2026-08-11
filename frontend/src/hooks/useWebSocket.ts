import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { groupWS } from '@/lib/ws'
import { useAuthStore } from '@/store/auth'

export function useGroupWebSocket(groupId: string) {
  const token = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token || !groupId) return

    groupWS.connect(groupId, token)

    const unsub = groupWS.subscribe((event) => {
      switch (event.type) {
        case 'expense.created':
        case 'expense.updated':
        case 'expense.deleted':
          queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
          break
        case 'settlement.updated':
          queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
          queryClient.invalidateQueries({ queryKey: ['payments', groupId] })
          queryClient.invalidateQueries({ queryKey: ['groups'] })
          break
        case 'payment.created':
          queryClient.invalidateQueries({ queryKey: ['payments', groupId] })
          break
        case 'member.joined':
          queryClient.invalidateQueries({ queryKey: ['group', groupId] })
          break
      }
    })

    return () => {
      unsub()
      groupWS.disconnect()
    }
  }, [groupId, token, queryClient])
}
