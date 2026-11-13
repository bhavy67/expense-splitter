import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Archive, ChartColumn, FileSpreadsheet } from 'lucide-react'
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/icons'
import { getTotalExpenses } from '@/lib/calculations'
import { downloadExpensesCSV, downloadGroupJSON } from '@/lib/export'
import { toast } from '@/components/common/Toast'
import { Card } from '@/components/ui/Card'
import { ListRow } from '@/components/ui/ListRow'
import { Avatar } from '@/components/ui/Avatar'
import { IconTile } from '@/components/ui/IconTile'
import { Money } from '@/components/ui/Money'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/common/EmptyState'
import type { Group, Expense, ExpenseCategory } from '@/types'

// Monochrome on purpose: no category palette. A future data palette hooks into
// the --accent / chart tokens described in docs/DESIGN.md ("Phase 5: introducing colour").

interface Props {
  group: Group
  expenses: Expense[]
}

// Colour-free, scannable share bar (fg on a muted track).
function ShareBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
      <div className="h-full rounded-full bg-fg" style={{ width: `${Math.max(2, value * 100)}%` }} />
    </div>
  )
}

function makeBarTooltip(currency: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <Card className="px-3 py-2 shadow-float">
        <p className="text-caption text-fg-muted">{label}</p>
        <Money amount={Number(payload[0].value ?? 0)} currency={currency} className="font-semibold" />
      </Card>
    )
  }
}

export function AnalyticsTab({ group, expenses }: Props) {
  const currency = group.currency
  const total = getTotalExpenses(expenses)

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {} as Record<string, number>)
  const categoryData = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({
      cat: cat as ExpenseCategory,
      amount: Math.round(amount * 100) / 100,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
  const maxCategory = categoryData[0]?.amount ?? 1

  const thisMonth = new Date().toLocaleDateString('en-CA').slice(0, 7)
  const byMonth = expenses.reduce((acc, e) => {
    const month = e.date.slice(0, 7)
    acc[month] = (acc[month] ?? 0) + e.amount
    return acc
  }, {} as Record<string, number>)
  const monthlyData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({
      key: month,
      month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      amount: Math.round(amount * 100) / 100,
    }))

  const byPayer = expenses.reduce((acc, e) => {
    acc[e.paidBy] = (acc[e.paidBy] ?? 0) + e.amount
    return acc
  }, {} as Record<string, number>)
  const memberData = group.members
    .map((m) => ({ member: m, amount: byPayer[m.id] ?? 0 }))
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const maxPaid = Math.max(...memberData.map((d) => d.amount), 1)

  const yFmt = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v)))

  if (expenses.length < 2) {
    return (
      <EmptyState
        icon={<ChartColumn />}
        title="Add a few expenses to see insights"
        description="Spending by category, month and person shows up here."
      />
    )
  }

  const budgetUsed = group.budget ? total / group.budget : 0

  return (
    <div className="flex flex-col gap-6">

      {!!group.budget && group.budget > 0 && (
        <section>
          <SectionHeader title="Budget" />
          <Card className="p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-body-sm text-fg-muted">
                <Money amount={total} currency={currency} size="sm" className="text-fg" /> of <Money amount={group.budget} currency={currency} size="sm" className="text-fg-muted" />
              </span>
              <span className="text-body-sm font-medium tabular-nums">{(budgetUsed * 100).toFixed(0)}% used</span>
            </div>
            <ShareBar value={Math.min(1, budgetUsed)} />
            <p className="mt-2 text-right text-body-sm text-fg-muted">
              {total < group.budget
                ? <><Money amount={group.budget - total} currency={currency} size="sm" /> remaining</>
                : <span className="font-semibold text-fg"><Money amount={total - group.budget} currency={currency} size="sm" /> over budget</span>}
            </p>
          </Card>
        </section>
      )}

      {/* Ranked bar list — more readable than a pie, in any colour scheme */}
      <section>
        <SectionHeader title="By category" action={<Money amount={total} currency={currency} size="sm" className="text-fg-muted" />} />
        <Card className="overflow-hidden">
          {categoryData.map((c) => (
            <div key={c.cat} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
              <IconTile icon={CATEGORY_ICONS[c.cat] ?? CATEGORY_ICONS.other} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-body font-medium">{CATEGORY_LABELS[c.cat] ?? c.cat}</span>
                  <span className="shrink-0 text-body-sm text-fg-muted">
                    <Money amount={c.amount} currency={currency} size="sm" className="font-medium text-fg" />
                    <span className="ml-2 inline-block w-9 text-right tabular-nums">{c.pct}%</span>
                  </span>
                </div>
                <ShareBar value={c.amount / maxCategory} />
              </div>
            </div>
          ))}
        </Card>
      </section>

      {monthlyData.length > 0 && (
        <section>
          <SectionHeader title="By month" />
          {/* Colours come from tokens through CSS (fill/stroke on recharts classes), so the
              chart follows the theme toggle without re-mounting. */}
          <Card className="p-4 text-fg [&_.recharts-cartesian-axis-tick-value]:fill-fg-subtle [&_.recharts-cartesian-grid_line]:stroke-border">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={yFmt} width={40} />
                <Tooltip content={makeBarTooltip(currency)} cursor={{ fill: 'currentColor', fillOpacity: 0.05 }} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="currentColor">
                  {monthlyData.map((d) => (
                    <Cell key={d.key} fillOpacity={d.key === thisMonth ? 1 : 0.35} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-caption text-fg-muted">Current month in full, earlier months lighter.</p>
          </Card>
        </section>
      )}

      {memberData.length > 0 && (
        <section>
          <SectionHeader title="Who paid most" />
          <Card className="overflow-hidden">
            {memberData.map(({ member, amount }) => (
              <div key={member.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <Avatar name={member.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-body font-medium">{member.name}</span>
                    <span className="shrink-0 text-body-sm text-fg-muted">
                      <Money amount={amount} currency={currency} size="sm" className="font-medium text-fg" />
                      <span className="ml-2 inline-block w-9 text-right tabular-nums">{total > 0 ? Math.round((amount / total) * 100) : 0}%</span>
                    </span>
                  </div>
                  <ShareBar value={amount / maxPaid} />
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      <section>
        <SectionHeader title="Export" />
        <Card className="overflow-hidden">
          <ListRow
            as="button"
            divider
            onClick={() => { downloadExpensesCSV(group, expenses); toast.success('CSV downloaded') }}
            leading={<IconTile icon={FileSpreadsheet} />}
            title="Export as CSV"
            subtitle={`${expenses.length} expenses · open in Excel or Sheets`}
            chevron
          />
          <ListRow
            as="button"
            divider
            onClick={() => { downloadGroupJSON(group.id); toast.success('Backup downloaded') }}
            leading={<IconTile icon={Archive} />}
            title="Full backup (JSON)"
            subtitle="Members, expenses and payments · can be restored"
            chevron
          />
        </Card>
      </section>
    </div>
  )
}

export default AnalyticsTab
