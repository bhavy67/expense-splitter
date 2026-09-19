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
    if (members.length >= 20) { toast.error('Max 20 members'); return }
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
    if (trimmed.length > 60) { toast.error('Name must be under 60 characters'); return }

    const validMembers: Member[] = members
      .map((m, i) => ({
        id: generateId(),
        name: m.trim().slice(0, 40),
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
      <div className="absolute inset-0 bg-[#0a0a0a]/60" onClick={handleClose} />

      <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#1e1e1a] rounded-t sm:rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] shadow-[5px_5px_0_#0a0a0a] dark:shadow-[5px_5px_0_#b9f542] sm:mx-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b-2 border-[#0a0a0a] dark:border-[#f0ede5]">
          <h2 className="text-base font-black uppercase tracking-[0.06em] text-[#0a0a0a] dark:text-[#f0ede5]">New group</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded text-[#4a4940] dark:text-[#a09880] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] border border-[#0a0a0a] dark:border-[#f0ede5]/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5 pb-8 sm:pb-6">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-1.5">
              Group name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="e.g. Goa Trip, Flat 4B, Friday dinners"
              className="w-full h-10 px-3 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[13px] font-medium focus:outline-none focus:border-[#b9f542] focus:shadow-[2px_2px_0_#b9f542] transition-all placeholder:text-[#4a4940]/40 dark:placeholder:text-[#a09880]/40"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-2">
              Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {GROUP_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded border-2 text-[11px] font-bold uppercase tracking-wider transition-all',
                    type === t.value
                      ? 'border-[#0a0a0a] bg-[#b9f542] text-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                      : 'border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 text-[#4a4940] dark:text-[#a09880] hover:border-[#0a0a0a] dark:hover:border-[#f0ede5]'
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
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-10 px-3 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[13px] font-medium focus:outline-none focus:border-[#b9f542] focus:shadow-[2px_2px_0_#b9f542] transition-all"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Members */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-0.5">
              Members
            </label>
            <p className="text-xs text-[#4a4940] dark:text-[#a09880] mb-3">No accounts needed — just add names</p>
            <div className="flex flex-col gap-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                  >
                    {m.trim()[0]?.toUpperCase() ?? (i + 1)}
                  </div>
                  <input
                    value={m}
                    onChange={(e) => updateMember(i, e.target.value)}
                    maxLength={40}
                    placeholder={`Member ${i + 1}`}
                    className="flex-1 h-9 px-3 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[13px] font-medium focus:outline-none focus:border-[#b9f542] transition-all placeholder:text-[#4a4940]/40 dark:placeholder:text-[#a09880]/40"
                  />
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(i)}
                      className="p-1.5 rounded text-[#4a4940] dark:text-[#a09880] hover:text-[#ff5c3d] hover:bg-[#ff5c3d]/10 border border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4d6e08] dark:text-[#b9f542] hover:opacity-80 px-1 py-1 transition-opacity self-start mt-1"
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
