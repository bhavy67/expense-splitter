import { Check, CircleAlert, Minus, Plus, RefreshCw, X } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/SegmentedTabs'
import { Card } from '@/components/ui/Card'
import { ListRow } from '@/components/ui/ListRow'
import { Avatar } from '@/components/ui/Avatar'
import { Money } from '@/components/ui/Money'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Field'
import { Chip } from '@/components/ui/Chip'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { SplitType } from '@/types'
import type { AddExpenseForm } from './useAddExpenseForm'

const MODES: { id: SplitType; label: string; hint: string }[] = [
  { id: 'equal', label: 'Equally', hint: 'Divide equally among the people you pick' },
  { id: 'shares', label: 'Shares', hint: 'Split by ratio, e.g. 2:1:1' },
  { id: 'percentage', label: '%', hint: 'Assign a percentage to each person' },
  { id: 'exact', label: 'Exact', hint: 'Set the exact amount for each person' },
  { id: 'itemized', label: 'Items', hint: 'Split line items between people' },
]

const smallInput = 'h-10 w-20 px-2 text-right tabular-nums'

// Text + icon, never colour alone.
function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? Check : CircleAlert
  return (
    <p role="status" className={cn('flex items-center justify-end gap-1.5 px-4 py-3 text-body-sm', ok ? 'text-fg-muted' : 'font-medium text-fg')}>
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  )
}

export function SplitModeSelector({ form }: { form: AddExpenseForm }) {
  return (
    <div>
      <p className="mb-1.5 text-caption text-fg-muted">Split</p>
      <SegmentedControl aria-label="Split mode" options={MODES} value={form.splitType} onChange={form.setSplitType} />
      <p className="mt-1.5 text-body-sm text-fg-muted">{MODES.find((m) => m.id === form.splitType)?.hint}</p>
    </div>
  )
}

