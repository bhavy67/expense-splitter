import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Card } from '@/components/ui/Card'
import { ListRow } from '@/components/ui/ListRow'
import { Avatar } from '@/components/ui/Avatar'
import { IconTile } from '@/components/ui/IconTile'
import { Money } from '@/components/ui/Money'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Modal } from '@/components/ui/Dialog'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroup } from '@/hooks/useStore'
import { getExpense, deleteExpense, getPayments } from '@/lib/storage'
import { toast } from '@/components/common/Toast'
import { CATEGORY_ICONS } from '@/lib/icons'

const SPLIT_LABELS: Record<string, string> = {
  equal: 'Split equally',
  shares: 'Split by shares',
  percentage: 'Split by percentage',
  exact: 'Exact amounts',
  itemized: 'Itemized split',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function ExpenseDetailPage() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>()
  const navigate = useNavigate()
  const group = useGroup(groupId!)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!group) {
    return (
      <AppShell>
        <TopBar title="Expense" showBack />
        <EmptyState title="Group not found" description="It may have been deleted on this device." />
      </AppShell>
    )
  }

  const expense = getExpense(groupId!, expenseId!)

  if (!expense) {
    return (
      <AppShell>
        <TopBar title="Expense" showBack />
        <EmptyState title="Expense not found" description="It may have been deleted." />
      </AppShell>
    )
  }

  const payer = group.members.find((m) => m.id === expense.paidBy)
  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]))
  const toEdit = () => navigate(`/g/${groupId}/expenses/new?edit=${expenseId}`)

  function handleDelete() {
    deleteExpense(groupId!, expenseId!)
    toast.success('Expense deleted')
    navigate(`/g/${groupId}`, { replace: true })
  }

  return (
    <AppShell>
      <TopBar
        title={expense.title}
        showBack
        largeTitle
        actions={<>
          <IconButton aria-label="Edit expense" onClick={toEdit}><Pencil /></IconButton>
          <IconButton aria-label="Delete expense" onClick={() => setConfirmDelete(true)}><Trash2 /></IconButton>
        </>}
      />

      <PageTransition>
        <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pt-4 pb-8 md:py-8">
          {/* Hero */}
          <div className="flex flex-col gap-4">
            <IconTile icon={CATEGORY_ICONS[expense.category] ?? CATEGORY_ICONS.other} size="lg" />
            <div>
              <h1 className="break-words text-title-lg">{expense.title}</h1>
              <Money amount={expense.amount} currency={expense.currency} size="display" className="mt-2 block truncate" />
              <p className="mt-1 text-body-sm text-fg-muted">
                Paid by {payer?.name ?? 'someone'} · {fmtDate(expense.date)}
              </p>
            </div>
            <div className="hidden md:flex gap-2">
              <Button variant="secondary" size="sm" onClick={toEdit}><Pencil className="size-4" />Edit</Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 className="size-4" />Delete</Button>
            </div>
          </div>

          {/* Split */}
          <section>
            <SectionHeader title={SPLIT_LABELS[expense.splitType] ?? expense.splitType} />
            {expense.splitType === 'itemized' && expense.items?.length ? (
              <div className="flex flex-col gap-3">
                {expense.items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-subtle px-4 py-2.5">
                      <span className="truncate text-body font-medium">{item.name || 'Item'}</span>
                      <Money amount={item.amount} currency={expense.currency} className="font-medium" />
                    </div>
                    {item.splits.map((s) => {
                      const m = memberMap[s.memberId]
                      if (!m) return null
                      return (
                        <ListRow key={s.memberId} divider leading={<Avatar name={m.name} size={28} />} title={m.name}
                          trailing={<Money amount={s.amount} currency={expense.currency} />} className="min-h-12 py-2" />
                      )
                    })}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="overflow-hidden">
                {expense.splits.map((split) => {
                  const m = memberMap[split.memberId]
                  if (!m) return null
                  const pct = split.percentage != null
                    ? split.percentage
                    : Math.round((split.amount / expense.amount) * 10000) / 100
                  const meta = split.shares != null
                    ? `${split.shares} share${split.shares !== 1 ? 's' : ''}`
                    : expense.splitType !== 'exact' ? `${pct.toFixed(1)}%` : undefined
                  return (
                    <ListRow key={split.memberId} divider leading={<Avatar name={m.name} />} title={m.name} subtitle={meta}
                      trailing={<Money amount={split.amount} currency={expense.currency} className="font-medium" />} />
                  )
                })}
              </Card>
            )}
          </section>

          {expense.notes && (
            <section>
              <SectionHeader title="Notes" />
              <Card variant="inset" className="whitespace-pre-wrap p-4 text-body">{expense.notes}</Card>
            </section>
          )}

          {expense.receiptImage && (
            <section>
              <SectionHeader title="Receipt" />
              <Card as="button" variant="interactive" onClick={() => setReceiptOpen(true)} className="w-full overflow-hidden" aria-label="View receipt full size">
                <img src={expense.receiptImage} alt="" className="h-48 w-full object-cover" />
              </Card>
            </section>
          )}
        </div>
      </PageTransition>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete "${expense.title}"?`}
          description={`All split data will be lost and balances will be recalculated.${getPayments(groupId!).length > 0 ? ' Recorded payments are kept, so someone who already settled may end up owed money.' : ''} This cannot be undone.`}
          confirmLabel="Delete expense"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {expense.receiptImage && (
        <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Receipt" className="sm:max-w-2xl max-w-full">
          <img src={expense.receiptImage} alt={`Receipt for ${expense.title}`} className="max-h-[70dvh] w-full rounded-md object-contain" />
        </Modal>
      )}
    </AppShell>
  )
}
