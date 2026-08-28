import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/common/Toast'
import type { Payment, Settlement } from '@/types'

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  return fallback
}

export function useSettlements(groupId: string) {
  return useQuery({
    queryKey: ['settlements', groupId],
    queryFn: async () => {
      const { data, error } = await supabase.from('settlements').select('*').eq('group_id', groupId)
      if (error) throw error
      return data as Settlement[]
    },
    enabled: !!groupId,
  })
}

export function usePayments(groupId: string) {
  return useQuery({
    queryKey: ['payments', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Payment[]
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
      const { data: payment, error } = await supabase.rpc('create_payment', {
        p_group_id: groupId,
        p_from_user_id: data.from_user_id,
        p_to_user_id: data.to_user_id,
        p_amount: data.amount,
        p_currency_code: data.currency_code ?? 'INR',
        p_note: data.note,
        p_payment_method: (data.payment_method ?? 'cash') as 'cash' | 'upi' | 'razorpay' | 'bank_transfer' | 'other',
      })
      if (error) throw error
      return payment as Payment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', groupId] })
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      toast.success('Payment recorded')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to record payment')),
  })
}

export function useConfirmPayment(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase.rpc('confirm_payment', { p_payment_id: paymentId })
      if (error) throw error
      return data as Payment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', groupId] })
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Payment confirmed')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to confirm payment')),
  })
}
