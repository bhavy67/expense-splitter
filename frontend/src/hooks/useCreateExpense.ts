import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/components/common/Toast'
import type { Expense } from '@/types'
import type { AxiosError } from 'axios'

export interface SplitEntryPayload {
  user_id: string
  amount?: number
  percentage?: number
}

export interface ItemPayload {
  description: string
  amount: number
  splits: SplitEntryPayload[]
}

export interface CreateExpensePayload {
  title: string
  description?: string
  total_amount: number
  currency_code: string
  split_type: 'equal' | 'percentage' | 'exact' | 'itemized'
  category: string
  paid_by: string
  expense_date: string
  splits: SplitEntryPayload[]
  items: ItemPayload[]
}

export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      const res = await api.post<Expense>(`/groups/${groupId}/expenses`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Expense added')
    },
    onError: (err: unknown) => {
      const e = err as AxiosError<{ detail: string | { msg: string }[] }>
      const detail = e.response?.data?.detail
      if (typeof detail === 'string') toast.error(detail)
      else if (Array.isArray(detail)) toast.error(detail[0]?.msg ?? 'Validation error')
      else toast.error('Failed to add expense')
    },
  })
}
