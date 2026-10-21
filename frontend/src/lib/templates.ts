import type { ExpenseTemplate } from '@/types'
import { generateId, read, write } from './storage'

export function getTemplates(): ExpenseTemplate[] {
  return read<ExpenseTemplate[]>('templates', [])
}

export function saveTemplate(fields: Omit<ExpenseTemplate, 'id' | 'createdAt'>): boolean {
  const t: ExpenseTemplate = { ...fields, id: generateId(), createdAt: new Date().toISOString() }
  return write('templates', [t, ...getTemplates()])
}

export function deleteTemplate(id: string): void {
  write('templates', getTemplates().filter((t) => t.id !== id))
}
