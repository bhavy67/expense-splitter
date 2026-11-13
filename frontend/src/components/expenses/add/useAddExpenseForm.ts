import { useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useGroup } from '@/hooks/useStore'
import { saveExpense, getExpense, getPayments, generateId } from '@/lib/storage'
import { getTemplates, saveTemplate, deleteTemplate } from '@/lib/templates'
import { buildEqualSplits, buildItemizedSplits, buildWeightedSplits, buildExactSplits, MAX_AMOUNT } from '@/lib/calculations'
import { formatCurrency } from '@/lib/currency'
import { toast } from '@/components/common/Toast'
import { today } from '@/lib/utils'
import type { Expense, SplitType, ExpenseCategory, SplitEntry, ExpenseItem } from '@/types'

const RECEIPT_MAX_PX = 1280

// Phone photos are 2–5 MB; storage holds ~5 MB total. Downscale to a JPEG
// of ~100–200 KB so receipts fit (createImageBitmap applies EXIF rotation).
async function compressReceipt(file: File): Promise<string> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, RECEIPT_MAX_PX / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return canvas.toDataURL('image/jpeg', 0.7)
}


// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormItem {
  id: string
  name: string
  amount: string
  memberIds: string[]
}

// All add/edit-expense state and submit logic. Moved verbatim from AddExpensePage;
// returns null when the group doesn't exist.
export function useAddExpenseForm() {
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
  const [date, setDate]       = useState(existing?.date ?? today())
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? 'other')
  const [notes, setNotes]     = useState(existing?.notes ?? '')
  const [paidBy, setPaidBy]   = useState(existing?.paidBy ?? group?.members[0]?.id ?? '')
  const [splitType, setSplitType] = useState<SplitType>(existing?.splitType ?? 'equal')
  const [receiptImage, setReceiptImage] = useState<string | undefined>(existing?.receiptImage)
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

  if (!group) return null

  // ── Derived / computed ──────────────────────────────────────────────────────

  const currency = group.currency
  const amt      = parseFloat(amount) || 0

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
    if (!saveTemplate({ name, title: title.trim() || 'Expense', category, splitType, notes: notes.trim() || undefined })) return
    setTemplates(getTemplates())
    setSavingTemplate(false)
    setTemplateName('')
    toast.success(`Template "${name}" saved`)
  }

  function handleDeleteTemplate(id: string) {
    deleteTemplate(id)
    setTemplates(getTemplates())
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setReceiptImage(await compressReceipt(file))
    } catch {
      toast.error("Couldn't read that image — try a JPG or PNG")
    }
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
      const splits = buildWeightedSplits(amt, group!.members.map(m => ({ memberId: m.id, weight: shareVals[m.id] ?? 0 })))
      if (splits.length === 0) { toast.error('Assign at least one share'); return null }
      return { splits: splits.map(s => ({ ...s, shares: shareVals[s.memberId] })) }
    }

    if (splitType === 'percentage') {
      if (amt <= 0) { toast.error('Enter an amount'); return null }
      if (Math.abs(pctTotal - 100) > 0.01) { toast.error(`Percentages must total 100% (currently ${pctTotal.toFixed(1)}%)`); return null }
      const splits = buildWeightedSplits(amt, group!.members.map(m => ({ memberId: m.id, weight: pctVals[m.id] ?? 0 })))
      return { splits: splits.map(s => ({ ...s, percentage: pctVals[s.memberId] })) }
    }

    if (splitType === 'exact') {
      if (amt <= 0) { toast.error('Enter an amount'); return null }
      if (Math.abs(exactRemain) > 0.01) { toast.error(`Amounts must total ${formatCurrency(amt, currency)} — ${exactRemain > 0 ? formatCurrency(exactRemain, currency) + ' remaining' : formatCurrency(-exactRemain, currency) + ' over'}`); return null }
      const splits = buildExactSplits(amt, group!.members.map(m => ({ memberId: m.id, amount: parseFloat(exactVals[m.id] || '0') || 0 })))
      if (splits.length === 0) { toast.error('Assign amounts to at least one member'); return null }
      return { splits }
    }

    // itemized
    if (itemizedTotal <= 0) { toast.error('Add at least one item'); return null }
    const { splits, items } = buildItemizedSplits(
      formItems.map(it => ({ id: it.id, name: it.name, amount: parseFloat(it.amount) || 0, memberIds: it.memberIds }))
    )
    if (splits.length === 0) { toast.error('Assign items to members'); return null }
    return { splits, items }
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
    if (finalAmount > MAX_AMOUNT) { toast.error(`Amount can't exceed ${formatCurrency(MAX_AMOUNT, group!.currency)}`); return }

    const now = new Date().toISOString()
    const expense: Expense = {
      id: existing?.id ?? generateId(),
      groupId: groupId!,
      title: trimmedTitle,
      amount: finalAmount,
      currency: group!.currency,
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

    if (!saveExpense(expense)) return // storage full: the error toast is shown; keep the form so nothing is lost
    // Recorded payments aren't touched by an edit, so settled balances can shift.
    toast.success(existing
      ? getPayments(groupId!).length > 0 ? 'Expense updated — recorded payments are unchanged, check balances' : 'Expense updated'
      : 'Expense added')
    navigate(existing ? `/g/${groupId}/expenses/${expense.id}` : `/g/${groupId}`)
  }

  return {
    group, existing, groupId: groupId!, navigate, photoRef,
    title, setTitle, amount, setAmount, date, setDate, category, setCategory, notes, setNotes,
    paidBy, setPaidBy, splitType, setSplitType, receiptImage, setReceiptImage,
    templates, savingTemplate, setSavingTemplate, templateName, setTemplateName,
    equalIncluded, setEqualIncluded, shareVals, setShareVals, pctVals, setPctVals,
    exactVals, setExactVals, formItems, setFormItems,
    currency, amt, itemizedTotal, pctTotal, exactRemain, shareTotalCount,
    applyTemplate, handleSaveTemplate, handleDeleteTemplate, handlePhotoChange,
    distributeExactEqually, toggleItemMember, addItem, removeItem, handleSubmit,
  }
}

export type AddExpenseForm = NonNullable<ReturnType<typeof useAddExpenseForm>>
