import { Plus, X, Camera, RefreshCw, BookMarked } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { TopBar } from '@/components/layout/TopBar'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useAddExpenseForm } from '@/components/expenses/add/useAddExpenseForm'
import type { SplitType, ExpenseCategory } from '@/types'

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
  const form = useAddExpenseForm()

  if (!form) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[100dvh] text-[11px] font-mono text-[#4a4940] dark:text-[#a09880]">
          Group not found
        </div>
      </AppShell>
    )
  }

  const {
    group, existing, groupId, navigate, photoRef,
    title, setTitle, amount, setAmount, date, setDate, category, setCategory, notes, setNotes,
    paidBy, setPaidBy, splitType, setSplitType, receiptImage, setReceiptImage,
    templates, savingTemplate, setSavingTemplate, templateName, setTemplateName,
    equalIncluded, setEqualIncluded, shareVals, setShareVals, pctVals, setPctVals,
    exactVals, setExactVals, formItems, setFormItems,
    currency, amt, itemizedTotal, pctTotal, exactRemain, shareTotalCount,
    applyTemplate, handleSaveTemplate, handleDeleteTemplate, handlePhotoChange,
    distributeExactEqually, toggleItemMember, addItem, removeItem, handleSubmit,
  } = form

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <TopBar title={existing ? 'Edit Expense' : 'Add Expense'} showBack />

      <PageTransition>
        <form id="add-expense-form" onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 pb-28 flex flex-col gap-5">

          {/* ── Templates strip ──────────────────────────────────────────── */}
          {templates.length > 0 && !existing && (
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-2 px-1">Templates</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center gap-0 shrink-0 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1e1e1a] shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#b9f542] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => applyTemplate(t.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-[#f0ede5] whitespace-nowrap hover:bg-[#b9f542]/20 transition-colors"
                    >
                      <BookMarked className="w-3 h-3 shrink-0" />
                      {t.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="w-3.5 h-3.5 rounded-full bg-[#ff5c3d] text-white flex items-center justify-center text-[8px] hover:opacity-80 mr-2 shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Amount ──────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] overflow-hidden">
            <div className="bg-[#0a0a0a] dark:bg-[#1a1a17] px-4 py-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#f0ede5]">Total amount</p>
            </div>
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl text-[#4a4940] dark:text-[#a09880] font-light">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={splitType === 'itemized' ? itemizedTotal.toFixed(2) : amount}
                  onChange={e => setAmount(e.target.value)}
                  readOnly={splitType === 'itemized'}
                  className={cn(
                    'text-4xl font-bold font-mono text-[#0a0a0a] dark:text-[#f0ede5] text-center bg-transparent border-none outline-none w-40',
                    splitType === 'itemized' && 'text-[#4a4940] dark:text-[#a09880]'
                  )}
                />
              </div>
              {splitType === 'itemized' && (
                <p className="text-[11px] font-mono text-[#4a4940] dark:text-[#a09880] mt-1">Calculated from items below</p>
              )}
            </div>
          </div>

          {/* ── Title & Date ─────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] overflow-hidden">
            <div className="bg-[#0a0a0a] dark:bg-[#1a1a17] px-4 py-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#f0ede5]">Details</p>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-1.5">Title</label>
                <input
                  autoFocus={!existing}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="What was this for?"
                  className="w-full h-10 px-3 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[13px] font-medium focus:outline-none focus:border-[#b9f542] focus:shadow-[2px_2px_0_#b9f542] transition-all placeholder:text-[#4a4940]/40 dark:placeholder:text-[#a09880]/40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full h-10 px-3 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[13px] font-medium focus:outline-none focus:border-[#b9f542] focus:shadow-[2px_2px_0_#b9f542] transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* ── Category ─────────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-2 px-1">Category</p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded border-2 text-center',
                    category === cat.value
                      ? 'border-[#0a0a0a] bg-[#b9f542] text-[#0a0a0a] text-[11px] font-mono uppercase tracking-wider font-bold shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#f0ede5] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all'
                      : 'border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 text-[11px] font-mono uppercase tracking-wider text-[#4a4940] dark:text-[#a09880] transition-all hover:border-[#0a0a0a] dark:hover:border-[#f0ede5]'
                  )}
                >
                  <span className="text-xl leading-none">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Paid by ──────────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-2 px-1">Paid by</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {group.members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaidBy(m.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded border-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-all',
                    paidBy === m.id
                      ? 'border-[#0a0a0a] text-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#b9f542] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                      : 'border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 text-[#4a4940] dark:text-[#a09880] bg-white dark:bg-[#1e1e1a] hover:border-[#0a0a0a] dark:hover:border-[#f0ede5]'
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
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-2 px-1">Split</p>

            {/* Split type tabs */}
            <div className="flex gap-2 mb-3">
              {SPLIT_TABS.map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSplitType(tab.value)}
                  title={tab.hint}
                  className={cn(
                    'flex-1 h-8 rounded border-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-all',
                    splitType === tab.value
                      ? 'border-[#0a0a0a] bg-[#b9f542] text-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#f0ede5] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                      : 'border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 text-[#4a4940] dark:text-[#a09880] hover:border-[#0a0a0a] dark:hover:border-[#f0ede5]'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] overflow-hidden">
              <div className="bg-[#0a0a0a] dark:bg-[#1a1a17] px-4 py-2.5">
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#f0ede5]">{SPLIT_TABS.find(t => t.value === splitType)?.hint}</p>
              </div>
              {/* Equal */}
              {splitType === 'equal' && (
                <div className="flex flex-col">
                  <p className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880] px-4 py-2 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10">Click to include / exclude members</p>
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
                          'flex items-center gap-3 px-4 py-3 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 last:border-0 transition-all text-left w-full',
                          on
                            ? 'bg-[#b9f542]/10'
                            : 'opacity-50'
                        )}
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.color }}>
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 text-[13px] font-medium text-[#0a0a0a] dark:text-[#f0ede5]">{m.name}</span>
                        {on && amt > 0 && (
                          <span className="text-[13px] font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5] shrink-0">
                            {formatCurrency(share, currency)}
                          </span>
                        )}
                        <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors', on ? 'bg-[#b9f542] border-[#0a0a0a]' : 'border-[#0a0a0a]/30 dark:border-[#f0ede5]/30')}>
                          {on && <svg className="w-3 h-3 text-[#0a0a0a]" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4.5 8L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Shares */}
              {splitType === 'shares' && (
                <div className="flex flex-col">
                  {group.members.map(m => {
                    const v = shareVals[m.id] ?? 0
                    const computed = shareTotalCount > 0 ? Math.round((v / shareTotalCount) * amt * 100) / 100 : 0
                    return (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 last:border-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.color }}>
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 text-[13px] font-medium text-[#0a0a0a] dark:text-[#f0ede5] truncate">{m.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button aria-label="Fewer shares"
                            type="button"
                            onClick={() => setShareVals(p => ({ ...p, [m.id]: Math.max(0, (p[m.id] ?? 0) - 1) }))}
                            className="w-7 h-7 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-[#f0ede5] dark:bg-[#1a1a17] flex items-center justify-center text-[#0a0a0a] dark:text-[#f0ede5] hover:bg-[#b9f542] hover:border-[#0a0a0a] transition-colors"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 12 2" fill="currentColor"><rect y="0.5" width="12" height="1" rx="0.5"/></svg>
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            value={v}
                            onChange={e => setShareVals(p => ({ ...p, [m.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                            className="h-8 w-16 px-2 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[13px] font-mono text-[#0a0a0a] dark:text-[#f0ede5] focus:outline-none focus:border-[#b9f542] text-center"
                          />
                          <button aria-label="More shares"
                            type="button"
                            onClick={() => setShareVals(p => ({ ...p, [m.id]: (p[m.id] ?? 0) + 1 }))}
                            className="w-7 h-7 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-[#f0ede5] dark:bg-[#1a1a17] flex items-center justify-center text-[#0a0a0a] dark:text-[#f0ede5] hover:bg-[#b9f542] hover:border-[#0a0a0a] transition-colors"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M5.5 0.5h1v11h-1V0.5zM0.5 5.5h11v1H0.5v-1z"/></svg>
                          </button>
                        </div>
                        {amt > 0 && v > 0 && (
                          <span className="text-[13px] font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5] shrink-0 w-24 text-right">
                            {formatCurrency(computed, currency)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {shareTotalCount > 0 && (
                    <p className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880] text-right px-4 py-2">{shareTotalCount} total shares</p>
                  )}
                </div>
              )}

              {/* Percentage */}
              {splitType === 'percentage' && (
                <div className="flex flex-col">
                  {group.members.map(m => {
                    const pct = pctVals[m.id] ?? 0
                    const computed = Math.round(pct / 100 * amt * 100) / 100
                    return (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 last:border-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.color }}>
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 text-[13px] font-medium text-[#0a0a0a] dark:text-[#f0ede5] truncate">{m.name}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="0.01"
                            value={pct}
                            onChange={e => setPctVals(p => ({ ...p, [m.id]: parseFloat(e.target.value) || 0 }))}
                            className="h-8 w-16 px-2 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[13px] font-mono text-[#0a0a0a] dark:text-[#f0ede5] focus:outline-none focus:border-[#b9f542] text-right"
                          />
                          <span className="text-[13px] font-mono text-[#4a4940] dark:text-[#a09880]">%</span>
                        </div>
                        {amt > 0 && (
                          <span className="text-[13px] font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5] w-24 text-right shrink-0">
                            {formatCurrency(computed, currency)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  <div className={cn('flex items-center justify-end gap-2 px-4 py-2 border-t border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 text-[11px] font-mono font-bold', Math.abs(pctTotal - 100) < 0.01 ? 'text-[#b9f542]' : 'text-[#ff5c3d]')}>
                    <span>{pctTotal.toFixed(1)}% of 100%</span>
                    {Math.abs(pctTotal - 100) < 0.01 && <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </div>
              )}

              {/* Exact */}
              {splitType === 'exact' && (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10">
                    <button
                      type="button"
                      onClick={distributeExactEqually}
                      className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#88bc20] hover:text-[#6b9418] transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Distribute equally
                    </button>
                  </div>
                  {group.members.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 last:border-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.color }}>
                        {m.name[0]?.toUpperCase()}
                      </div>
                      <span className="flex-1 text-[13px] font-medium text-[#0a0a0a] dark:text-[#f0ede5] truncate">{m.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-mono text-[#4a4940] dark:text-[#a09880]">{currency}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={exactVals[m.id] ?? ''}
                          onChange={e => setExactVals(p => ({ ...p, [m.id]: e.target.value }))}
                          className="h-8 w-20 px-2 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[13px] font-mono text-[#0a0a0a] dark:text-[#f0ede5] focus:outline-none focus:border-[#b9f542] text-right"
                        />
                      </div>
                    </div>
                  ))}
                  <div className={cn('flex items-center justify-end gap-2 px-4 py-2 border-t border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 text-[11px] font-mono font-bold', Math.abs(exactRemain) < 0.01 ? 'text-[#b9f542]' : 'text-[#ff5c3d]')}>
                    {Math.abs(exactRemain) < 0.01
                      ? <><svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Balanced</span></>
                      : <span>{exactRemain > 0 ? `${formatCurrency(exactRemain, currency)} remaining` : `${formatCurrency(-exactRemain, currency)} over`}</span>
                    }
                  </div>
                </div>
              )}

              {/* Itemized */}
              {splitType === 'itemized' && (
                <div className="flex flex-col">
                  {formItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 py-3 px-4 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 last:border-0 flex-wrap">
                      <input
                        placeholder={`Item ${idx + 1}`}
                        value={item.name}
                        onChange={e => setFormItems(p => p.map(it => it.id === item.id ? { ...it, name: e.target.value } : it))}
                        className="flex-1 min-w-[120px] h-8 px-2 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[13px] font-medium text-[#0a0a0a] dark:text-[#f0ede5] focus:outline-none focus:border-[#b9f542] placeholder:text-[#4a4940]/40 dark:placeholder:text-[#a09880]/40"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-mono text-[#4a4940] dark:text-[#a09880]">{currency}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={e => setFormItems(p => p.map(it => it.id === item.id ? { ...it, amount: e.target.value } : it))}
                          className="h-8 w-24 px-2 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[13px] font-mono text-[#0a0a0a] dark:text-[#f0ede5] focus:outline-none focus:border-[#b9f542] text-right"
                        />
                      </div>
                      {formItems.length > 1 && (
                        <button aria-label="Remove item" type="button" onClick={() => removeItem(item.id)} className="p-1 rounded text-[#ff5c3d] hover:bg-[#ff5c3d]/10 transition-colors border border-[#ff5c3d]/30">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <div className="flex flex-wrap gap-1.5 w-full">
                        {group.members.map(m => {
                          const on = item.memberIds.includes(m.id)
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleItemMember(item.id, m.id)}
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded border-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-all',
                                on
                                  ? 'border-[#0a0a0a] text-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#b9f542] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                                  : 'border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 text-[#4a4940] dark:text-[#a09880]'
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
                  <div className="px-4 py-3 flex items-center justify-between border-t border-[#0a0a0a]/10 dark:border-[#f0ede5]/10">
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#88bc20] hover:text-[#6b9418] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add item
                    </button>
                    {itemizedTotal > 0 && (
                      <span className="text-[13px] font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5]">
                        Total: {formatCurrency(itemizedTotal, currency)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Notes + Save template ────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] overflow-hidden">
            <div className="bg-[#0a0a0a] dark:bg-[#1a1a17] px-4 py-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#f0ede5]">Notes (optional)</p>
            </div>
            <div className="p-4">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Add a note..."
              className="w-full py-2 px-3 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[13px] font-medium focus:outline-none focus:border-[#b9f542] focus:shadow-[2px_2px_0_#b9f542] transition-all resize-none placeholder:text-[#4a4940]/40 dark:placeholder:text-[#a09880]/40"
            />
            {!existing && (
              <>
                <div className="h-px border-t border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 mt-3 mb-3" />
                {savingTemplate ? (
                  <div className="flex items-center gap-2 mt-3">
                    <BookMarked className="w-3.5 h-3.5 text-[#4a4940] dark:text-[#a09880] shrink-0" />
                    <input
                      autoFocus
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTemplate() } if (e.key === 'Escape') setSavingTemplate(false) }}
                      placeholder="Template name..."
                      className="flex-1 h-8 px-2.5 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[12px] font-mono focus:outline-none focus:border-[#b9f542] text-[#0a0a0a] dark:text-[#f0ede5] placeholder:text-[#4a4940]/40 dark:placeholder:text-[#a09880]/40"
                    />
                    <button type="button" onClick={handleSaveTemplate} className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#88bc20] hover:text-[#6b9418] transition-colors">Save</button>
                    <button type="button" onClick={() => setSavingTemplate(false)} className="text-[10px] font-mono uppercase tracking-wider text-[#4a4940] dark:text-[#a09880] hover:text-[#0a0a0a] dark:hover:text-[#f0ede5] transition-colors">Cancel</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setTemplateName(title || ''); setSavingTemplate(true) }}
                    className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#4a4940] dark:text-[#a09880] hover:text-[#0a0a0a] dark:hover:text-[#f0ede5] transition-colors"
                  >
                    <BookMarked className="w-3 h-3" />
                    Save as template
                  </button>
                )}
              </>
            )}
            </div>
          </div>

          {/* ── Receipt ──────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] overflow-hidden">
            <div className="bg-[#0a0a0a] dark:bg-[#1a1a17] px-4 py-2.5">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#f0ede5]">Receipt (optional)</p>
            </div>
            <div className="p-4">
            {receiptImage ? (
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img src={receiptImage} alt="Receipt" className="w-20 h-20 object-cover rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/30 overflow-hidden" />
                  <button aria-label="Remove receipt"
                    type="button"
                    onClick={() => setReceiptImage(undefined)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#ff5c3d] text-white flex items-center justify-center shadow hover:opacity-80 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#88bc20] hover:text-[#6b9418] transition-colors"
                >
                  Change photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex items-center gap-2 px-4 py-4 rounded border-2 border-dashed border-[#0a0a0a]/30 dark:border-[#f0ede5]/30 text-[11px] font-mono font-bold uppercase tracking-wider text-[#4a4940] dark:text-[#a09880] hover:border-[#0a0a0a] dark:hover:border-[#f0ede5] hover:text-[#0a0a0a] dark:hover:text-[#f0ede5] transition-colors w-full justify-center"
              >
                <Camera className="w-4 h-4" />
                Attach receipt photo
              </button>
            )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

        </form>
      </PageTransition>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 z-40 bg-[#f0ede5]/95 dark:bg-[#1a1a17]/95 backdrop-blur-sm border-t-2 border-[#0a0a0a] dark:border-[#f0ede5] px-4 py-3 pb-safe">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate(`/g/${groupId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-expense-form"
            className="flex-1"
          >
            {existing ? 'Save changes' : 'Add expense'}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
