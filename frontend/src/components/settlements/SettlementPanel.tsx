import { useState } from 'react'
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/common/Button'
import { Avatar } from '@/components/common/Avatar'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useRecordPayment, useConfirmPayment, usePayments } from '@/hooks/useSettlements'
import type { GroupMember, Payment, Settlement } from '@/types'

interface SettlementPanelProps {
  groupId: string
  settlements: Settlement[]
  members: GroupMember[]
  currentUserId: string
}

// ─── Record Payment Modal ────────────────────────────────────────────────────

interface RecordPaymentModalProps {
  groupId: string
  settlement: Settlement
  fromName: string
  toName: string
  onClose: () => void
}

const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank' },
]

function RecordPaymentModal({ groupId, settlement, fromName, toName, onClose }: RecordPaymentModalProps) {
  const [note, setNote] = useState('')
  const [method, setMethod] = useState('upi')
  const [amount, setAmount] = useState(String(settlement.amount))
  const record = useRecordPayment(groupId)

  const parsedAmount = parseFloat(amount) || 0
  const isValid = parsedAmount > 0 && parsedAmount <= settlement.amount

  const submit = () => {
    if (!isValid) return
    record.mutate(
      {
        from_user_id: settlement.from_user_id,
        to_user_id: settlement.to_user_id,
        amount: parsedAmount,
        currency_code: settlement.currency_code,
        note,
        payment_method: method,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center p-4">
        <motion.div
          className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden border border-transparent dark:border-zinc-800"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <Avatar name={fromName} size="md" />
                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-zinc-500 shrink-0" />
                <Avatar name={toName} size="md" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 leading-tight">
                  {fromName} pays {toName}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  up to {formatCurrency(settlement.amount, settlement.currency_code)}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Amount</p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-sm font-medium">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {parsedAmount > settlement.amount && (
                  <p className="text-xs text-red-500 mt-1">
                    Can't exceed {formatCurrency(settlement.amount, settlement.currency_code)}
                  </p>
                )}
              </div>
            </div>

            {/* Method */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Payment method</p>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors',
                      method === m.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
                Note <span className="text-gray-400 dark:text-zinc-500 font-normal">(optional)</span>
              </p>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. GPay reference"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" loading={record.isPending} disabled={!isValid} onClick={submit}>
                Record
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ─── Payment History ─────────────────────────────────────────────────────────

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

interface PaymentHistoryProps {
  payments: Payment[]
  memberMap: Record<string, { name: string; avatar_url: string | null }>
  currentUserId: string
  groupId: string
}

function PaymentHistory({ payments, memberMap, currentUserId, groupId }: PaymentHistoryProps) {
  const [open, setOpen] = useState(false)
  const confirm = useConfirmPayment(groupId)

  if (payments.length === 0) return null

  return (
    <div className="border-t border-gray-100 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <span>Payment history ({payments.length})</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          {payments.map((p) => {
            const from = memberMap[p.from_user_id]
            const to = memberMap[p.to_user_id]
            const iAmRecipient = p.to_user_id === currentUserId && !p.confirmed_at
            return (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5',
                  p.confirmed_at
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : 'bg-amber-50 dark:bg-amber-950/30'
                )}
              >
                <Avatar name={from?.name ?? '?'} src={from?.avatar_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-zinc-300 leading-tight">
                    <span className="font-semibold">{from?.name ?? '?'}</span>
                    {' → '}
                    <span className="font-semibold">{to?.name ?? '?'}</span>
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                    {formatCurrency(p.amount, p.currency_code)}
                    {' · '}
                    {p.payment_method.replace('_', ' ')}
                    {' · '}
                    {formatTime(p.created_at)}
                  </p>
                </div>
                {p.confirmed_at ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : iAmRecipient ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-[11px] h-6 px-2 shrink-0"
                    loading={confirm.isPending}
                    onClick={() => confirm.mutate(p.id)}
                  >
                    Confirm
                  </Button>
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export function SettlementPanel({ groupId, settlements, members, currentUserId }: SettlementPanelProps) {
  const [payingSettlement, setPayingSettlement] = useState<Settlement | null>(null)
  const { data: payments = [] } = usePayments(groupId)
  const confirm = useConfirmPayment(groupId)

  const memberMap = Object.fromEntries(members.map((m) => [m.user.id, m.user]))

  const iOwe = settlements.filter((s) => s.from_user_id === currentUserId)
  const owedToMe = settlements.filter((s) => s.to_user_id === currentUserId)

  const totalIOwe = iOwe.reduce((sum, s) => sum + s.amount, 0)
  const totalOwedToMe = owedToMe.reduce((sum, s) => sum + s.amount, 0)
  const netBalance = totalOwedToMe - totalIOwe

  const currency = settlements[0]?.currency_code ?? 'INR'

  const pendingConfirmations = payments.filter(
    (p) => p.to_user_id === currentUserId && !p.confirmed_at
  )

  const allSettled = iOwe.length === 0 && owedToMe.length === 0

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">Settlements</h2>
          {!allSettled && (
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
              {iOwe.length + owedToMe.length} pending
            </span>
          )}
        </div>

        {/* Net balance summary */}
        {allSettled ? (
          <div className="flex flex-col items-center py-8 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">All settled up!</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">No outstanding balances in this group</p>
          </div>
        ) : (
          <div
            className={cn(
              'mx-4 my-3 rounded-xl px-4 py-3',
              netBalance > 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : netBalance < 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-50 dark:bg-zinc-800'
            )}
          >
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-0.5">Your net balance</p>
            <p className={cn(
              'text-xl font-bold',
              netBalance > 0 ? 'text-emerald-600 dark:text-emerald-400' : netBalance < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-zinc-400'
            )}>
              {netBalance > 0 && '+'}
              {formatCurrency(netBalance, currency)}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              {netBalance > 0
                ? `You'll receive ${formatCurrency(totalOwedToMe, currency)} total`
                : netBalance < 0
                ? `You owe ${formatCurrency(totalIOwe, currency)} total`
                : 'Even'}
            </p>
          </div>
        )}

        {/* Pending confirmations */}
        {pendingConfirmations.length > 0 && (
          <div className="mx-4 mb-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-4 py-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Awaiting your confirmation</p>
            <div className="flex flex-col gap-2.5">
              {pendingConfirmations.map((p) => {
                const from = memberMap[p.from_user_id]
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar name={from?.name ?? '?'} src={from?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-zinc-300 leading-tight">
                        <span className="font-semibold">{from?.name ?? 'Someone'}</span>
                        {' says they paid you '}
                        <span className="font-semibold">{formatCurrency(p.amount, p.currency_code)}</span>
                      </p>
                      {p.note && <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">"{p.note}"</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs shrink-0"
                      onClick={() => confirm.mutate(p.id)}
                      loading={confirm.isPending}
                    >
                      Confirm
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* I owe */}
        {iOwe.length > 0 && (
          <div className="px-4 pb-3">
            <p className="text-xs font-semibold text-red-500 mb-2">You owe</p>
            <div className="flex flex-col gap-2">
              {iOwe.map((s) => {
                const to = memberMap[s.to_user_id]
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5"
                  >
                    <Avatar name={to?.name ?? '?'} src={to?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate">{to?.name}</p>
                      <p className="text-xs text-red-500 font-bold">
                        {formatCurrency(s.amount, s.currency_code)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 text-xs bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setPayingSettlement(s)}
                    >
                      <ArrowRight className="w-3 h-3" />
                      Pay
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Owed to me */}
        {owedToMe.length > 0 && (
          <div className={cn('px-4 pb-3', iOwe.length > 0 && 'pt-1')}>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Owed to you</p>
            <div className="flex flex-col gap-2">
              {owedToMe.map((s) => {
                const from = memberMap[s.from_user_id]
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5"
                  >
                    <Avatar name={from?.name ?? '?'} src={from?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate">{from?.name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatCurrency(s.amount, s.currency_code)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1">
                      owes you
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Payment history */}
        <PaymentHistory
          payments={payments}
          memberMap={memberMap}
          currentUserId={currentUserId}
          groupId={groupId}
        />
      </div>

      {/* Record payment modal */}
      {payingSettlement && (
        <RecordPaymentModal
          groupId={groupId}
          settlement={payingSettlement}
          fromName="You"
          toName={memberMap[payingSettlement.to_user_id]?.name ?? 'them'}
          onClose={() => setPayingSettlement(null)}
        />
      )}
    </>
  )
}
