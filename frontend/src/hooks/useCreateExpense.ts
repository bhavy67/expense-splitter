import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callEdgeFunction } from '@/lib/supabase'
import { toast } from '@/components/common/Toast'
import type { Expense } from '@/types'

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
    mutationFn: (payload: CreateExpensePayload) => callEdgeFunction<Expense>(`expenses/${groupId}`, 'POST', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Expense added')
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to add expense'
      toast.error(message)
    },
  })
}
