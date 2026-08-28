import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDown } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { EqualSplitEditor } from '@/components/expenses/splits/EqualSplitEditor'
import { PercentageSplitEditor } from '@/components/expenses/splits/PercentageSplitEditor'
import { ExactSplitEditor } from '@/components/expenses/splits/ExactSplitEditor'
import { ItemizedSplitEditor, type ItemEntry } from '@/components/expenses/splits/ItemizedSplitEditor'
import { useGroup } from '@/hooks/useGroups'
import { useCreateExpense } from '@/hooks/useCreateExpense'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/common/Toast'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────

type SplitType = 'equal' | 'percentage' | 'exact' | 'itemized'

const CATEGORIES = [
  { value: 'food', label: 'Food', icon: '🍔' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'accommodation', label: 'Stay', icon: '🏨' },
  { value: 'utilities', label: 'Bills', icon: '💡' },
  { value: 'entertainment', label: 'Fun', icon: '🎮' },
  { value: 'other', label: 'Other', icon: '📦' },
] as const

const SPLIT_TABS: { value: SplitType; label: string }[] = [
  { value: 'equal', label: 'Equal' },
  { value: 'percentage', label: 'By %' },
  { value: 'exact', label: 'Exact' },
  { value: 'itemized', label: 'Itemized' },
]

// ─── Form schema (basic fields only) ────────────────────────────────────────

const basicSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  total_amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => parseFloat(v) > 0, 'Amount must be greater than 0'),
  expense_date: z.string().min(1, 'Date is required'),
  category: z.string(),
  paid_by: z.string().min(1, 'Select who paid'),
})

type BasicValues = z.infer<typeof basicSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function initPercentages(memberIds: string[]) {
  const n = memberIds.length
  const base = Math.floor(100 / n)
  const remainder = 100 - base * n
  return Object.fromEntries(
    memberIds.map((id, i) => [id, i === 0 ? base + remainder : base])
  )
}

