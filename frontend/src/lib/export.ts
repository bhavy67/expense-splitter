import type { Group, Expense } from '@/types'
import { exportGroupData } from './storage'

export function downloadExpensesCSV(group: Group, expenses: Expense[]): void {
  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m.name]))
  const headers = ['Date', 'Title', 'Category', 'Amount', 'Currency', 'Paid By', 'Split Type', 'Notes']
  const rows = expenses.map((e) => [
    e.date,
    e.title,
    e.category,
    e.amount.toFixed(2),
    e.currency,
    memberMap[e.paidBy] ?? e.paidBy,
    e.splitType,
    e.notes ?? '',
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  triggerDownload(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `${slugify(group.name)}-expenses.csv`,
  )
}

export function downloadGroupJSON(groupId: string): void {
  const data = exportGroupData(groupId)
  if (!data) return
  triggerDownload(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    `${slugify(data.group.name)}-backup.json`,
  )
}

function slugify(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'group'
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
