import { useState, useEffect } from 'react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, MoneyInput } from '@/components/ui/Field'
import { Chip } from '@/components/ui/Chip'
import { Avatar } from '@/components/ui/Avatar'
import { Sheet } from '@/components/ui/Dialog'
import { savePayment, generateId } from '@/lib/storage'
import { formatCurrency } from '@/lib/currency'
import { MAX_AMOUNT } from '@/lib/calculations'
import { toast } from '@/components/common/Toast'
import { today } from '@/lib/utils'
import type { Member } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  groupId: string
  currency: string
  members: Member[]
  defaultFrom?: string
  defaultTo?: string
  defaultAmount?: number
}

export function RecordPaymentModal({
  open, onClose, groupId, currency, members, defaultFrom, defaultTo, defaultAmount,
}: Props) {
  const [fromId, setFromId] = useState(defaultFrom ?? members[0]?.id ?? '')
  const [toId, setToId] = useState(defaultTo ?? members[1]?.id ?? '')
  const [amount, setAmount] = useState(defaultAmount ? defaultAmount.toFixed(2) : '')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today())

  useEffect(() => {
    if (open) {
      setFromId(defaultFrom ?? members[0]?.id ?? '')
      setToId(defaultTo ?? members[1]?.id ?? '')
      setAmount(defaultAmount ? defaultAmount.toFixed(2) : '')
      setNote('')
      setDate(today())
    }
  }, [open, defaultFrom, defaultTo, defaultAmount, members])

  const amt = parseFloat(amount) || 0
  const fromMember = members.find((m) => m.id === fromId)
  const toMember = members.find((m) => m.id === toId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromId || !toId) { toast.error('Select both members'); return }
    if (fromId === toId) { toast.error('From and To must be different members'); return }
    if (amt <= 0) { toast.error('Enter a valid amount'); return }
    if (amt > MAX_AMOUNT) { toast.error(`Amount can't exceed ${formatCurrency(MAX_AMOUNT, currency)}`); return }
    const now = new Date().toISOString()
    const saved = savePayment({
      id: generateId(),
      groupId,
      fromMemberId: fromId,
      toMemberId: toId,
      amount: amt,
      note: note.trim() || undefined,
      date,
      createdAt: now,
    })
    if (!saved) return
    toast.success('Payment recorded')
    onClose()
  }

  const picker = (label: string, selected: string, other: string, onPick: (id: string) => void) => (
    <div>
      <p className="mb-1.5 text-caption text-fg-muted">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {members.map((m) => (
          <Chip key={m.id} selected={selected === m.id} disabled={m.id === other} onClick={() => onPick(m.id)} className="pl-1">
            <Avatar name={m.name} size={28} />
            {m.name}
          </Chip>
        ))}
      </div>
    </div>
  )

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Record a payment"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" type="button" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="record-payment-form" className="flex-1">Record payment</Button>
        </div>
      }
    >
      <form id="record-payment-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label={`Amount (${currency})`}>
          <MoneyInput
            data-autofocus
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            prefix={currency === 'INR' ? '₹' : currency}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>

        {picker('From (who paid)', fromId, toId, setFromId)}
        <p className="-my-2 flex items-center gap-2 text-body-sm text-fg-muted">
          <ArrowDown className="size-4" aria-hidden />
          {fromMember && toMember ? `${fromMember.name} pays ${toMember.name}` : 'pays'}
          {fromMember && toMember && amt > 0 && <> · {formatCurrency(amt, currency)}</>}
        </p>
        {picker('To (who received)', toId, fromId, setToId)}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Note (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cash, UPI…" />
          </Field>
        </div>
      </form>
    </Sheet>
  )
}
