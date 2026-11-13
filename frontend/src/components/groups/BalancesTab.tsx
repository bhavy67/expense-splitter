import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowDownLeft, ArrowUpRight, Check, PlusCircle, QrCode, AtSign, Scale, Trash2, MessageCircle } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { whatsappRemindText } from '@/lib/upi'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Card } from '@/components/ui/Card'
import { ListRow } from '@/components/ui/ListRow'
import { Avatar } from '@/components/ui/Avatar'
import { IconTile } from '@/components/ui/IconTile'
import { Money } from '@/components/ui/Money'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { RecordPaymentModal } from './RecordPaymentModal'
import { UpiQrModal } from '@/components/upi/UpiQrModal'
import { deletePayment, savePayments, generateId } from '@/lib/storage'
import { calculateBalances, simplifyDebts } from '@/lib/calculations'
import { isUpiSupportedCurrency } from '@/lib/upi'
import { toast } from '@/components/common/Toast'
import { today } from '@/lib/utils'
import type { Debt, Group, Expense, Payment } from '@/types'

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
  const navigate = useNavigate()
  const [showHistory, setShowHistory] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null)
  const [upiDebt, setUpiDebt] = useState<Debt | null>(null)

  function doSettleAll() {
    const now = new Date().toISOString()
    const saved = savePayments(debts.map((debt) => ({
      id: generateId(),
      groupId: group.id,
      fromMemberId: debt.from,
      toMemberId: debt.to,
      amount: debt.amount,
      date: today(),
      createdAt: now,
    })))
    if (!saved) { setConfirmConfig(null); return }
    toast.success(`${debts.length} payment${debts.length > 1 ? 's' : ''} recorded — all settled!`)
    setConfirmConfig(null)
  }

  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]))
  const balances = calculateBalances(expenses, payments, group.members)
  const debts = simplifyDebts(balances)
  const isInr = isUpiSupportedCurrency(group.currency)

  function handleUpiClick(debt: Debt) {
    const to = memberMap[debt.to]
    if (!isInr) {
      toast.info(`UPI is only available for INR groups (this group uses ${group.currency})`)
      return
    }
    if (!to?.upiId) {
      toast.info(`${to?.name ?? 'This member'} hasn't added a UPI ID — ask them to add it in Group Settings`)
      return
    }
    setUpiDebt(debt)
  }

  function handleRemindWhatsApp(debt: Debt) {
    const from = memberMap[debt.from]
    const to   = memberMap[debt.to]
    if (!from || !to) return
    const text = whatsappRemindText({
      fromName:  from.name,
      toName:    to.name,
      amount:    debt.amount,
      groupName: group.name,
    })
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const isSettled = debts.length === 0

  const pendingTotal = debts.reduce((s, d) => s + d.amount, 0)
  const recordPayment = () => setPaymentTarget({ fromId: group.members[0]?.id, toId: group.members[1]?.id })

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<Scale />}
        title="No expenses yet"
        description="Add expenses first to see who owes what."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Summary */}
      <Card variant="inset" className="grid grid-cols-3 divide-x divide-border">
        {[
          { label: 'Total', amount: totalExpenses },
          { label: 'Settled', amount: totalPaid },
          { label: 'Pending', amount: pendingTotal },
        ].map((s) => (
          <div key={s.label} className="min-w-0 px-3 py-3">
            <p className="text-caption text-fg-muted">{s.label}</p>
            <Money amount={s.amount} currency={group.currency} className="block font-semibold whitespace-normal [overflow-wrap:anywhere]" />
          </div>
        ))}
      </Card>

      {/* UPI setup nudge — only when INR + debts exist + zero members have UPI IDs */}
      {isInr && !isSettled && group.members.every((m) => !m.upiId) && (
        <Card variant="inset" className="flex items-center gap-3 py-1.5 pr-1.5 pl-3">
          <AtSign className="size-4 shrink-0 text-fg-muted" aria-hidden />
          <p className="flex-1 text-body-sm text-fg-muted">Add UPI IDs to show a payment QR for each person</p>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/g/${group.id}/settings`)}>Set up</Button>
        </Card>
      )}

      {/* Suggested settlements */}
      <section>
        <SectionHeader
          title="Settle up"
          count={debts.length || undefined}
          action={!isSettled && debts.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmConfig({
                title: 'Settle all debts?',
                description: `This will record ${debts.length} payment${debts.length > 1 ? 's' : ''} to clear all outstanding balances at once.`,
                confirmLabel: 'Settle all',
                onConfirm: doSettleAll,
              })}
            >
              Settle all
            </Button>
          )}
        />

        {isSettled ? (
          <Card className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <IconTile icon={Check} size="lg" />
            <p className="text-title">Everyone's settled up</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {debts.map((debt, i) => {
              const from = memberMap[debt.from]
              const to = memberMap[debt.to]
              if (!from || !to) return null
              const canUpi = isInr && !!to.upiId
              return (
                <Card key={i} className="flex flex-col gap-3 p-4">
                  <p className="flex min-w-0 items-center gap-2 text-body font-medium">
                    <span className="truncate">{from.name}</span>
                    <ArrowRight className="size-4 shrink-0 text-fg-muted" aria-hidden />
                    <span className="sr-only"> owes </span>
                    <span className="truncate">{to.name}</span>
                  </p>
                  {/* Amount + actions on their own line so names never get squeezed at 360px */}
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Money amount={debt.amount} currency={group.currency} size="lg" className="mr-auto font-semibold" />
                    {canUpi ? (
                      <Button variant="secondary" size="sm" onClick={() => handleUpiClick(debt)}>
                        <QrCode className="size-4" />
                        Pay via UPI
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => handleRemindWhatsApp(debt)} title={`Remind ${to.name} via WhatsApp`}>
                        <MessageCircle className="size-4" />
                        Remind
                      </Button>
                    )}
                    <Button size="sm" onClick={() => setPaymentTarget({ fromId: debt.from, toId: debt.to, amount: debt.amount })}>
                      Settle
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Net balance per member — sign + word + arrow, never colour alone */}
      <section>
        <SectionHeader title="Balances" />
        <Card className="overflow-hidden">
          {balances.map((b) => {
            const m = memberMap[b.memberId]
            if (!m) return null
            const isPos = b.net > 0.01
            const isNeg = b.net < -0.01
            const Icon = isPos ? ArrowDownLeft : isNeg ? ArrowUpRight : Check
            const word = isPos ? 'gets back' : isNeg ? 'owes' : 'settled up'
            return (
              <ListRow
                key={b.memberId}
                divider
                leading={<Avatar name={m.name} />}
                title={m.name}
                subtitle={
                  <span className="inline-flex items-center gap-1">
                    <Icon className="size-3.5 shrink-0" aria-hidden />
                    {word}
                  </span>
                }
                trailing={(isPos || isNeg) ? (
                  <Money
                    amount={b.net}
                    currency={group.currency}
                    showSign
                    tone={isPos ? 'positive' : 'negative'}
                    className={isNeg ? 'font-semibold' : 'font-medium'}
                  />
                ) : (
                  <span className="text-body text-fg-muted">—</span>
                )}
              />
            )
          })}
        </Card>
      </section>

      {/* Payment history */}
      {payments.length > 0 && (
        <section>
          <SectionHeader
            title="Payments"
            count={payments.length}
            action={
              <Button variant="ghost" size="sm" aria-expanded={showHistory} onClick={() => setShowHistory((v) => !v)}>
                {showHistory ? 'Hide' : 'Show'}
              </Button>
            }
          />
          {showHistory && (
            <Card className="overflow-hidden">
              {payments.map((p) => {
                const from = memberMap[p.fromMemberId]
                const to = memberMap[p.toMemberId]
                return (
                  <ListRow
                    key={p.id}
                    divider
                    className="pr-1"
                    leading={from && <Avatar name={from.name} />}
                    title={`${from?.name ?? '?'} paid ${to?.name ?? '?'}`}
                    subtitle={`${fmtDate(p.date)}${p.note ? ` · ${p.note}` : ''}`}
                    trailing={
                      <div className="flex items-center">
                        <Money amount={p.amount} currency={group.currency} className="font-medium" />
                        <IconButton
                          aria-label="Delete payment"
                          className="text-fg-muted"
                          onClick={() => setConfirmConfig({
                            title: 'Delete payment?',
                            description: 'This payment record will be removed. Balances will be recalculated.',
                            confirmLabel: 'Delete',
                            danger: true,
                            onConfirm: () => { deletePayment(group.id, p.id); setConfirmConfig(null) },
                          })}
                        >
                          <Trash2 />
                        </IconButton>
                      </div>
                    }
                  />
                )
              })}
            </Card>
          )}
        </section>
      )}

      <Button variant="secondary" fullWidth onClick={recordPayment}>
        <PlusCircle className="size-4" />
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

      <AnimatePresence>
        {upiDebt && (
          <UpiQrModal
            debt={upiDebt}
            group={group}
            members={group.members}
            onClose={() => setUpiDebt(null)}
          />
        )}
      </AnimatePresence>

      {confirmConfig && (
        <ConfirmModal
          {...confirmConfig}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  )
}
