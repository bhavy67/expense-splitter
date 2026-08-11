import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/components/common/Toast'
import type { Group, GroupSummary } from '@/types'
import type { AxiosError } from 'axios'

function getErrorMessage(err: unknown) {
  const e = err as AxiosError<{ detail: string }>
  return e.response?.data?.detail ?? 'Something went wrong'
}

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await api.get<GroupSummary[]>('/groups')
      return res.data
    },
  })
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const res = await api.get<Group>(`/groups/${groupId}`)
      return res.data
    },
    enabled: !!groupId,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      type: string
      currency_code: string
    }) => {
      const res = await api.post<Group>('/groups', data)
      return res.data
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
      const res = await api.put<Group>(`/groups/${groupId}`, data)
      return res.data
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
      await api.delete(`/groups/${groupId}/members/${userId}`)
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
      await api.post(`/groups/${groupId}/leave`)
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
      const res = await api.post<Group>(`/groups/join/${inviteCode}`)
      return res.data
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success(`Joined "${group.name}"!`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRegenerateInvite(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ invite_code: string; invite_url: string }>(
        `/groups/${groupId}/invite`
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      toast.success('New invite link generated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
