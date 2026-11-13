import { MoneyInput } from '@/components/ui/Field'
import type { AddExpenseForm } from './useAddExpenseForm'

const SYMBOL: Record<string, string> = { INR: '₹' }

export function AmountHero({ form }: { form: AddExpenseForm }) {
  const itemized = form.splitType === 'itemized'
  return (
    <div>
      <label htmlFor="amount" className="mb-1.5 block text-caption text-fg-muted">Amount</label>
      <MoneyInput
        id="amount"
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        prefix={SYMBOL[form.currency] ?? form.currency}
        autoFocus={!form.existing}
        value={itemized ? form.itemizedTotal.toFixed(2) : form.amount}
        onChange={(e) => form.setAmount(e.target.value)}
        readOnly={itemized}
        aria-describedby={itemized ? 'amount-hint' : undefined}
        className="h-[72px]"
      />
      {itemized && <p id="amount-hint" className="mt-1.5 text-body-sm text-fg-muted">Calculated from the items below</p>}
    </div>
  )
}
