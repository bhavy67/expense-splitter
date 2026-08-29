import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, callEdgeFunction } from '@/lib/supabase'
import { toast } from '@/components/common/Toast'
import { useAuthStore } from '@/store/auth'
import type { Expense, ExpenseComment, PaginatedResponse } from '@/types'
import type { Database } from '@/lib/database.types'

const EXPENSE_SELECT =
  '*, splits:expense_splits(id,user_id,amount,percentage), items:expense_items(id,description,amount,splits:expense_splits(id,user_id,amount,percentage))'

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  return fallback
}

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
      const page = filters.page ?? 1
      const perPage = filters.per_page ?? 20
      const from = (page - 1) * perPage
      const to = from + perPage - 1

      let query = supabase
        .from('expenses')
        .select(EXPENSE_SELECT, { count: 'exact' })
        .eq('group_id', groupId)
        .is('deleted_at', null)

      if (filters.paid_by) query = query.eq('paid_by', filters.paid_by)
      if (filters.category) {
        query = query.eq('category', filters.category as Database['public']['Enums']['expense_category'])
      }
      if (filters.date_from) query = query.gte('expense_date', filters.date_from)
      if (filters.date_to) query = query.lte('expense_date', filters.date_to)

      const { data, count, error } = await query
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error

      return {
        data: (data ?? []) as unknown as Expense[],
        total: count ?? 0,
        page,
        per_page: perPage,
      } satisfies PaginatedResponse<Expense>
    },
    enabled: !!groupId,
  })
}

export function useExpense(groupId: string, expenseId: string) {
  return useQuery({
    queryKey: ['expense', groupId, expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(EXPENSE_SELECT)
        .eq('id', expenseId)
        .eq('group_id', groupId)
        .is('deleted_at', null)
        .single()
      if (error) throw error
      return data as unknown as Expense
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
    mutationFn: (payload: UpdateExpensePayload) =>
      callEdgeFunction<Expense>(`expenses/${groupId}/${expenseId}`, 'PUT', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', groupId, expenseId] })
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Expense updated')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to update expense')),
  })
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (expenseId: string) => callEdgeFunction<void>(`expenses/${groupId}/${expenseId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] })
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Expense deleted')
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to delete expense')),
  })
}

export function useComments(expenseId: string) {
  return useQuery({
    queryKey: ['comments', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_comments')
        .select('*, user:profiles!user_id(id, name, avatar_url)')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as ExpenseComment[]
    },
    enabled: !!expenseId,
  })
}

export function useAddComment(expenseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (content: string) => {
      const userId = useAuthStore.getState().user?.id
      if (!userId) throw new Error('Not signed in')
      const { error } = await supabase
        .from('expense_comments')
        .insert({ expense_id: expenseId, user_id: userId, content })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', expenseId] })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to post comment')),
  })
}

export function useExpenseHistory(groupId: string, expenseId: string) {
  return useQuery({
    queryKey: ['expense-history', groupId, expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_audit')
        .select('*')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as {
        id: string
        action: string
        snapshot: Record<string, unknown>
        created_at: string
        changed_by: string
      }[]
    },
    enabled: !!groupId && !!expenseId,
  })
}
