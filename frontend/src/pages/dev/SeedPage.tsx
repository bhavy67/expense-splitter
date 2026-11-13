// Dev-only (/__seed): fills localStorage with realistic demo groups so every screen has
// something to show. Uses the app's own storage and split helpers. Not registered in
// production builds. /__seed?reset=1 wipes SplitItt data first.
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { saveGroup, saveExpense, savePayments, generateId, getGroups, deleteGroup } from '@/lib/storage'
import { saveTemplate } from '@/lib/templates'
import { buildEqualSplits, buildWeightedSplits, buildExactSplits, buildItemizedSplits } from '@/lib/calculations'
import { MEMBER_COLORS } from '@/lib/memberColors'
import { toast } from '@/components/common/Toast'
import type { Expense, ExpenseCategory, Group, GroupType, Member } from '@/types'

const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-CA') }

function makeGroup(name: string, type: GroupType, names: string[], extra: Partial<Group> = {}) {
  const now = new Date().toISOString()
  const members: Member[] = names.map((n, i) => ({ id: generateId(), name: n, color: MEMBER_COLORS[i % MEMBER_COLORS.length] }))
  const group: Group = { id: generateId(), name, description: '', type, currency: 'INR', members, createdAt: now, updatedAt: now, ...extra }
  saveGroup(group)
  return group
}

type Split =
  | { equal: number[] }
  | { shares: [number, number][] }
  | { pct: [number, number][] }
  | { exact: [number, number][] }
  | { items: [string, number, number[]][] }

function add(g: Group, title: string, amount: number, category: ExpenseCategory, paidBy: number, ago: number, split: Split, notes?: string) {
  const m = (i: number) => g.members[i].id
  let splitType: Expense['splitType'] = 'equal'
  let splits: Expense['splits'] = []
  let items: Expense['items']
  if ('equal' in split) splits = buildEqualSplits(amount, split.equal.map(m))
  if ('shares' in split) {
    splitType = 'shares'
    splits = buildWeightedSplits(amount, split.shares.map(([i, w]) => ({ memberId: m(i), weight: w }))).map((s) => ({ ...s, shares: split.shares.find(([i]) => m(i) === s.memberId)![1] }))
  }
  if ('pct' in split) {
    splitType = 'percentage'
    splits = buildWeightedSplits(amount, split.pct.map(([i, p]) => ({ memberId: m(i), weight: p }))).map((s) => ({ ...s, percentage: split.pct.find(([i]) => m(i) === s.memberId)![1] }))
  }
  if ('exact' in split) { splitType = 'exact'; splits = buildExactSplits(amount, split.exact.map(([i, a]) => ({ memberId: m(i), amount: a }))) }
  if ('items' in split) {
    splitType = 'itemized'
    const r = buildItemizedSplits(split.items.map(([name, amt, who]) => ({ id: generateId(), name, amount: amt, memberIds: who.map(m) })))
    splits = r.splits; items = r.items; amount = r.total
  }
  const now = new Date().toISOString()
  saveExpense({ id: generateId(), groupId: g.id, title, amount, currency: g.currency, category, paidBy: m(paidBy), splitType, splits, items, date: daysAgo(ago), notes, createdAt: now, updatedAt: now })
}

function pay(g: Group, from: number, to: number, amount: number, ago: number, note?: string) {
  savePayments([{ id: generateId(), groupId: g.id, fromMemberId: g.members[from].id, toMemberId: g.members[to].id, amount, note, date: daysAgo(ago), createdAt: new Date().toISOString() }])
}

