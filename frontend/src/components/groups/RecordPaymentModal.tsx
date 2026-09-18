import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { savePayment, generateId } from '@/lib/storage'
import { formatCurrency } from '@/lib/currency'
import { toast } from '@/components/common/Toast'
import { cn } from '@/lib/utils'
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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (open) {
      setFromId(defaultFrom ?? members[0]?.id ?? '')
      setToId(defaultTo ?? members[1]?.id ?? '')
      setAmount(defaultAmount ? defaultAmount.toFixed(2) : '')
      setNote('')
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [open, defaultFrom, defaultTo, defaultAmount, members])

  if (!open) return null

  const amt = parseFloat(amount) || 0
  const fromMember = members.find((m) => m.id === fromId)
  const toMember = members.find((m) => m.id === toId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromId || !toId) { toast.error('Select both members'); return }
    if (fromId === toId) { toast.error('From and To must be different members'); return }
    if (amt <= 0) { toast.error('Enter a valid amount'); return }
    const now = new Date().toISOString()
    savePayment({
      id: generateId(),
      groupId,
      fromMemberId: fromId,
      toMemberId: toId,
      amount: amt,
      note: note.trim() || undefined,
      date,
      createdAt: now,
    })
    toast.success('Payment recorded')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-xl sm:mx-4 p-6 pb-8 sm:pb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Record Payment</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount */}
          <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Amount</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl text-gray-400 dark:text-zinc-500">{currency}</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="text-3xl font-bold text-gray-900 dark:text-zinc-100 text-center bg-transparent border-none outline-none w-36"
              />
            </div>
          </div>

          {/* From → To */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5">From (payer)</p>
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFromId(m.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all text-left',
                      fromId === m.id
                        ? 'border-transparent text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
                    )}
                    style={fromId === m.id ? { background: m.color } : undefined}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ background: fromId === m.id ? 'rgba(255,255,255,0.3)' : m.color }}
                    >
                      {m.name[0]?.toUpperCase()}
                    </div>
                    <span className="truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 pt-5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500 dark:text-zinc-400" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {fromMember && toMember && amt > 0 && (
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 text-center leading-tight">
                  {formatCurrency(amt, currency)}
                </span>
              )}
            </div>

            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5">To (receiver)</p>
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setToId(m.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all text-left',
                      toId === m.id
                        ? 'border-transparent text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
                    )}
                    style={toId === m.id ? { background: m.color } : undefined}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ background: toId === m.id ? 'rgba(255,255,255,0.3)' : m.color }}
                    >
                      {m.name[0]?.toUpperCase()}
                    </div>
                    <span className="truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date + Note */}
          <div className="flex flex-col gap-3 bg-gray-50 dark:bg-zinc-800 rounded-xl p-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm text-gray-600 dark:text-zinc-400 bg-transparent border-none outline-none cursor-pointer"
            />
            <div className="h-px bg-gray-200 dark:bg-zinc-700" />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="text-sm text-gray-700 dark:text-zinc-300 placeholder-gray-400 dark:placeholder-zinc-500 bg-transparent border-none outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" type="button" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Record payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
