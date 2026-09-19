import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { Download, FileSpreadsheet, Archive } from 'lucide-react'
import { CATEGORY_EMOJIS } from '@/components/expenses/ExpenseCard'
import { formatCurrency } from '@/lib/currency'
import { getTotalExpenses } from '@/lib/calculations'
import { downloadExpensesCSV, downloadGroupJSON } from '@/lib/export'
import { toast } from '@/components/common/Toast'
import { cn } from '@/lib/utils'
import type { Group, Expense } from '@/types'

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316', travel: '#3b82f6', accommodation: '#8b5cf6',
  utilities: '#eab308', entertainment: '#ec4899', shopping: '#14b8a6',
  medical: '#ef4444', other: '#6b7280',
}

interface Props {
  group: Group
  expenses: Expense[]
}

function makePieTooltip(currency: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white dark:bg-[#1e1e1a] border-2 border-[#0a0a0a] dark:border-[#f0ede5] rounded shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542] px-3 py-2">
        <p className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880] mb-0.5 capitalize">{payload[0].name}</p>
        <p className="text-sm font-bold text-[#0a0a0a] dark:text-[#f0ede5]">{formatCurrency(Number(payload[0].value ?? 0), currency)}</p>
      </div>
    )
  }
}

function makeBarTooltip(currency: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white dark:bg-[#1e1e1a] border-2 border-[#0a0a0a] dark:border-[#f0ede5] rounded shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542] px-3 py-2">
        <p className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880] mb-0.5">{label}</p>
        <p className="text-sm font-bold text-[#0a0a0a] dark:text-[#f0ede5]">{formatCurrency(Number(payload[0].value ?? 0), currency)}</p>
      </div>
    )
  }
}

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] p-4">
      {title && (
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-4">{title}</p>
      )}
      {children}
    </div>
  )
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
      name: cat,
      value: Math.round(amount * 100) / 100,
      color: CATEGORY_COLORS[cat] ?? '#6b7280',
      emoji: CATEGORY_EMOJIS[cat] ?? '📦',
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))

  const byMonth = expenses.reduce((acc, e) => {
    const month = e.date.slice(0, 7)
    acc[month] = (acc[month] ?? 0) + e.amount
    return acc
  }, {} as Record<string, number>)
  const monthlyData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({
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

  if (expenses.length === 0) {
    return (
      <SectionCard>
        <div className="py-8 text-center">
          <div className="w-14 h-14 rounded bg-[#f0ede5] dark:bg-[#1a1a17] border-2 border-[#0a0a0a] dark:border-[#f0ede5] flex items-center justify-center mx-auto mb-4 text-3xl shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542]">
            📊
          </div>
          <p className="text-base font-black uppercase tracking-[0.06em] text-[#0a0a0a] dark:text-[#f0ede5] mb-1">No data yet</p>
          <p className="text-sm text-[#4a4940] dark:text-[#c8bfb0]">Add expenses to see analytics</p>
        </div>
      </SectionCard>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Budget tracker */}
      {!!group.budget && group.budget > 0 && (
        <SectionCard title="Budget">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-medium text-[#4a4940] dark:text-[#a09880]">
              {formatCurrency(total, currency)} / {formatCurrency(group.budget, currency)}
            </span>
            <span className="text-xs font-bold text-[#0a0a0a] dark:text-[#f0ede5]">
              {((total / group.budget) * 100).toFixed(0)}% used
            </span>
          </div>
          <div className="h-3 bg-[#f0ede5] dark:bg-[#1a1a17] rounded border border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                total / group.budget > 0.9 ? 'bg-[#ff5c3d]' :
                total / group.budget > 0.7 ? 'bg-[#f97316]' : 'bg-[#b9f542]'
              )}
              style={{ width: `${Math.min(100, (total / group.budget) * 100).toFixed(1)}%` }}
            />
          </div>
          <div className="flex justify-end mt-1.5">
            {total < group.budget ? (
              <p className="text-xs text-[#4d6e08] dark:text-[#b9f542] font-medium">
                {formatCurrency(group.budget - total, currency)} remaining
              </p>
            ) : (
              <p className="text-xs text-[#ff5c3d] font-medium">
                {formatCurrency(total - group.budget, currency)} over budget
              </p>
            )}
          </div>
        </SectionCard>
      )}

      {/* Category donut */}
      <SectionCard title="By category">
        <div className="relative" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%" cy="50%"
                innerRadius={52}
                outerRadius={78}
                dataKey="value"
                paddingAngle={categoryData.length > 1 ? 2 : 0}
                strokeWidth={0}
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={makePieTooltip(currency)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-base font-bold text-[#0a0a0a] dark:text-[#f0ede5] leading-tight">
              {formatCurrency(total, currency)}
            </p>
            <p className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880]">total</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          {categoryData.map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-xs text-[#4a4940] dark:text-[#a09880] capitalize flex-1">
                {c.emoji} {c.name}
              </span>
              <span className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880] w-8 text-right">{c.pct}%</span>
              <span className="text-xs font-bold text-[#0a0a0a] dark:text-[#f0ede5] w-28 text-right">
                {formatCurrency(c.value, currency)}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Monthly bar chart */}
      {monthlyData.length > 0 && (
        <SectionCard title="Monthly spending">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: '#a09880', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#a09880', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={yFmt}
                width={36}
              />
              <Tooltip
                content={makeBarTooltip(currency)}
                cursor={{ fill: 'currentColor', fillOpacity: 0.04 }}
              />
              <Bar dataKey="amount" fill="#b9f542" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* Who paid */}
      {memberData.length > 0 && (
        <SectionCard title="Who paid">
          <div className="flex flex-col gap-3">
            {memberData.map(({ member, amount }) => (
              <div key={member.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                      style={{ background: member.color }}
                    >
                      {member.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#0a0a0a] dark:text-[#f0ede5]">{member.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#0a0a0a] dark:text-[#f0ede5]">
                      {formatCurrency(amount, currency)}
                    </span>
                    <span className="text-[10px] font-mono text-[#4a4940] dark:text-[#a09880] ml-2">
                      {total > 0 ? Math.round((amount / total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-[#f0ede5] dark:bg-[#1a1a17] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(amount / maxPaid) * 100}%`, background: member.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Export */}
      <SectionCard title="Export">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { downloadExpensesCSV(group, expenses); toast.success('CSV downloaded') }}
            className="flex items-center gap-3 px-3 py-3 rounded border-2 border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 hover:border-[#0a0a0a] dark:hover:border-[#f0ede5] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] transition-all text-left group"
          >
            <div className="w-8 h-8 rounded bg-[#f0ede5] dark:bg-[#1a1a17] border-2 border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-[#4d6e08] dark:text-[#b9f542]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0a0a0a] dark:text-[#f0ede5]">Export as CSV</p>
              <p className="text-xs text-[#4a4940] dark:text-[#a09880]">
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''} · open in Excel or Sheets
              </p>
            </div>
            <Download className="w-4 h-4 text-[#4a4940] dark:text-[#a09880] transition-colors shrink-0" />
          </button>
          <button
            onClick={() => { downloadGroupJSON(group.id); toast.success('Backup downloaded') }}
            className="flex items-center gap-3 px-3 py-3 rounded border-2 border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 hover:border-[#0a0a0a] dark:hover:border-[#f0ede5] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] transition-all text-left group"
          >
            <div className="w-8 h-8 rounded bg-[#f0ede5] dark:bg-[#1a1a17] border-2 border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 flex items-center justify-center shrink-0">
              <Archive className="w-4 h-4 text-[#4a4940] dark:text-[#a09880]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0a0a0a] dark:text-[#f0ede5]">Full backup (JSON)</p>
              <p className="text-xs text-[#4a4940] dark:text-[#a09880]">Includes members, expenses & payments · re-importable</p>
            </div>
            <Download className="w-4 h-4 text-[#4a4940] dark:text-[#a09880] transition-colors shrink-0" />
          </button>
        </div>
      </SectionCard>

    </div>
  )
}

export default AnalyticsTab
