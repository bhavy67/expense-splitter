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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3 text-3xl">
          ⚖️
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">No expenses yet</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500">
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
          { label: 'Total spent', value: formatCurrency(totalExpenses, group.currency), color: 'text-gray-900 dark:text-zinc-100' },
          { label: 'Settled', value: formatCurrency(totalPaid, group.currency), color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Pending', value: debts.length > 0 ? `${debts.length} txn${debts.length > 1 ? 's' : ''}` : 'All clear', color: debts.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-3 text-center">
            <p className={cn('text-base font-bold', s.color)}>{s.value}</p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Who owes who */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
            Who pays who
          </p>
          <div className="flex items-center gap-2">
            {!isSettled && debts.length > 1 && (
              <button
                onClick={() => setConfirmConfig({
                  title: 'Settle all debts?',
                  description: `This will record ${debts.length} payment${debts.length > 1 ? 's' : ''} to clear all outstanding balances at once.`,
                  confirmLabel: 'Settle all',
                  onConfirm: doSettleAll,
                })}
                className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors"
              >
                <Zap className="w-3 h-3" />
                Settle all
              </button>
            )}
            <button
              onClick={() => setPaymentTarget({ fromId: group.members[0]?.id, toId: group.members[1]?.id })}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              <PlusCircle className="w-3 h-3" />
              Record
            </button>
          </div>
        </div>

        {isSettled ? (
          <div className="flex items-center justify-center gap-2 py-8 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">All settled!</span>
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
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-zinc-800/50 last:border-0"
                >
                  {/* From */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: from.color }}
                    >
                      {from.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate max-w-[70px]">
                      {from.name}
                    </span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600 shrink-0" />

                  {/* To */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: to.color }}
                    >
                      {to.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate max-w-[70px]">
                      {to.name}
                    </span>
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    {formatCurrency(debt.amount, group.currency)}
                  </span>

                  {/* Settle button */}
                  <button
                    onClick={() => setPaymentTarget({ fromId: debt.from, toId: debt.to, amount: debt.amount })}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 transition-colors"
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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
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
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-zinc-800/50 last:border-0"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: m.color }}
              >
                {m.name[0]?.toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200">{m.name}</span>
              <div className="text-right">
                {isPos && (
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(b.net, group.currency)}
                  </p>
                )}
                {isNeg && (
                  <p className="text-sm font-bold text-red-500 dark:text-red-400">
                    -{formatCurrency(Math.abs(b.net), group.currency)}
                  </p>
                )}
                {!isPos && !isNeg && (
                  <p className="text-sm font-medium text-gray-400 dark:text-zinc-500">Settled</p>
                )}
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  {isPos ? 'gets back' : isNeg ? 'owes' : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
              Payment history ({payments.length})
            </p>
            {showHistory
              ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
              : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
            }
          </button>
          {showHistory && (
            <div className="border-t border-gray-100 dark:border-zinc-800">
              {payments.map((p) => {
                const from = memberMap[p.fromMemberId]
                const to = memberMap[p.toMemberId]
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-zinc-800/50 last:border-0"
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
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                        {from?.name ?? '?'} → {to?.name ?? '?'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                        {fmtDate(p.date)}{p.note ? ` · ${p.note}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
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
                      className="p-1 rounded-lg text-gray-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
