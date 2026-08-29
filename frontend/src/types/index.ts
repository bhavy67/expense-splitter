export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
}

export interface Currency {
  code: string
  symbol: string
  name: string
}

export type GroupType = 'travel' | 'roommates' | 'friends' | 'dinner' | 'other'
export type SplitType = 'equal' | 'percentage' | 'exact' | 'itemized'
export type ExpenseCategory = 'food' | 'travel' | 'accommodation' | 'utilities' | 'entertainment' | 'other'

export interface GroupMember {
  user: User
  role: 'admin' | 'member'
  joined_at: string
  is_active: boolean
}

export interface Group {
  id: string
  name: string
  description: string | null
  type: GroupType
  currency_code: string
  invite_code: string
  created_by: string
  created_at: string
  members: GroupMember[]
}

export interface GroupSummary {
  id: string
  name: string
  type: GroupType
  currency_code: string
  member_count: number
  total_expenses: number
  you_owe: number
  owed_to_you: number
}

export interface ExpenseSplit {
  id: string
  user_id: string
  amount: number
  percentage: number | null
}

export interface ExpenseItem {
  id: string
  description: string
  amount: number
  splits: ExpenseSplit[]
}

export interface Expense {
  id: string
  group_id: string
  title: string
  description: string | null
  total_amount: number
  currency_code: string
  split_type: SplitType
  category: ExpenseCategory
  paid_by: string
  expense_date: string
  created_by: string
  created_at: string
  updated_at: string
  splits: ExpenseSplit[]
  items: ExpenseItem[]
}

export interface Settlement {
  id: string
  from_user_id: string
  to_user_id: string
  amount: number
  currency_code: string
  computed_at: string
}

export interface Payment {
  id: string
  group_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  currency_code: string
  note: string | null
  payment_method: string
  created_at: string
  confirmed_at: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

export interface ApiError {
  error: {
    code: string
    message: string
    detail?: string
    status: number
  }
}

export interface ExpenseComment {
  id: string
  expense_id: string
  user_id: string
  content: string
  created_at: string
  user: Pick<User, 'id' | 'name' | 'avatar_url'>
}

export interface ActivityItem {
  activity_type: 'expense_created' | 'expense_edited' | 'payment_recorded'
  group_id: string
  entity_id: string
  entity_title: string | null
  total_amount: number | null
  actor_id: string
  occurred_at: string
  actor: Pick<User, 'id' | 'name' | 'avatar_url'> | null
}
