import { BookMarked } from 'lucide-react'
import { Chip, ChipGroup } from '@/components/ui/Chip'
import { Avatar } from '@/components/ui/Avatar'
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/icons'
import type { ExpenseCategory } from '@/types'
import type { AddExpenseForm } from './useAddExpenseForm'

const label = 'mb-1.5 text-caption text-fg-muted'

export function TemplateChips({ form }: { form: AddExpenseForm }) {
  if (form.templates.length === 0 || form.existing) return null
  return (
    <div>
      <p className={label}>Quick add</p>
      <ChipGroup aria-label="Templates">
        {form.templates.map((t) => (
          <Chip key={t.id} onClick={() => form.applyTemplate(t.id)}>
            <BookMarked />
            {t.name}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  )
}

export function PaidByPicker({ form }: { form: AddExpenseForm }) {
  return (
    <div>
      <p className={label}>Paid by</p>
      <ChipGroup aria-label="Paid by">
        {form.group.members.map((m) => (
          <Chip key={m.id} selected={form.paidBy === m.id} onClick={() => form.setPaidBy(m.id)} className="pl-1">
            <Avatar name={m.name} size={28} />
            {m.name}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  )
}

export function CategoryPicker({ form }: { form: AddExpenseForm }) {
  return (
    <div>
      <p className={label}>Category</p>
      <ChipGroup aria-label="Category">
        {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map((c) => {
          const Icon = CATEGORY_ICONS[c]
          return (
            <Chip key={c} selected={form.category === c} onClick={() => form.setCategory(c)}>
              <Icon />
              {CATEGORY_LABELS[c]}
            </Chip>
          )
        })}
      </ChipGroup>
    </div>
  )
}
