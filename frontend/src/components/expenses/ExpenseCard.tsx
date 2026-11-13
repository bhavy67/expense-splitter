import { Link } from 'react-router-dom'
import { Paperclip } from 'lucide-react'
import { ListRow } from '@/components/ui/ListRow'
import { IconTile } from '@/components/ui/IconTile'
import { Money } from '@/components/ui/Money'
import { CATEGORY_ICONS } from '@/lib/icons'
import type { Expense, Member } from '@/types'

const SPLIT_LABELS: Record<string, string> = {
  equal: 'Equally', shares: 'By shares', percentage: 'By %',
  exact: 'Exact amounts', itemized: 'Itemized',
}

interface Props {
  expense: Expense
  members: Member[]
  groupId: string
  groupCurrency?: string
  divider?: boolean
}

export function ExpenseCard({ expense, members, groupId, groupCurrency, divider }: Props) {
  const payer = members.find((m) => m.id === expense.paidBy)
  const split = expense.splitType === 'itemized' && expense.items?.length
    ? `${expense.items.length} item${expense.items.length !== 1 ? 's' : ''}`
    : SPLIT_LABELS[expense.splitType] ?? expense.splitType

  return (
    <ListRow
      as={Link}
      to={`/g/${groupId}/expenses/${expense.id}`}
      divider={divider}
      leading={<IconTile icon={CATEGORY_ICONS[expense.category] ?? CATEGORY_ICONS.other} />}
      title={expense.title}
      subtitle={
        <span className="inline-flex max-w-full items-center gap-1">
          <span className="truncate">Paid by {payer?.name ?? 'someone'}</span>
          {expense.receiptImage && <Paperclip className="size-3.5 shrink-0" aria-label="Receipt attached" />}
        </span>
      }
      trailing={
        <>
          <Money amount={expense.amount} currency={groupCurrency ?? expense.currency} className="block font-medium" />
          <span className="text-caption text-fg-subtle">{split}</span>
        </>
      }
    />
  )
}
