import { useState } from 'react'
import { ChevronDown, ChevronUp, ArrowRight, CheckCircle2, PlusCircle, Zap } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { RecordPaymentModal } from './RecordPaymentModal'
import { deletePayment, savePayment, generateId } from '@/lib/storage'
import { calculateBalances, simplifyDebts } from '@/lib/calculations'
import { formatCurrency } from '@/lib/currency'
import { toast } from '@/components/common/Toast'
import { cn } from '@/lib/utils'
import type { Group, Expense, Payment } from '@/types'

type ConfirmConfig = { title: string; description?: string; confirmLabel: string; danger?: boolean; onConfirm: () => void }

interface Props {
  group: Group
  expenses: Expense[]
  payments: Payment[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface PaymentTarget {
  fromId?: string
  toId?: string
  amount?: number
}

export function BalancesTab({ group, expenses, payments }: Props) {
  const [showHistory, setShowHistory] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null)

  function doSettleAll() {
    const now = new Date()
    for (const debt of debts) {
      savePayment({
        id: generateId(),
        groupId: group.id,
        fromMemberId: debt.from,
        toMemberId: debt.to,
        amount: debt.amount,
        date: now.toISOString().split('T')[0],
        createdAt: now.toISOString(),
      })
    }
    toast.success(`${debts.length} payment${debts.length > 1 ? 's' : ''} recorded — all settled!`)
    setConfirmConfig(null)
  }

  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]))
  const balances = calculateBalances(expenses, payments, group.members)
  const debts = simplifyDebts(balances)

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const isSettled = debts.length === 0

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#f0ede5] dark:bg-[#1a1a17] border-2 border-[#0a0a0a] dark:border-[#f0ede5]/30 flex items-center justify-center mx-auto mb-3 text-3xl">
          ⚖️
        </div>
        <p className="text-sm font-mono font-bold text-[#0a0a0a] dark:text-[#f0ede5] uppercase tracking-[0.08em] mb-1">No expenses yet</p>
        <p className="text-[11px] font-mono text-[#4a4940] dark:text-[#a09880]">
          Add expenses first to see who owes what
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total spent', value: formatCurrency(totalExpenses, group.currency), color: 'text-[#0a0a0a] dark:text-[#f0ede5]' },
          { label: 'Settled', value: formatCurrency(totalPaid, group.currency), color: 'text-[#22c55e]' },
          { label: 'Pending', value: debts.length > 0 ? `${debts.length} txn${debts.length > 1 ? 's' : ''}` : 'All clear', color: debts.length > 0 ? 'text-[#f59e0b]' : 'text-[#22c55e]' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] p-3 text-center shadow-[2px_2px_0_#0a0a0a] dark:shadow-[2px_2px_0_#b9f542]">
            <p className={cn('text-sm font-mono font-bold', s.color)}>{s.value}</p>
            <p className="text-[9px] font-mono uppercase tracking-wider text-[#4a4940] dark:text-[#a09880] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Who owes who */}
      <div className="bg-white dark:bg-[#1e1e1a] border-2 border-[#0a0a0a] dark:border-[#f0ede5] rounded overflow-hidden">
        <div className="bg-[#0a0a0a] dark:bg-[#1a1a17] px-4 py-2.5 flex items-center justify-between">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#f0ede5]">
            Who pays who
          </p>
          <div className="flex items-center gap-3">
            {!isSettled && debts.length > 1 && (
              <button
                onClick={() => setConfirmConfig({
                  title: 'Settle all debts?',
                  description: `This will record ${debts.length} payment${debts.length > 1 ? 's' : ''} to clear all outstanding balances at once.`,
                  confirmLabel: 'Settle all',
                  onConfirm: doSettleAll,
                })}
                className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#b9f542] hover:text-[#a3db2e] transition-colors"
              >
                <Zap className="w-3 h-3" />
                Settle all
              </button>
            )}
            <button
              onClick={() => setPaymentTarget({ fromId: group.members[0]?.id, toId: group.members[1]?.id })}
              className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#f0ede5]/60 hover:text-[#f0ede5] transition-colors"
            >
              <PlusCircle className="w-3 h-3" />
              Record
            </button>
          </div>
        </div>

        {isSettled ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[#22c55e]">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-mono font-bold uppercase tracking-[0.08em]">All settled!</span>
          </div>
        ) : (
          <div>
            {debts.map((debt, i) => {
              const from = memberMap[debt.from]
              const to = memberMap[debt.to]
              if (!from || !to) return null
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 last:border-0"
                >
                  {/* From */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: from.color }}
                    >
                      {from.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5] truncate max-w-[70px]">
                      {from.name}
                    </span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-[#4a4940] dark:text-[#a09880] shrink-0" />

                  {/* To */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: to.color }}
                    >
                      {to.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5] truncate max-w-[70px]">
                      {to.name}
                    </span>
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-mono font-bold text-[#f59e0b] shrink-0">
                    {formatCurrency(debt.amount, group.currency)}
                  </span>

                  {/* Settle button */}
                  <button
                    onClick={() => setPaymentTarget({ fromId: debt.from, toId: debt.to, amount: debt.amount })}
                    className="shrink-0 text-[9px] font-mono font-bold px-2.5 py-1 rounded bg-[#b9f542] text-[#0a0a0a] border border-[#0a0a0a] uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    Settle
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Member balances */}
      <div className="bg-white dark:bg-[#1e1e1a] border-2 border-[#0a0a0a] dark:border-[#f0ede5] rounded overflow-hidden">
        <div className="bg-[#0a0a0a] dark:bg-[#1a1a17] px-4 py-2.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#f0ede5]">
            Individual balances
          </p>
        </div>
        {balances.map((b) => {
          const m = memberMap[b.memberId]
          if (!m) return null
          const isPos = b.net > 0.01
          const isNeg = b.net < -0.01
          return (
            <div
              key={b.memberId}
              className="flex items-center gap-3 px-4 py-3 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 last:border-0"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: m.color }}
              >
                {m.name[0]?.toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5]">{m.name}</span>
              <div className="text-right">
                {isPos && (
                  <p className="text-sm font-mono font-bold text-[#22c55e]">
                    +{formatCurrency(b.net, group.currency)}
                  </p>
                )}
                {isNeg && (
                  <p className="text-sm font-mono font-bold text-[#ff5c3d]">
                    -{formatCurrency(Math.abs(b.net), group.currency)}
                  </p>
                )}
                {!isPos && !isNeg && (
                  <p className="text-sm font-mono font-medium text-[#4a4940] dark:text-[#a09880]">Settled</p>
                )}
                <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mt-0.5">
                  {isPos ? 'gets back' : isNeg ? 'owes' : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-[#1e1e1a] border-2 border-[#0a0a0a] dark:border-[#f0ede5] rounded overflow-hidden">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full bg-[#0a0a0a] dark:bg-[#1a1a17] px-4 py-2.5 flex items-center justify-between hover:opacity-90 transition-opacity"
          >
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#f0ede5]">
              Payment history <span className="font-mono">({payments.length})</span>
            </p>
            {showHistory
              ? <ChevronUp className="w-4 h-4 text-[#f0ede5]/60" />
              : <ChevronDown className="w-4 h-4 text-[#f0ede5]/60" />
            }
          </button>
          {showHistory && (
            <div>
              {payments.map((p) => {
                const from = memberMap[p.fromMemberId]
                const to = memberMap[p.toMemberId]
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#0a0a0a]/10 dark:border-[#f0ede5]/10 last:border-0"
                  >
                    {from && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ background: from.color }}
                      >
                        {from.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-medium text-[#0a0a0a] dark:text-[#f0ede5]">
                        {from?.name ?? '?'} → {to?.name ?? '?'}
                      </p>
                      <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mt-0.5">
                        {fmtDate(p.date)}{p.note ? ` · ${p.note}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-mono font-bold text-[#22c55e] shrink-0">
                      {formatCurrency(p.amount, group.currency)}
                    </span>
                    <button
                      onClick={() => setConfirmConfig({
                        title: 'Delete payment?',
                        description: 'This payment record will be removed. Balances will be recalculated.',
                        confirmLabel: 'Delete',
                        danger: true,
                        onConfirm: () => { deletePayment(group.id, p.id); setConfirmConfig(null) },
                      })}
                      className="p-1 rounded text-[#4a4940] dark:text-[#a09880] hover:text-[#ff5c3d] hover:bg-[#ff5c3d]/10 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                        <path d="M3 4h10M6 4V2.5h4V4M6.5 7v5M9.5 7v5M4 4l.8 9.5h6.4L12 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Record payment button */}
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => setPaymentTarget({ fromId: group.members[0]?.id, toId: group.members[1]?.id })}
      >
        <PlusCircle className="w-4 h-4" />
        Record a payment
      </Button>

      {paymentTarget !== null && (
        <RecordPaymentModal
          open
          onClose={() => setPaymentTarget(null)}
          groupId={group.id}
          currency={group.currency}
          members={group.members}
          defaultFrom={paymentTarget.fromId}
          defaultTo={paymentTarget.toId}
          defaultAmount={paymentTarget.amount}
        />
      )}

      {confirmConfig && (
        <ConfirmModal
          {...confirmConfig}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  )
}