function seed() {
  // 1. Trip: every split type, UPI IDs, a payment, a budget
  const goa = makeGroup('Goa trip', 'travel', ['Riya', 'Aman', 'Kabir', 'Neha', 'Zoya'], { budget: 60000 })
  goa.members[0].upiId = 'riya@okaxis'
  goa.members[1].upiId = '9876543210@ybl'
  saveGroup(goa)
  const all = [0, 1, 2, 3, 4]
  add(goa, 'Villa in Anjuna (3 nights)', 27000, 'accommodation', 0, 40, { equal: all }, 'Booked on Airbnb, includes breakfast.')
  add(goa, 'Flights BOM → GOI', 21500, 'travel', 1, 42, { exact: [[0, 4300], [1, 4300], [2, 4300], [3, 4300], [4, 4300]] })
  add(goa, 'Scooter rentals', 3600, 'travel', 2, 38, { shares: [[0, 1], [1, 1], [2, 2], [3, 1], [4, 1]] }, 'Kabir took two days extra.')
  add(goa, 'Dinner at Thalassa', 8450, 'food', 3, 37, { items: [['Mezze platter', 1850, all], ['Seafood mains', 4800, [0, 1, 2, 4]], ['Cocktails', 1800, [1, 3, 4]]] })
  add(goa, 'Parasailing', 6000, 'entertainment', 4, 36, { pct: [[0, 25], [1, 25], [2, 25], [4, 25]] })
  add(goa, 'Beach shack lunch', 2350, 'food', 0, 36, { equal: all })
  add(goa, 'Sunscreen and snacks', 940, 'shopping', 3, 35, { equal: [0, 3, 4] })
  add(goa, 'Cab to the airport', 1800, 'travel', 1, 34, { equal: all })
  add(goa, 'Late-night pizza', 1260, 'food', 2, 2, { equal: [1, 2, 4] })
  pay(goa, 3, 0, 5000, 20, 'GPay')
  pay(goa, 4, 1, 2500, 10, 'Cash')

  // 2. Flat: monthly bills over three months (for the monthly chart)
  const flat = makeGroup('Flat 4B', 'roommates', ['Dev', 'Ira', 'Sam'])
  flat.members[0].upiId = 'dev@okhdfcbank'
  saveGroup(flat)
  for (const [ago, mo] of [[70, 'Sep'], [40, 'Oct'], [9, 'Nov']] as const) {
    add(flat, `Rent (${mo})`, 45000, 'utilities', 0, ago, { pct: [[0, 40], [1, 30], [2, 30]] }, 'Dev has the bigger room.')
    add(flat, `Electricity (${mo})`, 2100 + ago * 7, 'utilities', 1, ago - 3, { equal: [0, 1, 2] })
    add(flat, `Wi-Fi (${mo})`, 999, 'utilities', 2, ago - 4, { equal: [0, 1, 2] })
  }
  add(flat, 'Groceries (BigBasket)', 3240, 'shopping', 1, 5, { equal: [0, 1, 2] })
  add(flat, 'Plumber', 650, 'other', 2, 3, { equal: [0, 1, 2] })

  // 3. Dinners: fully settled (shows the "everyone's settled up" state)
  const dinners = makeGroup('Friday dinners', 'dinner', ['Meera', 'Arjun', 'Tara', 'Vikram'])
  add(dinners, 'Bombay Canteen', 6400, 'food', 0, 6, { equal: [0, 1, 2, 3] })
  pay(dinners, 1, 0, 1600, 5); pay(dinners, 2, 0, 1600, 5); pay(dinners, 3, 0, 1600, 4)

  // 4. Stress test: long names, 8 members, a 9-digit amount
  const big = makeGroup('Bachelor party with the entire college gang 2026', 'friends',
    ['Devendranath Chattopadhyay', 'Aman', 'Kabir', 'Neha', 'Zoya', 'Riya', 'Ishaan', 'Priyanka Venkataraman'])
  add(big, 'Private island booking for the whole weekend including boats', 123456789, 'accommodation', 0, 1, { equal: [0, 1, 2, 3, 4, 5, 6, 7] })
  add(big, 'Snacks', 480, 'food', 7, 0, { equal: [0, 7] })

  // 5. Empty group
  makeGroup('Office lunch', 'other', ['You', 'Colleague'])

  saveTemplate({ name: 'Rent', title: 'Rent', category: 'utilities', splitType: 'percentage' })
  saveTemplate({ name: 'Groceries', title: 'Groceries', category: 'shopping', splitType: 'equal' })
}

export default function SeedPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return // StrictMode runs effects twice in dev
    done.current = true
    if (params.get('reset') === '1') {
      getGroups().forEach((g) => deleteGroup(g.id))
      localStorage.removeItem('splititt_templates')
    }
    seed()
    toast.success('Demo data added: 5 groups')
    navigate('/', { replace: true })
  }, [navigate, params])

  return null
}
