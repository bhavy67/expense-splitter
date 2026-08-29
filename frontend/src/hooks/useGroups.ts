import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/common/Toast'
import type { ActivityItem, Group, GroupSummary } from '@/types'
import type { Database } from '@/lib/database.types'

type GroupType = Database['public']['Enums']['group_type']

function getErrorMessage(err: unknown) {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  return 'Something went wrong'
}

const GROUP_WITH_MEMBERS_SELECT =
  '*, members:group_members(role,joined_at,is_active,user:profiles(id,email,name,avatar_url,created_at))'

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_group_summaries')
      if (error) throw error
      return data as unknown as GroupSummary[]
    },
  })
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select(GROUP_WITH_MEMBERS_SELECT)
        .eq('id', groupId)
        .is('deleted_at', null)
        .single()
      if (error) throw error
      return data as unknown as Group
    },
    enabled: !!groupId,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; type: string; currency_code: string }) => {
      const userId = useAuthStore.getState().user?.id
      if (!userId) throw new Error('Not signed in')
      const { data: group, error } = await supabase
        .from('groups')
        .insert({ ...data, type: data.type as GroupType, created_by: userId })
        .select(GROUP_WITH_MEMBERS_SELECT)
        .single()
      if (error) throw error
      return group as unknown as Group
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success(`"${group.name}" created!`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name?: string; description?: string; type?: string }) => {
      const { data: group, error } = await supabase
        .from('groups')
        .update({ ...data, type: data.type as GroupType | undefined })
        .eq('id', groupId)
        .select(GROUP_WITH_MEMBERS_SELECT)
        .single()
      if (error) throw error
      return group as unknown as Group
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Group updated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('remove_group_member', { p_group_id: groupId, p_user_id: userId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      toast.success('Member removed')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useLeaveGroup(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('leave_group', { p_group_id: groupId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useJoinGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: groupId, error } = await supabase.rpc('join_group', { p_invite_code: inviteCode })
      if (error) throw error
      const { data: group, error: fetchErr } = await supabase
        .from('groups')
        .select(GROUP_WITH_MEMBERS_SELECT)
        .eq('id', groupId)
        .single()
      if (fetchErr) throw fetchErr
      return group as unknown as Group
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success(`Joined "${group.name}"!`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useGroupActivity(groupId: string) {
  return useQuery({
    queryKey: ['group-activity', groupId],
    queryFn: async () => {
      const { data: activity, error } = await supabase
        .from('group_activity')
        .select('*')
        .eq('group_id', groupId)
        .order('occurred_at', { ascending: false })
        .limit(50)
      if (error) throw error

      const actorIds = [...new Set((activity ?? []).map((a) => a.actor_id).filter((id): id is string => id != null))]
      const { data: profiles } = actorIds.length
        ? await supabase.from('profiles').select('id, name, avatar_url').in('id', actorIds)
        : { data: [] }

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
      return (activity ?? []).map((item) => ({
        ...item,
        actor: item.actor_id != null ? (profileMap[item.actor_id] ?? null) : null,
      })) as ActivityItem[]
    },
    enabled: !!groupId,
  })
}

export function useRegenerateInvite(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: inviteCode, error } = await supabase.rpc('regenerate_invite_code', { p_group_id: groupId })
      if (error) throw error
      return { invite_code: inviteCode, invite_url: `/join/${inviteCode}` }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      toast.success('New invite link generated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
