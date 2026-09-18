import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { saveGroup, generateId } from '@/lib/storage'
import { toast } from '@/components/common/Toast'
import { cn } from '@/lib/utils'
import type { Group, GroupType, Member } from '@/types'

const MEMBER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316',
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#14b8a6', '#a855f7',
]

const GROUP_TYPES: { value: GroupType; label: string; icon: string }[] = [
  { value: 'travel',    label: 'Trip',    icon: '✈️' },
  { value: 'roommates', label: 'Home',    icon: '🏠' },
  { value: 'friends',   label: 'Friends', icon: '👯' },
  { value: 'dinner',    label: 'Dinner',  icon: '🍽️' },
  { value: 'other',     label: 'Other',   icon: '👥' },
]

const CURRENCIES = [
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateGroupModal({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [type, setType] = useState<GroupType>('other')
  const [currency, setCurrency] = useState('INR')
  const [members, setMembers] = useState<string[]>(['', ''])

  if (!open) return null

  function reset() {
    setName(''); setType('other'); setCurrency('INR'); setMembers(['', ''])
  }

  function handleClose() {
    reset(); onClose()
  }

  function addMember() {
    setMembers((prev) => [...prev, ''])
  }

  function removeMember(i: number) {
    setMembers((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateMember(i: number, value: string) {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? value : m)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { toast.error('Group name is required'); return }

    const validMembers: Member[] = members
      .map((m, i) => ({
        id: generateId(),
        name: m.trim(),
        color: MEMBER_COLORS[i % MEMBER_COLORS.length],
      }))
      .filter((m) => m.name.length > 0)

    if (validMembers.length < 1) { toast.error('Add at least one member'); return }

    const now = new Date().toISOString()
    const group: Group = {
      id: generateId(),
      name: trimmed,
      description: '',
      type,
      currency,
      members: validMembers,
      createdAt: now,
      updatedAt: now,
    }

    saveGroup(group)
    toast.success(`"${trimmed}" created!`)
    reset()
    onClose()
    navigate(`/g/${group.id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 pb-8 sm:pb-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">New group</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
              Group name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Trip, Flat 4B, Friday dinners"
              className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Type</label>
            <div className="flex gap-2 flex-wrap">
              {GROUP_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-colors',
                    type === t.value
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 font-medium'
                      : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'
                  )}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-0.5">Members</label>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mb-2">No accounts needed — just add names</p>
            <div className="flex flex-col gap-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                  >
                    {m.trim()[0]?.toUpperCase() ?? (i + 1)}
                  </div>
                  <input
                    value={m}
                    onChange={(e) => updateMember(i, e.target.value)}
                    placeholder={`Member ${i + 1}`}
                    className="flex-1 h-9 px-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(i)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium px-2 py-1 transition-colors self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                Add member
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full mt-1">
            Create group
          </Button>
        </form>
      </div>
    </div>
  )
}
