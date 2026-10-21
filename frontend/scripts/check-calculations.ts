// Run: npm test  (plain node + assert; Node ≥ 22.18 runs .ts directly)
import assert from 'node:assert/strict'
import { buildEqualSplits, buildItemizedSplits, calculateBalances, simplifyDebts, isMemberInUse } from '../src/lib/calculations.ts'

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

console.log('calculations: all checks passed')
