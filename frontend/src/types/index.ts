export type GroupType = 'travel' | 'roommates' | 'friends' | 'dinner' | 'other'
export type SplitType = 'equal' | 'percentage' | 'exact' | 'shares' | 'itemized'
export type ExpenseCategory =
  | 'food' | 'travel' | 'accommodation' | 'utilities'
  | 'entertainment' | 'shopping' | 'medical' | 'other'

export interface Member {
  id: string
  name: string
  color: string
}

export interface Group {
  id: string
  name: string
  description: string
  type: GroupType
  currency: string
  members: Member[]
  budget?: number
  createdAt: string
  updatedAt: string
}

export interface SplitEntry {
  memberId: string
  amount: number
  percentage?: number
  shares?: number
}

export interface ExpenseItem {
  id: string
  name: string
  amount: number
  splits: SplitEntry[]
}

export interface Expense {
  id: string
  groupId: string
  title: string
  amount: number          // always in group currency (used for all calculations)
  currency: string        // display currency of the original amount entered
  exchangeRate?: number   // 1 display-currency = exchangeRate group-currency (undefined when same)
  category: ExpenseCategory
  paidBy: string
  splitType: SplitType
  splits: SplitEntry[]
  items?: ExpenseItem[]
  date: string
  notes?: string
  receiptImage?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface ExpenseTemplate {
  id: string
  name: string
  title: string
  category: ExpenseCategory
  splitType: SplitType
  notes?: string
  createdAt: string
}

export interface Payment {
  id: string
  groupId: string
  fromMemberId: string
  toMemberId: string
  amount: number
  note?: string
  date: string
  createdAt: string
}

export interface Balance {
  memberId: string
  net: number
}

export interface Debt {
  from: string
  to: string
  amount: number
}
