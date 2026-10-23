import type { Group, Expense, Payment } from '@/types'

type WriteErrorHandler = (e: unknown) => void
let onWriteError: WriteErrorHandler | null = null
export function setStorageErrorHandler(handler: WriteErrorHandler) { onWriteError = handler }

const P = 'splititt_'

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(P + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

// Returns false when the write failed (usually storage full) — callers must
// not report success or discard the user's input in that case.
export function write<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(P + key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent('splititt:update', { detail: key }))
    return true
  } catch (e) {
    onWriteError?.(e)
    return false
  }
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

export function saveGroup(group: Group): boolean {
  const groups = getGroups()
  const idx = groups.findIndex((g) => g.id === group.id)
  if (idx >= 0) groups[idx] = group
  else groups.unshift(group)
  return write('groups', groups)
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

export function saveExpense(expense: Expense): boolean {
  const all = read<Record<string, Expense[]>>('expenses', {})
  const list = all[expense.groupId] ?? []
  const idx = list.findIndex((e) => e.id === expense.id)
  if (idx >= 0) list[idx] = expense
  else list.unshift(expense)
  all[expense.groupId] = list
  return write('expenses', all)
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

export function savePayment(payment: Payment): boolean {
  return savePayments([payment])
}

// One write for the whole batch, so "Settle all" can't half-succeed when storage is full.
export function savePayments(payments: Payment[]): boolean {
  const all = read<Record<string, Payment[]>>('payments', {})
  for (const p of payments) (all[p.groupId] ??= []).unshift(p)
  return write('payments', all)
}

export function deletePayment(groupId: string, id: string): void {
  const all = read<Record<string, Payment[]>>('payments', {})
  all[groupId] = (all[groupId] ?? []).filter((p) => p.id !== id)
  write('payments', all)
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export interface GroupExport {
  version: 1
  exportedAt: string
  group: Group
  expenses: Expense[]
  payments: Payment[]
}

export function exportGroupData(groupId: string): GroupExport | null {
  const group = getGroup(groupId)
  if (!group) return null
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    group,
    expenses: getExpenses(groupId),
    payments: getPayments(groupId),
  }
}

// Shape check for a user-picked backup file — anything else is rejected before it touches storage.
export function isGroupExport(d: unknown): d is GroupExport {
  const x = d as GroupExport
  return !!x && x.version === 1 && !!x.group && typeof x.group.name === 'string' &&
    Array.isArray(x.group.members) && Array.isArray(x.expenses) && Array.isArray(x.payments)
}

// Returns null if storage is full. The group is written last, so a failed
// import never shows up as a half-filled group.
export function importGroupData(data: GroupExport): Group | null {
  const idMap: Record<string, string> = {}
  const newGroupId = generateId()

  const newMembers = data.group.members.map((m) => {
    const newId = generateId()
    idMap[m.id] = newId
    return { ...m, id: newId }
  })
  const remap = (id: string) => idMap[id] ?? id
  const now = new Date().toISOString()

  const allExpenses = read<Record<string, Expense[]>>('expenses', {})
  allExpenses[newGroupId] = data.expenses.map((expense) => ({
    ...expense,
    id: generateId(),
    groupId: newGroupId,
    paidBy: remap(expense.paidBy),
    splits: expense.splits.map((s) => ({ ...s, memberId: remap(s.memberId) })),
    items: expense.items?.map((item) => ({
      ...item,
      id: generateId(),
      splits: item.splits.map((s) => ({ ...s, memberId: remap(s.memberId) })),
    })),
  }))
  if (!write('expenses', allExpenses)) return null

  const allPayments = read<Record<string, Payment[]>>('payments', {})
  allPayments[newGroupId] = data.payments.map((payment) => ({
    ...payment,
    id: generateId(),
    groupId: newGroupId,
    fromMemberId: remap(payment.fromMemberId),
    toMemberId: remap(payment.toMemberId),
  }))
  if (!write('payments', allPayments)) return null

  const newGroup: Group = {
    ...data.group,
    id: newGroupId,
    members: newMembers,
    name: `${data.group.name} (imported)`,
    createdAt: now,
    updatedAt: now,
  }
  return saveGroup(newGroup) ? newGroup : null
}
