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

export function importGroupData(data: GroupExport): Group {
  const idMap: Record<string, string> = {}
  const newGroupId = generateId()
  idMap[data.group.id] = newGroupId

  const newMembers = data.group.members.map((m) => {
    const newId = generateId()
    idMap[m.id] = newId
    return { ...m, id: newId }
  })

  const newGroup: Group = {
    ...data.group,
    id: newGroupId,
    members: newMembers,
    name: `${data.group.name} (imported)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  saveGroup(newGroup)

  for (const expense of data.expenses) {
    saveExpense({
      ...expense,
      id: generateId(),
      groupId: newGroupId,
      paidBy: idMap[expense.paidBy] ?? expense.paidBy,
      splits: expense.splits.map((s) => ({ ...s, memberId: idMap[s.memberId] ?? s.memberId })),
      items: expense.items?.map((item) => ({
        ...item,
        id: generateId(),
        splits: item.splits.map((s) => ({ ...s, memberId: idMap[s.memberId] ?? s.memberId })),
      })),
    })
  }

  for (const payment of data.payments) {
    savePayment({
      ...payment,
      id: generateId(),
      groupId: newGroupId,
      fromMemberId: idMap[payment.fromMemberId] ?? payment.fromMemberId,
      toMemberId: idMap[payment.toMemberId] ?? payment.toMemberId,
    })
  }

  return newGroup
}