export function SplitEditor({ form }: { form: AddExpenseForm }) {
  const { group, splitType, amt, currency } = form
  const members = group.members

  if (splitType === 'equal') {
    const n = form.equalIncluded.size
    const share = n > 0 ? Math.round(amt / n * 100) / 100 : 0
    return (
      <Card className="overflow-hidden">
        {members.map((m) => {
          const on = form.equalIncluded.has(m.id)
          return (
            <ListRow
              key={m.id}
              as="label"
              divider
              className="cursor-pointer"
              leading={
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => {
                      const next = new Set(form.equalIncluded)
                      if (next.has(m.id)) next.delete(m.id)
                      else next.add(m.id)
                      form.setEqualIncluded(next)
                    }}
                    className="size-5 accent-[var(--fg)]"
                  />
                  <Avatar name={m.name} />
                </span>
              }
              title={<span className={cn(!on && 'text-fg-muted')}>{m.name}</span>}
              trailing={on && amt > 0 ? <Money amount={share} currency={currency} /> : <span className="text-body-sm text-fg-subtle">Not included</span>}
            />
          )
        })}
        <Status ok={n > 0}>{n > 0 ? `Split ${n} way${n !== 1 ? 's' : ''}` : 'Pick at least one person'}</Status>
      </Card>
    )
  }

  if (splitType === 'shares') {
    return (
      <Card className="overflow-hidden">
        {members.map((m) => {
          const v = form.shareVals[m.id] ?? 0
          const computed = form.shareTotalCount > 0 ? Math.round((v / form.shareTotalCount) * amt * 100) / 100 : 0
          return (
            <ListRow
              key={m.id}
              divider
              className="pr-2"
              leading={<Avatar name={m.name} />}
              title={m.name}
              subtitle={amt > 0 && v > 0 ? <Money amount={computed} currency={currency} size="sm" className="text-fg-muted" /> : undefined}
              trailing={
                <div className="flex items-center">
                  <IconButton aria-label={`Fewer shares for ${m.name}`} onClick={() => form.setShareVals((p) => ({ ...p, [m.id]: Math.max(0, (p[m.id] ?? 0) - 1) }))}>
                    <Minus />
                  </IconButton>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    aria-label={`Shares for ${m.name}`}
                    value={v}
                    onChange={(e) => form.setShareVals((p) => ({ ...p, [m.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="h-10 w-12 px-1 text-center tabular-nums"
                  />
                  <IconButton aria-label={`More shares for ${m.name}`} onClick={() => form.setShareVals((p) => ({ ...p, [m.id]: (p[m.id] ?? 0) + 1 }))}>
                    <Plus />
                  </IconButton>
                </div>
              }
            />
          )
        })}
        <Status ok={form.shareTotalCount > 0}>
          {form.shareTotalCount > 0 ? `${form.shareTotalCount} share${form.shareTotalCount !== 1 ? 's' : ''} in total` : 'Give at least one share'}
        </Status>
      </Card>
    )
  }

  if (splitType === 'percentage') {
    const left = Math.round((100 - form.pctTotal) * 100) / 100
    const ok = Math.abs(left) < 0.01
    return (
      <Card className="overflow-hidden">
        {members.map((m) => {
          const pct = form.pctVals[m.id] ?? 0
          return (
            <ListRow
              key={m.id}
              divider
              leading={<Avatar name={m.name} />}
              title={m.name}
              subtitle={amt > 0 ? <Money amount={Math.round(pct / 100 * amt * 100) / 100} currency={currency} size="sm" className="text-fg-muted" /> : undefined}
              trailing={
                <span className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="0.01"
                    aria-label={`Percentage for ${m.name}`}
                    value={pct}
                    onChange={(e) => form.setPctVals((p) => ({ ...p, [m.id]: parseFloat(e.target.value) || 0 }))}
                    className={smallInput}
                  />
                  <span className="text-body text-fg-muted">%</span>
                </span>
              }
            />
          )
        })}
        <Status ok={ok}>{ok ? '100% assigned' : left > 0 ? `${left}% left to assign` : `${-left}% over`}</Status>
      </Card>
    )
  }

  if (splitType === 'exact') {
    const ok = Math.abs(form.exactRemain) < 0.01
    return (
      <Card className="overflow-hidden">
        <div className="flex justify-end border-b border-border px-2 py-1">
          <Button variant="ghost" size="sm" type="button" onClick={form.distributeExactEqually}>
            <RefreshCw className="size-4" />
            Distribute equally
          </Button>
        </div>
        {members.map((m) => (
          <ListRow
            key={m.id}
            divider
            leading={<Avatar name={m.name} />}
            title={m.name}
            trailing={
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                aria-label={`Amount for ${m.name}`}
                value={form.exactVals[m.id] ?? ''}
                onChange={(e) => form.setExactVals((p) => ({ ...p, [m.id]: e.target.value }))}
                className={cn(smallInput, 'w-28')}
              />
            }
          />
        ))}
        <Status ok={ok}>
          {ok ? 'Everything assigned'
            : form.exactRemain > 0 ? `${formatCurrency(form.exactRemain, currency)} left to assign`
            : `${formatCurrency(-form.exactRemain, currency)} over`}
        </Status>
      </Card>
    )
  }

  // itemized
  return (
    <div className="flex flex-col gap-3">
      {form.formItems.map((item, idx) => (
        <Card key={item.id} variant="inset" className="flex flex-col gap-3 p-3">
          <div className="flex items-center gap-2">
            <Input
              aria-label={`Item ${idx + 1} name`}
              placeholder={`Item ${idx + 1}`}
              value={item.name}
              onChange={(e) => form.setFormItems((p) => p.map((it) => it.id === item.id ? { ...it, name: e.target.value } : it))}
              className="min-w-0 flex-1 bg-surface"
            />
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              aria-label={`Item ${idx + 1} amount`}
              value={item.amount}
              onChange={(e) => form.setFormItems((p) => p.map((it) => it.id === item.id ? { ...it, amount: e.target.value } : it))}
              className={cn(smallInput, 'h-11 w-28 bg-surface')}
            />
            {form.formItems.length > 1 && (
              <IconButton aria-label={`Remove item ${idx + 1}`} onClick={() => form.removeItem(item.id)} className="-mr-1">
                <X />
              </IconButton>
            )}
          </div>
          <div role="group" aria-label={`Who shares item ${idx + 1}`} className="flex flex-wrap gap-2">
            {members.map((m) => (
              <Chip key={m.id} selected={item.memberIds.includes(m.id)} onClick={() => form.toggleItemMember(item.id, m.id)}>
                {m.name}
              </Chip>
            ))}
          </div>
        </Card>
      ))}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" type="button" onClick={form.addItem}>
          <Plus className="size-4" />
          Add item
        </Button>
        {form.itemizedTotal > 0 && (
          <span className="text-body-sm text-fg-muted">Total <Money amount={form.itemizedTotal} currency={currency} size="sm" className="font-medium" /></span>
        )}
      </div>
    </div>
  )
}
