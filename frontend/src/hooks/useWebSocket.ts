import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Live group updates via Supabase Realtime (Postgres change feeds) instead
// of the old Redis pub/sub + custom /ws endpoint. RLS still applies to
// these subscriptions, so this only ever receives rows the signed-in user
// is already allowed to read.
export function useGroupWebSocket(groupId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!groupId) return

    const filter = `group_id=eq.${groupId}`
    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements', filter },
        () => {
          queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
          queryClient.invalidateQueries({ queryKey: ['payments', groupId] })
          queryClient.invalidateQueries({ queryKey: ['groups'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter },
        () => {
          queryClient.invalidateQueries({ queryKey: ['payments', groupId] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter },
        () => {
          queryClient.invalidateQueries({ queryKey: ['group', groupId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, queryClient])
}
