import type { Group, Expense, Payment } from '@/types'

const P = 'splititt_'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(P + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(P + key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent('splititt:update', { detail: key }))
  } catch {}
}

export function generateId(): string {
  return crypto.randomUUID()
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export function getGroups(): Group[] {
  return read<Group[]>('groups', [])
}

export function getGroup(id: string): Group | null {
  return getGroups().find((g) => g.id === id) ?? null
}

export function saveGroup(group: Group): void {
  const groups = getGroups()
  const idx = groups.findIndex((g) => g.id === group.id)
  if (idx >= 0) groups[idx] = group
  else groups.unshift(group)
  write('groups', groups)
}

export function deleteGroup(id: string): void {
  write('groups', getGroups().filter((g) => g.id !== id))
  const expenses = read<Record<string, Expense[]>>('expenses', {})
  delete expenses[id]
  write('expenses', expenses)
  const payments = read<Record<string, Payment[]>>('payments', {})
  delete payments[id]
  write('payments', payments)
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export function getExpenses(groupId: string): Expense[] {
  return read<Record<string, Expense[]>>('expenses', {})[groupId] ?? []
}

export function getExpense(groupId: string, id: string): Expense | null {
  return getExpenses(groupId).find((e) => e.id === id) ?? null
}

export function saveExpense(expense: Expense): void {
  const all = read<Record<string, Expense[]>>('expenses', {})
  const list = all[expense.groupId] ?? []
  const idx = list.findIndex((e) => e.id === expense.id)
  if (idx >= 0) list[idx] = expense
  else list.unshift(expense)
  all[expense.groupId] = list
  write('expenses', all)
}

export function deleteExpense(groupId: string, id: string): void {
  const all = read<Record<string, Expense[]>>('expenses', {})
  all[groupId] = (all[groupId] ?? []).filter((e) => e.id !== id)
  write('expenses', all)
}

// ─── Payments ────────────────────────────────────────────────────────────────

export function getPayments(groupId: string): Payment[] {
  return read<Record<string, Payment[]>>('payments', {})[groupId] ?? []
}

export function savePayment(payment: Payment): void {
  const all = read<Record<string, Payment[]>>('payments', {})
  const list = all[payment.groupId] ?? []
  list.unshift(payment)
  all[payment.groupId] = list
  write('payments', all)
}

export function deletePayment(groupId: string, id: string): void {
  const all = read<Record<string, Payment[]>>('payments', {})
  all[groupId] = (all[groupId] ?? []).filter((p) => p.id !== id)
  write('payments', all)
}
