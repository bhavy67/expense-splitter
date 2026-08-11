import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/components/common/Toast'
import type { Payment, Settlement } from '@/types'
import type { AxiosError } from 'axios'

export function useSettlements(groupId: string) {
  return useQuery({
    queryKey: ['settlements', groupId],
    queryFn: async () => {
      const res = await api.get<Settlement[]>(`/groups/${groupId}/settlements`)
      return res.data
    },
    enabled: !!groupId,
  })
}

export function usePayments(groupId: string) {
  return useQuery({
    queryKey: ['payments', groupId],
    queryFn: async () => {
      const res = await api.get<Payment[]>(`/groups/${groupId}/payments`)
      return res.data
    },
    enabled: !!groupId,
  })
}

export function useRecordPayment(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      from_user_id: string
      to_user_id: string
      amount: number
      currency_code?: string
      note?: string
      payment_method?: string
    }) => {
      const res = await api.post<Payment>(`/groups/${groupId}/payments`, {
        currency_code: 'INR',
        payment_method: 'cash',
        ...data,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', groupId] })
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      toast.success('Payment recorded')
    },
    onError: (err: unknown) => {
      const e = err as AxiosError<{ detail: string }>
      toast.error(e.response?.data?.detail ?? 'Failed to record payment')
    },
  })
}

export function useConfirmPayment(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await api.put<Payment>(
        `/groups/${groupId}/payments/${paymentId}/confirm`
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', groupId] })
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Payment confirmed')
    },
    onError: (err: unknown) => {
      const e = err as AxiosError<{ detail: string }>
      toast.error(e.response?.data?.detail ?? 'Failed to confirm payment')
    },
  })
}
