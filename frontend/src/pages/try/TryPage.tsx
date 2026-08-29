import { useState, useRef, useId } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ArrowRight, ArrowLeft, Copy, Check, Users, Receipt, Sparkles } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Person {
  id: string
  name: string
  color: string
}

interface TryExpense {
  id: string
  description: string
  amount: number
  paidById: string
  splitAmong: string[]
}

interface Transaction {
  from: Person
  to: Person
  amount: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERSON_COLORS = [
  'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500',
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(n)
}

function settle(people: Person[], expenses: TryExpense[]): Transaction[] {
  const balance: Record<string, number> = {}
  for (const p of people) balance[p.id] = 0

  for (const exp of expenses) {
    if (exp.splitAmong.length === 0) continue
    const share = exp.amount / exp.splitAmong.length
    for (const pid of exp.splitAmong) balance[pid] -= share
    balance[exp.paidById] += exp.amount
  }

  const creditors = Object.entries(balance)
    .filter(([, b]) => b > 0.005)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = Object.entries(balance)
    .filter(([, b]) => b < -0.005)
    .map(([id, amount]) => ({ id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount)

  const txns: Transaction[] = []

  while (creditors.length && debtors.length) {
    const cred = creditors[0]
    const debt = debtors[0]
    const amount = Math.min(cred.amount, debt.amount)

    txns.push({
      from: people.find((p) => p.id === debt.id)!,
      to: people.find((p) => p.id === cred.id)!,
      amount: Math.round(amount * 100) / 100,
    })

    cred.amount -= amount
    debt.amount -= amount
    if (cred.amount < 0.005) creditors.shift()
    if (debt.amount < 0.005) debtors.shift()
  }

  return txns
}

function toShareText(txns: Transaction[]): string {
  if (txns.length === 0) return 'Everyone is settled up!'
  const lines = txns.map((t) => `${t.from.name} → ${t.to.name}: ${fmt(t.amount)}`)
  return ['Settlement plan (via SplitItt):', '', ...lines].join('\n')
}

// ─── Step 1: People ───────────────────────────────────────────────────────────

function PeopleStep({
  people, onAdd, onRemove, onNext,
}: {
  people: Person[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
  onNext: () => void
}) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function add() {
    const trimmed = name.trim()
    if (!trimmed || people.length >= 8) return
    onAdd(trimmed)
    setName('')
    inputRef.current?.focus()
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Who's splitting?</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Add the people involved (2–8).</p>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKey}
          placeholder="Add a name…"
          maxLength={20}
          autoFocus
          className="flex-1 h-11 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={add}
          disabled={!name.trim() || people.length >= 8}
          className="w-11 h-11 rounded-xl bg-indigo-600 disabled:opacity-40 flex items-center justify-center hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* People list */}
      <div className="flex flex-wrap gap-2 min-h-[48px]">
        <AnimatePresence>
          {people.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            >
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0', p.color)}>
                {p.name[0].toUpperCase()}
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-zinc-100">{p.name}</span>
              <button
                onClick={() => onRemove(p.id)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {people.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-zinc-500 self-center">No one added yet</p>
        )}
      </div>

      <Button
        className="w-full"
        disabled={people.length < 2}
        onClick={onNext}
      >
        Add expenses
        <ArrowRight className="w-4 h-4" />
      </Button>
      {people.length < 2 && (
        <p className="text-xs text-center text-gray-400 dark:text-zinc-500 -mt-3">Add at least 2 people to continue</p>
      )}
    </div>
  )
}

// ─── Step 2: Expenses ─────────────────────────────────────────────────────────

function ExpensesStep({
  people, expenses, onAdd, onRemove, onBack, onNext,
}: {
  people: Person[]
  expenses: TryExpense[]
  onAdd: (exp: Omit<TryExpense, 'id'>) => void
  onRemove: (id: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const descId = useId()
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [paidById, setPaidById] = useState(people[0]?.id ?? '')
  const [splitAmong, setSplitAmong] = useState<string[]>(people.map((p) => p.id))
  const [error, setError] = useState('')

  const personMap = Object.fromEntries(people.map((p) => [p.id, p]))

  function toggleSplit(id: string) {
    setSplitAmong((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function add() {
    const trimmedDesc = desc.trim()
    const parsedAmount = parseFloat(amount)
    if (!trimmedDesc) { setError('Add a description'); return }
    if (!parsedAmount || parsedAmount <= 0) { setError('Enter a valid amount'); return }
    if (splitAmong.length === 0) { setError('Select who to split among'); return }
    setError('')
    onAdd({ description: trimmedDesc, amount: parsedAmount, paidById, splitAmong })
    setDesc('')
    setAmount('')
    setPaidById(people[0]?.id ?? '')
    setSplitAmong(people.map((p) => p.id))
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Add expenses</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">What did you spend money on?</p>
      </div>

      {/* Expense form */}
      <div className="bg-gray-50 dark:bg-zinc-800/60 rounded-2xl p-4 flex flex-col gap-3 border border-gray-200 dark:border-zinc-700">
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor={descId} className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1 block">Description</label>
            <input
              id={descId}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="Dinner, Uber, Hotel…"
              maxLength={40}
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-28">
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1 block">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="0"
              min="0"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 block">Paid by</label>
          <div className="flex flex-wrap gap-1.5">
            {people.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaidById(p.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  paidById === p.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                )}
              >
                <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0', paidById === p.id ? 'bg-white/30' : p.color)}>
                  {p.name[0].toUpperCase()}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 block">Split among</label>
          <div className="flex flex-wrap gap-1.5">
            {people.map((p) => {
              const included = splitAmong.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleSplit(p.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    included
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 border-gray-200 dark:border-zinc-700 line-through'
                  )}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button size="sm" className="self-start" onClick={add}>
          <Plus className="w-3.5 h-3.5" />
          Add expense
        </Button>
      </div>

      {/* Expense list */}
      {expenses.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Added</p>
            <p className="text-xs font-semibold text-gray-600 dark:text-zinc-300">Total: {fmt(total)}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <AnimatePresence>
              {expenses.map((exp) => {
                const payer = personMap[exp.paidById]
                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-100 truncate">{exp.description}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">
                        paid by <span className="font-medium text-gray-600 dark:text-zinc-300">{payer?.name}</span>
                        {' · '}split among {exp.splitAmong.length}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 shrink-0">{fmt(exp.amount)}</p>
                    <button
                      onClick={() => onRemove(exp.id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button className="flex-1" disabled={expenses.length === 0} onClick={onNext}>
          Calculate
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: Results ──────────────────────────────────────────────────────────

function ResultsStep({
  people, expenses, onBack, onReset,
}: {
  people: Person[]
  expenses: TryExpense[]
  onBack: () => void
  onReset: () => void
}) {
  const [copied, setCopied] = useState(false)
  const txns = settle(people, expenses)
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  function copy() {
    navigator.clipboard.writeText(toShareText(txns)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Here's the plan</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          {txns.length === 0 ? 'Everyone is settled up — no payments needed!' : `${txns.length} payment${txns.length > 1 ? 's' : ''} to settle ${fmt(total)} across {people.length} people.`}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-zinc-800/60 rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-700">
          <p className="text-xs text-gray-400 dark:text-zinc-500">Total spent</p>
          <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-0.5">{fmt(total)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-zinc-800/60 rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-700">
          <p className="text-xs text-gray-400 dark:text-zinc-500">Transfers needed</p>
          <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mt-0.5">{txns.length}</p>
        </div>
      </div>

      {/* Per-person summary */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-zinc-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Each person's share</p>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-zinc-800">
          {people.map((p) => {
            const paid = expenses.filter((e) => e.paidById === p.id).reduce((s, e) => s + e.amount, 0)
            const share = expenses
              .filter((e) => e.splitAmong.includes(p.id))
              .reduce((s, e) => s + e.amount / e.splitAmong.length, 0)
            const net = paid - share
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', p.color)}>
                  {p.name[0].toUpperCase()}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-200 flex-1">{p.name}</span>
                <span className={cn('text-sm font-semibold', net > 0.005 ? 'text-emerald-600 dark:text-emerald-400' : net < -0.005 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-zinc-500')}>
                  {net > 0.005 ? `+${fmt(net)}` : net < -0.005 ? `−${fmt(-net)}` : 'settled'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transactions */}
      {txns.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Payments</p>
          <div className="flex flex-col gap-2">
            {txns.map((t, i) => (
              <div key={i} className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl px-4 py-3">
                <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', t.from.color)}>
                  {t.from.name[0].toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    {t.from.name} <span className="text-gray-400 dark:text-zinc-500 font-normal">pays</span> {t.to.name}
                  </p>
                </div>
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 shrink-0">{fmt(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Edit
        </Button>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-950/30 dark:to-emerald-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 text-center">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">Track this over time</p>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
          Create a free account to save groups, add recurring expenses,
          and settle up with a tap.
        </p>
        <Link
          to="/auth/register"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Create free account
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Progress indicator ────────────────────────────────────────────────────────

const STEPS = [
  { label: 'People',   icon: Users },
  { label: 'Expenses', icon: Receipt },
  { label: 'Results',  icon: Sparkles },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        const Icon = s.icon
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300',
                done ? 'bg-indigo-600' : active ? 'bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-950' : 'bg-gray-100 dark:bg-zinc-800'
              )}>
                {done
                  ? <Check className="w-4 h-4 text-white" />
                  : <Icon className={cn('w-4 h-4', active ? 'text-white' : 'text-gray-400 dark:text-zinc-500')} />
                }
              </div>
              <span className={cn('text-[10px] font-semibold', active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500')}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('w-12 h-0.5 mx-1 mb-5 transition-colors duration-300', done ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-zinc-700')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TryPage() {
  const [step, setStep] = useState(0)
  const [people, setPeople] = useState<Person[]>([])
  const [expenses, setExpenses] = useState<TryExpense[]>([])
  const nextId = useRef(0)

  function addPerson(name: string) {
    const id = String(++nextId.current)
    setPeople((prev) => [...prev, { id, name, color: PERSON_COLORS[prev.length % PERSON_COLORS.length] }])
  }

  function removePerson(id: string) {
    setPeople((prev) => prev.filter((p) => p.id !== id))
    setExpenses((prev) => prev.filter((e) => e.paidById !== id && e.splitAmong.some((x) => x !== id)))
  }

  function addExpense(exp: Omit<TryExpense, 'id'>) {
    const id = String(++nextId.current)
    setExpenses((prev) => [...prev, { id, ...exp }])
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  function reset() {
    setPeople([])
    setExpenses([])
    setStep(0)
  }

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 32 : -32 }),
    center: { opacity: 1, x: 0 },
    exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -32 : 32 }),
  }

  const [direction, setDirection] = useState(1)

  function goNext() { setDirection(1); setStep((s) => s + 1) }
  function goBack() { setDirection(-1); setStep((s) => s - 1) }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto w-full">
        <Logo size={24} />
        <Link
          to="/auth/login"
          className="text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-100 transition-colors"
        >
          Sign in →
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-none border border-gray-100 dark:border-zinc-800 px-6 py-8 sm:px-8">
          <StepIndicator current={step} />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {step === 0 && (
                <PeopleStep
                  people={people}
                  onAdd={addPerson}
                  onRemove={removePerson}
                  onNext={goNext}
                />
              )}
              {step === 1 && (
                <ExpensesStep
                  people={people}
                  expenses={expenses}
                  onAdd={addExpense}
                  onRemove={removeExpense}
                  onBack={goBack}
                  onNext={goNext}
                />
              )}
              {step === 2 && (
                <ResultsStep
                  people={people}
                  expenses={expenses}
                  onBack={goBack}
                  onReset={reset}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-zinc-600 pb-6">
        No account needed · Nothing is saved
      </p>
    </div>
  )
}
