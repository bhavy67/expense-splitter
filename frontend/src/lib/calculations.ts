import type { Expense, Payment, Member, Balance, Debt } from '@/types'

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

export function buildEqualSplits(amount: number, memberIds: string[]): import('@/types').SplitEntry[] {
  if (memberIds.length === 0) return []
  const share = Math.round((amount / memberIds.length) * 100) / 100
  const splits = memberIds.map((id) => ({ memberId: id, amount: share }))
  // Distribute rounding remainder to first member
  const total = splits.reduce((s, e) => s + e.amount, 0)
  splits[0].amount = Math.round((splits[0].amount + (amount - total)) * 100) / 100
  return splits
}
