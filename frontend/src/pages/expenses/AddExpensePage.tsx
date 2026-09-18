import { useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, X, Camera, RefreshCw, BookMarked } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroup } from '@/hooks/useStore'
import { saveExpense, getExpense, generateId } from '@/lib/storage'
import { getTemplates, saveTemplate, deleteTemplate } from '@/lib/templates'
import { buildEqualSplits } from '@/lib/calculations'
import { formatCurrency } from '@/lib/currency'
import { toast } from '@/components/common/Toast'
import { cn } from '@/lib/utils'
import type { Expense, SplitType, ExpenseCategory, SplitEntry, ExpenseItem } from '@/types'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'THB', 'MYR', 'IDR']

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormItem {
  id: string
  name: string
  amount: string
  memberIds: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'food',          label: 'Food',     emoji: '🍔' },
  { value: 'travel',        label: 'Travel',   emoji: '✈️' },
  { value: 'accommodation', label: 'Stay',     emoji: '🏨' },
  { value: 'utilities',     label: 'Bills',    emoji: '⚡' },
  { value: 'entertainment', label: 'Fun',      emoji: '🎭' },
  { value: 'shopping',      label: 'Shopping', emoji: '🛍️' },
  { value: 'medical',       label: 'Medical',  emoji: '💊' },
  { value: 'other',         label: 'Other',    emoji: '📦' },
]

