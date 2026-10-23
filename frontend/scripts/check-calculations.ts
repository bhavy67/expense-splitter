// Run: npm test  (plain node + assert; Node ≥ 22.18 runs .ts directly)
import assert from 'node:assert/strict'
import { buildEqualSplits, buildItemizedSplits, buildWeightedSplits, buildExactSplits, calculateBalances, simplifyDebts, isMemberInUse } from '../src/lib/calculations.ts'

const sum = (xs: { amount: number }[]) => Math.round(xs.reduce((s, x) => s + x.amount, 0) * 100) / 100

// Equal split absorbs the rounding remainder
assert.equal(sum(buildEqualSplits(100, ['a', 'b', 'c'])), 100)

// Itemized: splits always add up to the item total (100/3 used to leave ₹0.01 owed to nobody)
const it = buildItemizedSplits([
  { id: '1', name: 'Pizza', amount: 100, memberIds: ['a', 'b', 'c'] },
  { id: '2', name: 'Cola', amount: 10, memberIds: ['b', 'c', 'a'] },
  { id: '3', name: 'Skipped', amount: 0, memberIds: ['a'] },
])
assert.equal(it.total, 110)
assert.equal(sum(it.splits), 110)
assert.equal(it.items.length, 2)
for (const item of it.items) assert.equal(sum(item.splits), item.amount)

// Balances net to zero, and settle-up covers every debt
const members = ['a', 'b', 'c'].map((id) => ({ id, name: id, color: '' }))
const exp = { id: 'e', groupId: 'g', title: 't', amount: 110, currency: 'INR', category: 'food' as const,
  paidBy: 'a', splitType: 'itemized' as const, splits: it.splits, date: '', createdAt: '', updatedAt: '' }
const bal = calculateBalances([exp], [], members)
assert.ok(Math.abs(bal.reduce((s, b) => s + b.net, 0)) < 0.005)
assert.equal(sum(simplifyDebts(bal)), bal.find((b) => b.memberId === 'a')!.net)

// Members referenced anywhere can't be removed (removing them broke the totals)
assert.equal(isMemberInUse('c', [exp], []), true)
assert.equal(isMemberInUse('z', [exp], []), false)
assert.equal(isMemberInUse('z', [], [{ id: 'p', groupId: 'g', fromMemberId: 'z', toMemberId: 'a', amount: 1, date: '', createdAt: '' }]), true)

// Shares 2:1:1 and percentages 33.33/33.33/33.34 always add up to the amount
assert.equal(sum(buildWeightedSplits(100, [{ memberId: 'a', weight: 2 }, { memberId: 'b', weight: 1 }, { memberId: 'c', weight: 1 }])), 100)
const pct = buildWeightedSplits(99.99, [{ memberId: 'a', weight: 33.33 }, { memberId: 'b', weight: 33.33 }, { memberId: 'c', weight: 33.34 }, { memberId: 'd', weight: 0 }])
assert.equal(sum(pct), 99.99)
assert.equal(pct.length, 3) // zero weight is left out

// Exact: the ≤ ₹0.01 slack the form allows is absorbed, and sub-paise input is rounded
assert.equal(sum(buildExactSplits(100, [{ memberId: 'a', amount: 50 }, { memberId: 'b', amount: 49.995 }])), 100)
assert.deepEqual(buildExactSplits(10, [{ memberId: 'a', amount: 0 }, { memberId: 'b', amount: 10 }]), [{ memberId: 'b', amount: 10 }])

const exp2 = (paidBy: string, amount: number, ids: string[]) =>
  ({ ...exp, paidBy, amount, splits: buildEqualSplits(amount, ids) })
const pay = (from: string, to: string, amount: number) =>
  ({ id: 'p', groupId: 'g', fromMemberId: from, toMemberId: to, amount, date: '', createdAt: '' })
const net = (b: { memberId: string; net: number }[], id: string) => b.find((x) => x.memberId === id)!.net

// Payer who isn't a participant is owed the full amount
const ab = members.slice(0, 2)
assert.equal(net(calculateBalances([exp2('c', 90, ['a', 'b'])], [], members), 'c'), 90)

// Settling clears balances; deleting the expense afterwards flips them (payment is kept)
const settled = calculateBalances([exp2('a', 100, ['a', 'b'])], [pay('b', 'a', 50)], ab)
assert.ok(settled.every((b) => b.net === 0))
assert.equal(net(calculateBalances([], [pay('b', 'a', 50)], ab), 'b'), 50)

// Single-member group: nothing to settle
assert.deepEqual(simplifyDebts(calculateBalances([exp2('a', 100, ['a'])], [], members.slice(0, 1))), [])

// ₹100 crore (the cap) still splits to the paise
assert.equal(sum(buildEqualSplits(1_000_000_000, ['a', 'b', 'c'])), 1_000_000_000)

// Backup import: ids are remapped consistently and balances survive the round trip
const mem = new Map<string, string>()
Object.assign(globalThis, {
  localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) },
  window: { dispatchEvent: () => true },
})
const { importGroupData, isGroupExport, getExpenses, getPayments } = await import('../src/lib/storage.ts')
const backup = { version: 1 as const, exportedAt: '', group: { id: 'g', name: 'Trip', description: '', type: 'travel' as const, currency: 'INR', members: ab, createdAt: '', updatedAt: '' },
  expenses: [exp2('a', 100, ['a', 'b'])], payments: [pay('b', 'a', 20)] }
assert.equal(isGroupExport(backup), true)
assert.equal(isGroupExport({ version: 1, group: {} }), false)
const imported = importGroupData(backup)!
const before = calculateBalances(backup.expenses, backup.payments, ab).map((b) => b.net)
const after = calculateBalances(getExpenses(imported.id), getPayments(imported.id), imported.members).map((b) => b.net)
assert.deepEqual(after, before)

console.log('calculations: all checks passed')
