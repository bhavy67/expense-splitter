import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/components/common/Toast'
import type { Expense, PaginatedResponse } from '@/types'
import type { AxiosError } from 'axios'

interface ExpenseFilters {
  page?: number
  per_page?: number
  paid_by?: string
  category?: string
  date_from?: string
  date_to?: string
}

export function useExpenses(groupId: string, filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ['expenses', groupId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const res = await api.get<PaginatedResponse<Expense>>(
        `/groups/${groupId}/expenses?${params}`
      )
      return res.data
    },
    enabled: !!groupId,
  })
}

export function useExpense(groupId: string, expenseId: string) {
  return useQuery({
    queryKey: ['expense', groupId, expenseId],
    queryFn: async () => {
      const res = await api.get<Expense>(`/groups/${groupId}/expenses/${expenseId}`)
      return res.data
    },
    enabled: !!groupId && !!expenseId,
  })
}

export interface UpdateExpensePayload {
  title?: string
  description?: string
  total_amount?: number
  category?: string
  paid_by?: string
  expense_date?: string
}

export function useUpdateExpense(groupId: string, expenseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateExpensePayload) => {
      const res = await api.put<Expense>(`/groups/${groupId}/expenses/${expenseId}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', groupId, expenseId] })
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Expense updated')
    },
    onError: (err: unknown) => {
      const e = err as AxiosError<{ detail: string }>
      toast.error(e.response?.data?.detail ?? 'Failed to update expense')
    },
  })
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (expenseId: string) => {
      await api.delete(`/groups/${groupId}/expenses/${expenseId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Expense deleted')
    },
    onError: (err: unknown) => {
      const e = err as AxiosError<{ detail: string }>
      toast.error(e.response?.data?.detail ?? 'Failed to delete expense')
    },
  })
}

export function useExpenseHistory(groupId: string, expenseId: string) {
  return useQuery({
    queryKey: ['expense-history', groupId, expenseId],
    queryFn: async () => {
      const res = await api.get<{ id: string; action: string; snapshot: Record<string, unknown>; created_at: string; changed_by: string }[]>(
        `/groups/${groupId}/expenses/${expenseId}/history`
      )
      return res.data
    },
    enabled: !!groupId && !!expenseId,
  })
}
