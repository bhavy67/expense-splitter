import { Plus, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { GroupMember } from '@/types'

export interface ItemEntry {
  id: string
  description: string
  amount: number
  memberIds: string[]
}

interface ItemizedSplitEditorProps {
  members: GroupMember[]
  items: ItemEntry[]
  onChange: (items: ItemEntry[]) => void
}

let idCounter = 0
function newId() { return `item-${++idCounter}` }

export function ItemizedSplitEditor({ members, items, onChange }: ItemizedSplitEditorProps) {
  const active = members.filter((m) => m.is_active)
  const itemsTotal = items.reduce((s, item) => s + (item.amount || 0), 0)

  const addItem = () => {
    onChange([
      ...items,
      { id: newId(), description: '', amount: 0, memberIds: active.map((m) => m.user.id) },
    ])
  }

  const updateItem = (id: string, patch: Partial<ItemEntry>) => {
    onChange(items.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  const removeItem = (id: string) => {
    if (items.length === 1) return
    onChange(items.filter((item) => item.id !== id))
  }

  const toggleMember = (itemId: string, userId: string, currentIds: string[]) => {
    const next = currentIds.includes(userId)
      ? currentIds.length > 1 ? currentIds.filter((id) => id !== userId) : currentIds
      : [...currentIds, userId]
    updateItem(itemId, { memberIds: next })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Running total */}
      {itemsTotal > 0 && (
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Items total: <span className="font-semibold text-gray-800 dark:text-zinc-200">{formatCurrency(itemsTotal)}</span>
          <span className="text-gray-400 dark:text-zinc-500"> (becomes the expense total)</span>
        </p>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="border border-gray-200 dark:border-zinc-700 rounded-2xl overflow-hidden bg-white dark:bg-zinc-800">
          {/* Item header */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-2">
            <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 w-5 shrink-0">#{index + 1}</span>
            <input
              type="text"
              value={item.description}
              onChange={(e) => updateItem(item.id, { description: e.target.value })}
              placeholder="Item name (e.g. Pizza)"
              className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200 bg-transparent border-0 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-zinc-600"
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-gray-400 dark:text-zinc-500">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.amount || ''}
                placeholder="0"
                onChange={(e) => updateItem(item.id, { amount: parseFloat(e.target.value) || 0 })}
                className="w-20 h-7 rounded-lg border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-700 text-right pr-2 text-sm font-semibold text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              disabled={items.length === 1}
              className="p-1 rounded-lg text-gray-300 dark:text-zinc-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Member selection */}
          <div className="px-3 pb-3 border-t border-gray-100 dark:border-zinc-700 pt-2">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Split between</p>
            <div className="flex flex-wrap gap-1.5">
              {active.map((m) => {
                const selected = item.memberIds.includes(m.user.id)
                const perPerson = selected && item.memberIds.length > 0 && item.amount > 0
                  ? item.amount / item.memberIds.length
                  : null

                return (
                  <button
                    key={m.user.id}
                    type="button"
                    onClick={() => toggleMember(item.id, m.user.id, item.memberIds)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors',
                      selected
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-400'
                        : 'bg-white dark:bg-zinc-700 border-gray-200 dark:border-zinc-600 text-gray-400 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-500'
                    )}
                  >
                    <Avatar name={m.user.name} src={m.user.avatar_url} size="sm" className="w-4 h-4 text-[8px]" />
                    {m.user.name.split(' ')[0]}
                    {perPerson && (
                      <span className="text-indigo-400 dark:text-indigo-500 font-normal">·{formatCurrency(perPerson)}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={addItem} className="self-start">
        <Plus className="w-3.5 h-3.5" />
        Add item
      </Button>
    </div>
  )
}