function initAmounts(memberIds: string[]) {
  return Object.fromEntries(memberIds.map((id) => [id, 0]))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: group, isLoading } = useGroup(groupId!)
  const createExpense = useCreateExpense(groupId!)

  // ── Split state ──────────────────────────────────────────────────────────
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [equalMembers, setEqualMembers] = useState<string[]>([])
  const [percentages, setPercentages] = useState<Record<string, number>>({})
  const [exactAmounts, setExactAmounts] = useState<Record<string, number>>({})
  const [items, setItems] = useState<ItemEntry[]>([])

  // ── Basic form ───────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BasicValues>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      expense_date: todayISO(),
      category: 'other',
      paid_by: '',
    },
  })

  const category = watch('category')
  const totalAmountStr = watch('total_amount')
  const totalAmount = parseFloat(totalAmountStr) || 0

  // Initialize split state once group loads
  useEffect(() => {
    if (!group) return
    const memberIds = group.members.filter((m) => m.is_active).map((m) => m.user.id)
    setEqualMembers(memberIds)
    setPercentages(initPercentages(memberIds))
    setExactAmounts(initAmounts(memberIds))
    setItems([{ id: 'item-0', description: '', amount: 0, memberIds }])
    // Default paid_by to current user if they're a member
    if (user && memberIds.includes(user.id)) {
      setValue('paid_by', user.id)
    }
  }, [group, user, setValue])

  // ── Split type change: reset split to sane defaults ──────────────────────
  const handleSplitTypeChange = (next: SplitType) => {
    setSplitType(next)
    const memberIds = group?.members.filter((m) => m.is_active).map((m) => m.user.id) ?? []
    if (next === 'percentage') setPercentages(initPercentages(memberIds))
    if (next === 'exact') setExactAmounts(initAmounts(memberIds))
    if (next === 'itemized') {
      setItems([{ id: 'item-0', description: '', amount: 0, memberIds }])
    }
  }

  // ── Validation for split section ─────────────────────────────────────────
  function validateSplit(): boolean {
    switch (splitType) {
      case 'equal':
        if (equalMembers.length === 0) { toast.error('Select at least one person'); return false }
        break
      case 'percentage': {
        const sum = Object.values(percentages).reduce((s, v) => s + v, 0)
        if (Math.abs(sum - 100) > 0.01) { toast.error(`Percentages must sum to 100% (currently ${sum.toFixed(1)}%)`); return false }
        break
      }
      case 'exact': {
        const sum = Object.values(exactAmounts).reduce((s, v) => s + v, 0)
        if (Math.abs(sum - totalAmount) > 0.01) { toast.error(`Amounts must sum to ${totalAmount} (currently ${sum.toFixed(2)})`); return false }
        break
      }
      case 'itemized': {
        if (items.length === 0) { toast.error('Add at least one item'); return false }
        const invalid = items.find((item) => !item.description.trim() || item.amount <= 0 || item.memberIds.length === 0)
        if (invalid) { toast.error('Each item needs a name, amount, and at least one person'); return false }
        break
      }
    }
    return true
  }

  // ── Build API payload ─────────────────────────────────────────────────────
  function buildPayload(basic: BasicValues) {
    const base = {
      title: basic.title.trim(),
      description: basic.description?.trim() || undefined,
      total_amount: splitType === 'itemized'
        ? items.reduce((s, item) => s + item.amount, 0)
        : totalAmount,
      currency_code: 'INR',
      split_type: splitType,
      category: basic.category,
      paid_by: basic.paid_by,
      expense_date: basic.expense_date,
    }

    if (splitType === 'equal') {
      return { ...base, splits: equalMembers.map((id) => ({ user_id: id })), items: [] }
    }
    if (splitType === 'percentage') {
      return {
        ...base,
        splits: Object.entries(percentages).map(([id, pct]) => ({ user_id: id, percentage: pct })),
        items: [],
      }
    }
    if (splitType === 'exact') {
      return {
        ...base,
        splits: Object.entries(exactAmounts)
          .filter(([, amt]) => amt > 0)
          .map(([id, amt]) => ({ user_id: id, amount: amt })),
        items: [],
      }
    }
    // itemized
    return {
      ...base,
      splits: [],
      items: items.map((item) => ({
        description: item.description,
        amount: item.amount,
        splits: item.memberIds.map((id) => ({
          user_id: id,
          amount: Math.round((item.amount / item.memberIds.length) * 100) / 100,
        })),
      })),
    }
  }

  const onSubmit = (basic: BasicValues) => {
    if (!validateSplit()) return
    const payload = buildPayload(basic)
    createExpense.mutate(payload, {
      onSuccess: () => navigate(`/groups/${groupId}`),
    })
  }

  if (isLoading || !group) {
    return (
      <AppShell>
        <TopBar title="Add expense" showBack />
        <div className="flex flex-col gap-3 p-4 max-w-lg mx-auto mt-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </AppShell>
    )
  }

  const activeMembers = group.members.filter((m) => m.is_active)

  return (
    <AppShell>
      <TopBar title="Add expense" showBack />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="max-w-lg mx-auto px-4 py-6 pb-32 flex flex-col gap-6">

          {/* ── Amount + paid by ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-5">
            {/* Amount */}
            <div className="flex flex-col items-center mb-5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Amount
              </label>
              <div className="flex items-center gap-1">
                <span className="text-3xl font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...register('total_amount')}
                  className="w-48 text-4xl font-bold text-gray-900 text-center bg-transparent border-0 focus:outline-none placeholder:text-gray-200"
                />
              </div>
              {errors.total_amount && (
                <p className="text-xs text-red-500 mt-1">{errors.total_amount.message}</p>
              )}
            </div>

            {/* Paid by */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Paid by
              </label>
              <div className="relative">
                <select
                  {...register('paid_by')}
                  className="w-full h-10 pl-3.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select who paid</option>
                  {activeMembers.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.id === user?.id ? `You (${m.user.name})` : m.user.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.paid_by && <p className="text-xs text-red-500 mt-1">{errors.paid_by.message}</p>}
            </div>
          </div>

          {/* ── Details ──────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-5 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</h3>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">What was it for?</label>
              <input
                type="text"
                placeholder="e.g. Dinner at Barbeque Nation"
                {...register('title')}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-300"
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Date</label>
              <input
                type="date"
                {...register('expense_date')}
                className="w-full h-10 px-3.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('category', value)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                      category === value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    )}
                  >
                    <span className="text-base leading-none">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Split ────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-5 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Split</h3>

            {/* Split type tabs */}
            <div className="grid grid-cols-4 gap-1 bg-gray-100 rounded-xl p-1">
              {SPLIT_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleSplitTypeChange(tab.value)}
                  className={cn(
                    'py-2 rounded-lg text-xs font-semibold transition-colors',
                    splitType === tab.value
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Split editor */}
            {splitType === 'equal' && (
              <EqualSplitEditor
                members={group.members}
                selectedIds={equalMembers}
                totalAmount={totalAmount}
                onChange={setEqualMembers}
              />
            )}
            {splitType === 'percentage' && (
              <PercentageSplitEditor
                members={group.members}
                percentages={percentages}
                onChange={setPercentages}
              />
            )}
            {splitType === 'exact' && (
              <ExactSplitEditor
                members={group.members}
                amounts={exactAmounts}
                totalAmount={totalAmount}
                onChange={setExactAmounts}
              />
            )}
            {splitType === 'itemized' && (
              <ItemizedSplitEditor
                members={group.members}
                items={items}
                onChange={setItems}
              />
            )}
          </div>
        </div>

        {/* ── Sticky submit bar ─────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 md:left-60 z-30 bg-white border-t border-gray-200 px-4 py-3 pb-safe">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="w-24"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              loading={createExpense.isPending}
              className="flex-1"
            >
              Save expense
            </Button>
          </div>
        </div>
      </form>
    </AppShell>
  )
}
