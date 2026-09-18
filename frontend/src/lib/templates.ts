import type { ExpenseTemplate } from '@/types'
import { generateId } from './storage'

const KEY = 'splititt_templates'

function read(): ExpenseTemplate[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

function write(list: ExpenseTemplate[]): void {
  localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent('splititt:update', { detail: 'templates' }))
}

export function getTemplates(): ExpenseTemplate[] {
  return read()
}

export function saveTemplate(fields: Omit<ExpenseTemplate, 'id' | 'createdAt'>): ExpenseTemplate {
  const t: ExpenseTemplate = { ...fields, id: generateId(), createdAt: new Date().toISOString() }
  write([t, ...read()])
  return t
}

export function deleteTemplate(id: string): void {
  write(read().filter((t) => t.id !== id))
}