const SPLIT_TABS: { value: SplitType; label: string; hint: string }[] = [
  { value: 'equal',      label: 'Equal',   hint: 'Divide equally among members' },
  { value: 'shares',     label: 'Shares',  hint: 'Split by ratio (e.g. 2:1:1)' },
  { value: 'percentage', label: '%',       hint: 'Assign percentages' },
  { value: 'exact',      label: 'Exact',   hint: 'Set exact amounts per person' },
  { value: 'itemized',   label: 'Items',   hint: 'Split by line items' },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const group = useGroup(groupId!)
  const photoRef = useRef<HTMLInputElement>(null)

  const existing = editId && group ? getExpense(groupId!, editId) : null

  // ── Form state ──────────────────────────────────────────────────────────────

  const [title, setTitle]     = useState(existing?.title ?? '')
  const [amount, setAmount]   = useState(() => {
    if (!existing) return ''
    if (existing.exchangeRate && existing.currency !== (group?.currency ?? '')) {
      return (existing.amount / existing.exchangeRate).toFixed(2)
    }
    return existing.amount.toString()
  })
  const [date, setDate]       = useState(existing?.date ?? new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? 'other')
  const [notes, setNotes]     = useState(existing?.notes ?? '')
  const [paidBy, setPaidBy]   = useState(existing?.paidBy ?? group?.members[0]?.id ?? '')
  const [splitType, setSplitType] = useState<SplitType>(existing?.splitType ?? 'equal')
  const [receiptImage, setReceiptImage] = useState<string | undefined>(existing?.receiptImage)
  // multi-currency
  const [expenseCurrency, setExpenseCurrency] = useState(existing?.currency ?? group?.currency ?? 'INR')
  const [exchangeRate, setExchangeRate]       = useState(existing?.exchangeRate?.toString() ?? '1')
  // templates
  const [templates, setTemplates]             = useState(() => getTemplates())
  const [savingTemplate, setSavingTemplate]   = useState(false)
  const [templateName, setTemplateName]       = useState('')

  // per-split-type state
  const [equalIncluded, setEqualIncluded] = useState<Set<string>>(
    () => {
      if (existing?.splitType === 'equal') return new Set(existing.splits.map(s => s.memberId))
      return new Set(group?.members.map(m => m.id) ?? [])
    }
  )
  const [shareVals, setShareVals] = useState<Record<string, number>>(
    () => {
      if (existing?.splitType === 'shares')
        return Object.fromEntries(existing.splits.map(s => [s.memberId, s.shares ?? 1]))
      return Object.fromEntries(group?.members.map(m => [m.id, 1]) ?? [])
    }
  )
  const [pctVals, setPctVals] = useState<Record<string, number>>(
    () => {
      if (existing?.splitType === 'percentage')
        return Object.fromEntries(existing.splits.map(s => [s.memberId, s.percentage ?? 0]))
      const n = group?.members.length ?? 1
      const base = Math.floor(100 / n * 100) / 100
      return Object.fromEntries(
        (group?.members ?? []).map((m, i, arr) => [
          m.id,
          i === arr.length - 1 ? Math.round((100 - base * (arr.length - 1)) * 100) / 100 : base,
        ])
      )
    }
  )
  const [exactVals, setExactVals] = useState<Record<string, string>>(
    () => {
      if (existing?.splitType === 'exact')
        return Object.fromEntries(existing.splits.map(s => [s.memberId, s.amount.toString()]))
      return Object.fromEntries(group?.members.map(m => [m.id, '']) ?? [])
    }
  )
  const [formItems, setFormItems] = useState<FormItem[]>(
    () => {
      if (existing?.splitType === 'itemized' && existing.items?.length)
        return existing.items.map(item => ({
          id: item.id,
          name: item.name,
          amount: item.amount.toString(),
          memberIds: item.splits.map(s => s.memberId),
        }))
      return [{ id: generateId(), name: '', amount: '', memberIds: group?.members.map(m => m.id) ?? [] }]
    }
  )

  if (!group) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen text-gray-500 dark:text-zinc-500">
          Group not found
        </div>
      </AppShell>
    )
  }

  // ── Derived / computed ──────────────────────────────────────────────────────

  const currency = group.currency                                           // group base currency
  const rate     = expenseCurrency !== currency ? (parseFloat(exchangeRate) || 1) : 1
  const amt      = (parseFloat(amount) || 0) * rate                        // always in group currency

  const itemizedTotal = formItems.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0)

  const pctTotal      = Object.values(pctVals).reduce((s, v) => s + v, 0)
  const exactTotal    = Object.values(exactVals).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const exactRemain   = Math.round((amt - exactTotal) * 100) / 100

  const shareTotalCount = group.members.reduce((s, m) => s + (shareVals[m.id] ?? 0), 0)

  // ── Handlers ────────────────────────────────────────────────────────────────

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id)
    if (!t) return
    setTitle(t.title)
    setCategory(t.category)
    setSplitType(t.splitType)
    setNotes(t.notes ?? '')
    toast.info(`Loaded "${t.name}"`)
  }

  function handleSaveTemplate() {
    const name = templateName.trim()
    if (!name) { toast.error('Enter a template name'); return }
    saveTemplate({ name, title: title.trim() || 'Expense', category, splitType, notes: notes.trim() || undefined })
    setTemplates(getTemplates())
    setSavingTemplate(false)
    setTemplateName('')
    toast.success(`Template "${name}" saved`)
  }

  function handleDeleteTemplate(id: string) {
    deleteTemplate(id)
    setTemplates(getTemplates())
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 600_000) { toast.error('Image must be under 600KB'); return }
    const reader = new FileReader()
    reader.onload = ev => setReceiptImage(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function distributeExactEqually() {
    const share = Math.round(amt / group!.members.length * 100) / 100
    const vals = Object.fromEntries(group!.members.map((m, i, arr) => [
      m.id,
      i === arr.length - 1
        ? String(Math.round((amt - share * (arr.length - 1)) * 100) / 100)
        : String(share),
    ]))
    setExactVals(vals)
  }

  function toggleItemMember(itemId: string, memberId: string) {
    setFormItems(prev => prev.map(it => {
      if (it.id !== itemId) return it
      const next = it.memberIds.includes(memberId)
        ? it.memberIds.filter(id => id !== memberId)
        : [...it.memberIds, memberId]
      return { ...it, memberIds: next }
    }))
  }

  function addItem() {
    setFormItems(prev => [...prev, { id: generateId(), name: '', amount: '', memberIds: group!.members.map(m => m.id) }])
  }

  function removeItem(id: string) {
    setFormItems(prev => prev.filter(it => it.id !== id))
  }

  // ── Build splits on submit ──────────────────────────────────────────────────

  function buildSplitsAndItems(): { splits: SplitEntry[]; items?: ExpenseItem[] } | null {
    if (splitType === 'equal') {
      if (equalIncluded.size === 0) { toast.error('Select at least one member'); return null }
      if (amt <= 0) { toast.error('Enter an amount'); return null }
      return { splits: buildEqualSplits(amt, [...equalIncluded]) }
    }

    if (splitType === 'shares') {
      if (amt <= 0) { toast.error('Enter an amount'); return null }
      const filtered = group!.members.filter(m => (shareVals[m.id] ?? 0) > 0)
      if (filtered.length === 0) { toast.error('Assign at least one share'); return null }
      const total = filtered.reduce((s, m) => s + shareVals[m.id], 0)
      const splits = filtered.map(m => ({
        memberId: m.id,
        amount: Math.round((shareVals[m.id] / total) * amt * 100) / 100,
        shares: shareVals[m.id],
      }))
      const sum = splits.reduce((s, e) => s + e.amount, 0)
      splits[splits.length - 1].amount = Math.round((splits[splits.length - 1].amount + amt - sum) * 100) / 100
      return { splits }
    }

    if (splitType === 'percentage') {
      if (amt <= 0) { toast.error('Enter an amount'); return null }
      if (Math.abs(pctTotal - 100) > 0.5) { toast.error(`Percentages must total 100% (currently ${pctTotal.toFixed(1)}%)`); return null }
      const splits = group!.members
        .filter(m => (pctVals[m.id] ?? 0) > 0)
        .map(m => ({
          memberId: m.id,
          amount: Math.round((pctVals[m.id] / 100) * amt * 100) / 100,
          percentage: pctVals[m.id],
        }))
      const sum = splits.reduce((s, e) => s + e.amount, 0)
      if (splits.length > 0) splits[splits.length - 1].amount = Math.round((splits[splits.length - 1].amount + amt - sum) * 100) / 100
      return { splits }
    }

    if (splitType === 'exact') {
      if (amt <= 0) { toast.error('Enter an amount'); return null }
      if (Math.abs(exactRemain) > 0.01) { toast.error(`Amounts must total ${formatCurrency(amt, currency)} — ${exactRemain > 0 ? formatCurrency(exactRemain, currency) + ' remaining' : formatCurrency(-exactRemain, currency) + ' over'}`); return null }
      const splits = group!.members
        .filter(m => parseFloat(exactVals[m.id] || '0') > 0)
        .map(m => ({ memberId: m.id, amount: parseFloat(exactVals[m.id]) }))
      if (splits.length === 0) { toast.error('Assign amounts to at least one member'); return null }
      return { splits }
    }

    // itemized
    if (itemizedTotal <= 0) { toast.error('Add at least one item'); return null }
    const memberAmounts: Record<string, number> = {}
    const processedItems: ExpenseItem[] = []
    for (const it of formItems) {
      const itAmt = parseFloat(it.amount) || 0
      if (itAmt <= 0 || it.memberIds.length === 0) continue
      const perPerson = itAmt / it.memberIds.length
      const itSplits: SplitEntry[] = it.memberIds.map(id => ({ memberId: id, amount: Math.round(perPerson * 100) / 100 }))
      processedItems.push({ id: it.id, name: it.name || 'Item', amount: itAmt, splits: itSplits })
      for (const id of it.memberIds) memberAmounts[id] = (memberAmounts[id] ?? 0) + perPerson
    }
    const splits = Object.entries(memberAmounts)
      .filter(([, a]) => a > 0.001)
      .map(([memberId, a]) => ({ memberId, amount: Math.round(a * 100) / 100 }))
    if (splits.length === 0) { toast.error('Assign items to members'); return null }
    return { splits, items: processedItems }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) { toast.error('Title is required'); return }
    if (!paidBy) { toast.error('Select who paid'); return }

    const result = buildSplitsAndItems()
    if (!result) return

    const finalAmount = splitType === 'itemized' ? itemizedTotal : amt
    if (finalAmount <= 0) { toast.error('Amount must be greater than 0'); return }

    const now = new Date().toISOString()
    const expense: Expense = {
      id: existing?.id ?? generateId(),
      groupId: groupId!,
      title: trimmedTitle,
      amount: finalAmount,
      currency: expenseCurrency,
      exchangeRate: expenseCurrency !== currency ? rate : undefined,
      category,
      paidBy,
      splitType,
      splits: result.splits,
      items: result.items,
      date,
      notes: notes.trim() || undefined,
      receiptImage,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }

    saveExpense(expense)
    toast.success(existing ? 'Expense updated' : 'Expense added')
    navigate(existing ? `/g/${groupId}/expenses/${expense.id}` : `/g/${groupId}`)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <TopBar title={existing ? 'Edit Expense' : 'Add Expense'} showBack />

      <PageTransition>
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 pb-28 flex flex-col gap-5">

          {/* ── Templates strip ──────────────────────────────────────────── */}
          {templates.length > 0 && !existing && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">Templates</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center gap-1 shrink-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => applyTemplate(t.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
                    >
                      <BookMarked className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                      {t.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="px-2 py-2 text-gray-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Amount ──────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 text-center">
            <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Total amount</p>
            <div className="flex items-center justify-center gap-2">
              {/* Currency selector */}
              <select
                value={expenseCurrency}
                disabled={splitType === 'itemized'}
                onChange={e => { setExpenseCurrency(e.target.value); setExchangeRate('1') }}
                className="text-2xl text-gray-400 dark:text-zinc-500 font-light bg-transparent border-none outline-none cursor-pointer disabled:cursor-default"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={splitType === 'itemized' ? (itemizedTotal / rate).toFixed(2) : amount}
                onChange={e => setAmount(e.target.value)}
                readOnly={splitType === 'itemized'}
                className={cn(
                  'text-4xl font-bold text-gray-900 dark:text-zinc-100 text-center bg-transparent border-none outline-none w-40',
                  splitType === 'itemized' && 'text-gray-500 dark:text-zinc-400'
                )}
              />
            </div>
            {/* Exchange rate row */}
            {expenseCurrency !== currency && splitType !== 'itemized' && (
              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <span className="text-xs text-gray-400 dark:text-zinc-500">1 {expenseCurrency} =</span>
                <input
                  type="number"
                  min="0.000001"
                  step="any"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(e.target.value)}
                  className="w-20 text-sm font-semibold text-center text-gray-900 dark:text-zinc-100 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg h-7 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-400 dark:text-zinc-500">{currency}</span>
                {amt > 0 && (
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    = {formatCurrency(amt, currency)}
                  </span>
                )}
              </div>
            )}
            {splitType === 'itemized' && (
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Calculated from items below</p>
            )}
          </div>

          {/* ── Title & Date ─────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 flex flex-col gap-3">
            <input
              autoFocus={!existing}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What was this for?"
              className="w-full text-base font-medium text-gray-900 dark:text-zinc-100 placeholder-gray-300 dark:placeholder-zinc-600 bg-transparent border-none outline-none"
            />
            <div className="h-px bg-gray-100 dark:bg-zinc-800" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm text-gray-600 dark:text-zinc-400 bg-transparent border-none outline-none cursor-pointer"
            />
          </div>

          {/* ── Category ─────────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">Category</p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-3 rounded-xl border text-center transition-all',
                    category === cat.value
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700'
                      : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600'
                  )}
                >
                  <span className="text-xl leading-none">{cat.emoji}</span>
                  <span className={cn('text-[10px] font-medium', category === cat.value ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-500 dark:text-zinc-400')}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Paid by ──────────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">Paid by</p>
            <div className="flex flex-wrap gap-2">
              {group.members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaidBy(m.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                    paidBy === m.id
                      ? 'border-transparent text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'
                  )}
                  style={paidBy === m.id ? { background: m.color } : undefined}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                    style={{ background: paidBy === m.id ? 'rgba(255,255,255,0.3)' : m.color }}
                  >
                    <span className="text-white">{m.name[0]?.toUpperCase()}</span>
                  </div>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* ── Split ────────────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">Split</p>

            {/* Split type tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl mb-3">
              {SPLIT_TABS.map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSplitType(tab.value)}
                  title={tab.hint}
                  className={cn(
                    'flex-1 h-8 rounded-lg text-xs font-semibold transition-all',
                    splitType === tab.value
                      ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4">

              {/* Equal */}
              {splitType === 'equal' && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">Click to include/exclude members</p>
                  {group.members.map(m => {
                    const on = equalIncluded.has(m.id)
                    const share = equalIncluded.size > 0 ? Math.round(amt / equalIncluded.size * 100) / 100 : 0
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          const next = new Set(equalIncluded)
                          if (next.has(m.id)) next.delete(m.id)
                          else next.add(m.id)
                          setEqualIncluded(next)
                        }}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left',
                          on
                            ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30'
                            : 'border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 opacity-50'
                        )}
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.color }}>
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200">{m.name}</span>
                        {on && amt > 0 && (
                          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                            {formatCurrency(share, currency)}
                          </span>
                        )}
                        <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors', on ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-zinc-600')}>
                          {on && <svg className="w-3 h-3 text-white" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4.5 8L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Shares */}
              {splitType === 'shares' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">Adjust shares — amounts scale proportionally</p>
                  {group.members.map(m => {
                    const v = shareVals[m.id] ?? 0
                    const computed = shareTotalCount > 0 ? Math.round((v / shareTotalCount) * amt * 100) / 100 : 0
                    return (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.color }}>
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{m.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShareVals(p => ({ ...p, [m.id]: Math.max(0, (p[m.id] ?? 0) - 1) }))}
                            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 12 2" fill="currentColor"><rect y="0.5" width="12" height="1" rx="0.5"/></svg>
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={v}
                            onChange={e => setShareVals(p => ({ ...p, [m.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="w-10 text-center text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg h-7 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShareVals(p => ({ ...p, [m.id]: (p[m.id] ?? 0) + 1 }))}
                            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M5.5 0.5h1v11h-1V0.5zM0.5 5.5h11v1H0.5v-1z"/></svg>
                          </button>
                        </div>
                        {amt > 0 && v > 0 && (
                          <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400 w-24 text-right shrink-0">
                            {formatCurrency(computed, currency)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {shareTotalCount > 0 && (
                    <p className="text-xs text-gray-400 dark:text-zinc-500 text-right mt-1">{shareTotalCount} total shares</p>
                  )}
                </div>
              )}

              {/* Percentage */}
              {splitType === 'percentage' && (
                <div className="flex flex-col gap-3">
                  {group.members.map(m => {
                    const pct = pctVals[m.id] ?? 0
                    const computed = Math.round(pct / 100 * amt * 100) / 100
                    return (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.color }}>
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{m.name}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={pct}
                            onChange={e => setPctVals(p => ({ ...p, [m.id]: parseFloat(e.target.value) || 0 }))}
                            className="w-16 text-right text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg h-8 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-500 dark:text-zinc-400">%</span>
                        </div>
                        {amt > 0 && (
                          <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400 w-24 text-right shrink-0">
                            {formatCurrency(computed, currency)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  <div className={cn('flex items-center justify-end gap-2 mt-1 pt-2 border-t border-gray-100 dark:border-zinc-800 text-sm font-semibold', Math.abs(pctTotal - 100) < 0.5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                    <span>{pctTotal.toFixed(1)}% of 100%</span>
                    {Math.abs(pctTotal - 100) < 0.5 && <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </div>
              )}

              {/* Exact */}
              {splitType === 'exact' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 dark:text-zinc-500">Enter exact amounts per person</p>
                    <button
                      type="button"
                      onClick={distributeExactEqually}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Distribute equally
                    </button>
                  </div>
                  {group.members.map(m => (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.color }}>
                        {m.name[0]?.toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{m.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">{currency}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={exactVals[m.id] ?? ''}
                          onChange={e => setExactVals(p => ({ ...p, [m.id]: e.target.value }))}
                          className="w-24 text-right text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg h-8 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                  <div className={cn('flex items-center justify-end gap-2 mt-1 pt-2 border-t border-gray-100 dark:border-zinc-800 text-sm font-semibold', Math.abs(exactRemain) < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400')}>
                    {Math.abs(exactRemain) < 0.01
                      ? <><svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Balanced</span></>
                      : <span>{exactRemain > 0 ? `${formatCurrency(exactRemain, currency)} remaining` : `${formatCurrency(-exactRemain, currency)} over`}</span>
                    }
                  </div>
                </div>
              )}

              {/* Itemized */}
              {splitType === 'itemized' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Add items and assign them to members</p>
                  {formItems.map((item, idx) => (
                    <div key={item.id} className="border border-gray-200 dark:border-zinc-700 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          placeholder={`Item ${idx + 1}`}
                          value={item.name}
                          onChange={e => setFormItems(p => p.map(it => it.id === item.id ? { ...it, name: e.target.value } : it))}
                          className="flex-1 text-sm font-medium text-gray-900 dark:text-zinc-100 bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-zinc-600"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">{currency}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.amount}
                            onChange={e => setFormItems(p => p.map(it => it.id === item.id ? { ...it, amount: e.target.value } : it))}
                            className="w-20 text-right text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg h-7 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        {formItems.length > 1 && (
                          <button type="button" onClick={() => removeItem(item.id)} className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.members.map(m => {
                          const on = item.memberIds.includes(m.id)
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleItemMember(item.id, m.id)}
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-all',
                                on
                                  ? 'border-transparent text-white'
                                  : 'border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800'
                              )}
                              style={on ? { background: m.color } : undefined}
                            >
                              {m.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium self-start px-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add item
                  </button>
                  {itemizedTotal > 0 && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                      Total: {formatCurrency(itemizedTotal, currency)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Notes + Save template ────────────────────────────────────── */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Notes (optional)</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Add a note..."
              className="w-full text-sm text-gray-700 dark:text-zinc-300 bg-transparent border-none outline-none resize-none placeholder-gray-300 dark:placeholder-zinc-600"
            />
            {!existing && (
              <>
                <div className="h-px bg-gray-100 dark:bg-zinc-800 mt-3 mb-3" />
                {savingTemplate ? (
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <input
                      autoFocus
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTemplate() } if (e.key === 'Escape') setSavingTemplate(false) }}
                      placeholder="Template name..."
                      className="flex-1 text-sm text-gray-700 dark:text-zinc-300 placeholder-gray-300 dark:placeholder-zinc-600 bg-transparent border-none outline-none"
                    />
                    <button type="button" onClick={handleSaveTemplate} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">Save</button>
                    <button type="button" onClick={() => setSavingTemplate(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setTemplateName(title || ''); setSavingTemplate(true) }}
                    className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                  >
                    <BookMarked className="w-3 h-3" />
                    Save as template
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── Receipt ──────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Receipt (optional)</p>
            {receiptImage ? (
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img src={receiptImage} alt="Receipt" className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-zinc-700" />
                  <button
                    type="button"
                    onClick={() => setReceiptImage(undefined)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-medium"
                >
                  Change photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 text-sm text-gray-400 dark:text-zinc-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full justify-center"
              >
                <Camera className="w-4 h-4" />
                Attach receipt photo
              </button>
            )}
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

        </form>
      </PageTransition>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-zinc-800 px-4 py-3 pb-safe">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            form={undefined}
            onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
          >
            {existing ? 'Save changes' : 'Add expense'}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
