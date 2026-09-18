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

// ─── Custom tooltips ──────────────────────────────────────────────────────────

// Factory functions avoid the Recharts TooltipPayload type conflict at the content prop call site
function makePieTooltip(currency: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-lg">
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mb-0.5 capitalize">{payload[0].name}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{formatCurrency(Number(payload[0].value ?? 0), currency)}</p>
      </div>
    )
  }
}

function makeBarTooltip(currency: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-lg">
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{formatCurrency(Number(payload[0].value ?? 0), currency)}</p>
      </div>
    )
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalyticsTab({ group, expenses }: Props) {
  const currency = group.currency
  const total = getTotalExpenses(expenses)

  // Category breakdown
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

  // Monthly breakdown (last 12 months with data)
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

  // Who paid
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
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto mb-3 text-3xl">
          📊
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">No data yet</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500">Add expenses to see analytics</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Budget tracker */}
      {!!group.budget && group.budget > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Budget</p>
            <p className="text-xs font-bold text-gray-700 dark:text-zinc-300">
              {formatCurrency(total, currency)} / {formatCurrency(group.budget, currency)}
            </p>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                total / group.budget > 0.9 ? 'bg-red-500' :
                total / group.budget > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
              )}
              style={{ width: `${Math.min(100, (total / group.budget) * 100).toFixed(1)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
              {((total / group.budget) * 100).toFixed(0)}% used
            </p>
            {total < group.budget ? (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                {formatCurrency(group.budget - total, currency)} remaining
              </p>
            ) : (
              <p className="text-[10px] text-red-500 dark:text-red-400">
                {formatCurrency(total - group.budget, currency)} over budget
              </p>
            )}
          </div>
        </div>
      )}

      {/* Category donut */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
          By category
        </p>
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
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-base font-bold text-gray-900 dark:text-zinc-100 leading-tight">
              {formatCurrency(total, currency)}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500">total</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          {categoryData.map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-xs text-gray-500 dark:text-zinc-400 capitalize flex-1">
                {c.emoji} {c.name}
              </span>
              <span className="text-xs text-gray-400 dark:text-zinc-500 w-8 text-right">{c.pct}%</span>
              <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200 w-28 text-right">
                {formatCurrency(c.value, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly bar chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Monthly spending
          </p>
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
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={yFmt}
                width={36}
              />
              <Tooltip
                content={makeBarTooltip(currency)}
                cursor={{ fill: 'currentColor', fillOpacity: 0.04 }}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Who paid */}
      {memberData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Who paid
          </p>
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
                    <span className="text-sm text-gray-700 dark:text-zinc-300">{member.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                      {formatCurrency(amount, currency)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 ml-2">
                      {total > 0 ? Math.round((amount / total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(amount / maxPaid) * 100}%`, background: member.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
          Export
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { downloadExpensesCSV(group, expenses); toast.success('CSV downloaded') }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">Export as CSV</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''} · open in Excel or Sheets
              </p>
            </div>
            <Download className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-gray-500 dark:group-hover:text-zinc-400 transition-colors shrink-0" />
          </button>
          <button
            onClick={() => { downloadGroupJSON(group.id); toast.success('Backup downloaded') }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
              <Archive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">Full backup (JSON)</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Includes members, expenses & payments · re-importable</p>
            </div>
            <Download className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-gray-500 dark:group-hover:text-zinc-400 transition-colors shrink-0" />
          </button>
        </div>
      </div>

    </div>
  )
}

export default AnalyticsTab
