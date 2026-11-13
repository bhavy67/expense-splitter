import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { StickyActionBar } from '@/components/ui/StickyActionBar'
import { Money } from '@/components/ui/Money'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { useAddExpenseForm, type AddExpenseForm } from '@/components/expenses/add/useAddExpenseForm'
import { AmountHero } from '@/components/expenses/add/AmountHero'
import { CategoryPicker, PaidByPicker, TemplateChips } from '@/components/expenses/add/Pickers'
import { SplitEditor, SplitModeSelector } from '@/components/expenses/add/SplitEditor'
import { MoreOptions } from '@/components/expenses/add/MoreOptions'
import { cn } from '@/lib/utils'

// Presentation-only readiness check: the Save button looks disabled until this passes,
// but stays tappable so handleSubmit's toast explains what's missing.
function isReady(f: AddExpenseForm) {
  if (!f.title.trim() || !f.paidBy) return false
  switch (f.splitType) {
    case 'equal': return f.amt > 0 && f.equalIncluded.size > 0
    case 'shares': return f.amt > 0 && f.shareTotalCount > 0
    case 'percentage': return f.amt > 0 && Math.abs(f.pctTotal - 100) <= 0.01
    case 'exact': return f.amt > 0 && Math.abs(f.exactRemain) <= 0.01
    case 'itemized': return f.itemizedTotal > 0
  }
}

function splitSummary(f: AddExpenseForm) {
  const ways =
    f.splitType === 'equal' ? f.equalIncluded.size
    : f.splitType === 'itemized' ? f.formItems.length
    : f.group.members.length
  return f.splitType === 'itemized' ? `${ways} item${ways !== 1 ? 's' : ''}` : `split ${ways} way${ways !== 1 ? 's' : ''}`
}

export default function AddExpensePage() {
  const form = useAddExpenseForm()

  if (!form) {
    return (
      <AppShell>
        <TopBar title="Add expense" showBack />
        <EmptyState title="Group not found" description="It may have been deleted on this device." />
      </AppShell>
    )
  }

  const { existing, groupId, navigate } = form
  const ready = isReady(form)
  const total = form.splitType === 'itemized' ? form.itemizedTotal : form.amt

  return (
    <AppShell>
      <TopBar title={existing ? 'Edit expense' : 'Add expense'} showBack />

      <PageTransition>
        <form
          id="add-expense-form"
          onSubmit={form.handleSubmit}
          className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:py-8 md:pb-32"
        >
          <h1 className="hidden md:block text-title-lg">{existing ? 'Edit expense' : 'Add expense'}</h1>
          <TemplateChips form={form} />
          <AmountHero form={form} />
          <Field label="What was it for?">
            <Input value={form.title} onChange={(e) => form.setTitle(e.target.value)} placeholder="Dinner, cab, groceries…" />
          </Field>
          <PaidByPicker form={form} />
          <CategoryPicker form={form} />
          <div className="flex flex-col gap-3">
            <SplitModeSelector form={form} />
            <SplitEditor form={form} />
          </div>
          <MoreOptions form={form} />
        </form>
      </PageTransition>

      <StickyActionBar
        summary={total > 0 && (
          <span className="block truncate">
            <Money amount={total} currency={form.currency} size="sm" className="font-medium text-fg" /> · {splitSummary(form)}
          </span>
        )}
      >
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="hidden md:inline-flex"
            onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate(`/g/${groupId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-expense-form"
            fullWidth
            aria-disabled={!ready}
            className={cn(!ready && 'opacity-50')}
          >
            {existing ? 'Save changes' : 'Save expense'}
          </Button>
        </div>
      </StickyActionBar>
    </AppShell>
  )
}
