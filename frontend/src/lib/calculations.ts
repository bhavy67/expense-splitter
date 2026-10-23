import type { Expense, Payment, Member, Balance, Debt, SplitEntry, ExpenseItem } from '@/types'

export function calculateBalances(
  expenses: Expense[],
  payments: Payment[],
  members: Member[]
): Balance[] {
  const net: Record<string, number> = {}
  for (const m of members) net[m.id] = 0

  for (const expense of expenses) {
    net[expense.paidBy] = (net[expense.paidBy] ?? 0) + expense.amount
    for (const split of expense.splits) {
      net[split.memberId] = (net[split.memberId] ?? 0) - split.amount
    }
  }

  for (const payment of payments) {
    net[payment.fromMemberId] = (net[payment.fromMemberId] ?? 0) + payment.amount
    net[payment.toMemberId] = (net[payment.toMemberId] ?? 0) - payment.amount
  }

  return members.map((m) => ({
    memberId: m.id,
    net: Math.round((net[m.id] ?? 0) * 100) / 100,
  }))
}

// Greedy debt simplification — minimises number of transactions to settle all debts
export function simplifyDebts(balances: Balance[]): Debt[] {
  const creds = balances
    .filter((b) => b.net > 0.01)
    .sort((a, b) => b.net - a.net)
    .map((b) => ({ ...b }))
  const debts_ = balances
    .filter((b) => b.net < -0.01)
    .sort((a, b) => a.net - b.net)
    .map((b) => ({ ...b }))

  const result: Debt[] = []
  let ci = 0
  let di = 0

  while (ci < creds.length && di < debts_.length) {
    const credit = creds[ci]
    const debt = debts_[di]
    const amount = Math.min(credit.net, -debt.net)

    if (amount > 0.01) {
      result.push({
        from: debt.memberId,
        to: credit.memberId,
        amount: Math.round(amount * 100) / 100,
      })
    }

    credit.net -= amount
    debt.net += amount
    if (Math.abs(credit.net) < 0.01) ci++
    if (Math.abs(debt.net) < 0.01) di++
  }

  return result
}

export function getTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

export function buildEqualSplits(amount: number, memberIds: string[]): SplitEntry[] {
  if (memberIds.length === 0) return []
  const share = Math.round((amount / memberIds.length) * 100) / 100
  const splits = memberIds.map((id) => ({ memberId: id, amount: share }))
  // Distribute rounding remainder to first member
  const total = splits.reduce((s, e) => s + e.amount, 0)
  splits[0].amount = Math.round((splits[0].amount + (amount - total)) * 100) / 100
  return splits
}

// Above this, doubles start losing paise. ₹100 crore is far beyond any real split.
export const MAX_AMOUNT = 1_000_000_000

const paise = (n: number) => Math.round(n * 100) / 100

// Shares and percentages: each member gets weight/total of the amount; the last
// one absorbs rounding so the splits always add up to the amount.
export function buildWeightedSplits(amount: number, weights: { memberId: string; weight: number }[]): SplitEntry[] {
  const used = weights.filter((w) => w.weight > 0)
  const total = used.reduce((s, w) => s + w.weight, 0)
  const splits = used.map((w) => ({ memberId: w.memberId, amount: paise((w.weight / total) * amount) }))
  return absorbRemainder(splits, amount)
}

// Exact amounts: rounded to paise; the last one absorbs the (≤ ₹0.01) slack the form allows.
export function buildExactSplits(amount: number, entries: { memberId: string; amount: number }[]): SplitEntry[] {
  return absorbRemainder(entries.filter((e) => e.amount > 0).map((e) => ({ memberId: e.memberId, amount: paise(e.amount) })), amount)
}

function absorbRemainder(splits: SplitEntry[], amount: number): SplitEntry[] {
  if (splits.length === 0) return splits
  const sum = splits.reduce((s, e) => s + e.amount, 0)
  const last = splits[splits.length - 1]
  last.amount = paise(last.amount + amount - sum)
  return splits
}

// Each item is split equally among its members; per-member totals are summed
// and the last one absorbs rounding so the splits always add up to the total.
export function buildItemizedSplits(
  items: { id: string; name: string; amount: number; memberIds: string[] }[]
): { splits: SplitEntry[]; items: ExpenseItem[]; total: number } {
  const perMember: Record<string, number> = {}
  const outItems: ExpenseItem[] = []
  let total = 0
  for (const it of items) {
    if (it.amount <= 0 || it.memberIds.length === 0) continue
    const splits = buildEqualSplits(it.amount, it.memberIds)
    outItems.push({ id: it.id, name: it.name || 'Item', amount: it.amount, splits })
    for (const s of splits) perMember[s.memberId] = (perMember[s.memberId] ?? 0) + s.amount
    total += it.amount
  }
  total = Math.round(total * 100) / 100
  const splits = Object.entries(perMember)
    .filter(([, a]) => a > 0.001)
    .map(([memberId, a]) => ({ memberId, amount: Math.round(a * 100) / 100 }))
  if (splits.length > 0) {
    const sum = splits.reduce((s, e) => s + e.amount, 0)
    const last = splits[splits.length - 1]
    last.amount = Math.round((last.amount + total - sum) * 100) / 100
  }
  return { splits, items: outItems, total }
}

// A member who paid, owes, or appears in a payment can't be removed without
// breaking balances (their share would vanish from the totals).
export function isMemberInUse(memberId: string, expenses: Expense[], payments: Payment[]): boolean {
  return (
    expenses.some((e) =>
      e.paidBy === memberId ||
      e.splits.some((s) => s.memberId === memberId) ||
      e.items?.some((it) => it.splits.some((s) => s.memberId === memberId))
    ) ||
    payments.some((p) => p.fromMemberId === memberId || p.toMemberId === memberId)
  )
}
