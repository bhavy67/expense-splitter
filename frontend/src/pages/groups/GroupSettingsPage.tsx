import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Plus, Check, X, Pencil, Download } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroup } from '@/hooks/useStore'
import { saveGroup, deleteGroup, generateId, exportGroupData } from '@/lib/storage'
import { toast } from '@/components/common/Toast'
import { cn } from '@/lib/utils'
import type { GroupType, Member } from '@/types'

type ConfirmConfig = { title: string; description?: string; confirmLabel: string; danger?: boolean; onConfirm: () => void }

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

function SectionCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-[#1e1e1a] rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] p-4', className)}>
      {title && <p className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-4">{title}</p>}
      {children}
    </div>
  )
}

// Inline color picker popover
function ColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-[#1e1e1a] ring-offset-1 ring-offset-white dark:ring-offset-[#1e1e1a] transition-transform hover:scale-110 shrink-0"
        style={{ background: color }}
        title="Change color"
      />
      {open && (
        <div className="absolute left-0 top-9 z-20 bg-white dark:bg-[#1e1e1a] border-2 border-[#0a0a0a] dark:border-[#f0ede5] rounded shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542] p-2 grid grid-cols-5 gap-1.5 max-[400px]:left-auto max-[400px]:right-0">
          {MEMBER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false) }}
              className={cn(
                'w-6 h-6 rounded-full transition-transform hover:scale-110',
                c === color && 'ring-2 ring-offset-1 ring-[#b9f542]'
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function GroupSettingsPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const group = useGroup(groupId!)
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null)

  // Group info state
  const [name, setName] = useState(group?.name ?? '')
  const [type, setType] = useState<GroupType>(group?.type ?? 'other')
  const [currency, setCurrency] = useState(group?.currency ?? 'INR')
  const [description, setDescription] = useState(group?.description ?? '')

  // Member state
  const [members, setMembers] = useState<Member[]>(group?.members ?? [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const addInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (group) {
      setName(group.name)
      setType(group.type)
      setCurrency(group.currency)
      setDescription(group.description)
      setMembers(group.members)
    }
  }, [group])

  useEffect(() => {
    if (showAddInput) addInputRef.current?.focus()
  }, [showAddInput])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  if (!group) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen text-[#4a4940] dark:text-[#a09880]">
          Group not found
        </div>
      </AppShell>
    )
  }

  const infoChanged =
    name.trim() !== group.name ||
    type !== group.type ||
    currency !== group.currency ||
    description !== group.description

  // ── Group info ──────────────────────────────────────────────────────────────

  function saveInfo() {
    const trimmed = name.trim()
    if (!trimmed) { toast.error('Name is required'); return }
    saveGroup({ ...group!, name: trimmed, type, currency, description, updatedAt: new Date().toISOString() })
    toast.success('Saved')
  }

  // ── Members ─────────────────────────────────────────────────────────────────

  function persistMembers(next: Member[]) {
    setMembers(next)
    saveGroup({ ...group!, members: next, updatedAt: new Date().toISOString() })
  }

  function startEdit(m: Member) {
    setEditingId(m.id)
    setEditingName(m.name)
  }

  function commitEdit() {
    const trimmed = editingName.trim()
    if (!trimmed) { setEditingId(null); return }
    persistMembers(members.map((m) => m.id === editingId ? { ...m, name: trimmed } : m))
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function changeColor(memberId: string, color: string) {
    persistMembers(members.map((m) => m.id === memberId ? { ...m, color } : m))
  }

  function removeMember(memberId: string) {
    const member = members.find((m) => m.id === memberId)
    setConfirmConfig({
      title: `Remove ${member?.name ?? 'member'}?`,
      description: 'They will be removed from this group. Past expenses they are part of will not be affected.',
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: () => {
        persistMembers(members.filter((m) => m.id !== memberId))
        toast.success('Member removed')
        setConfirmConfig(null)
      },
    })
  }

  function addMember() {
    const trimmed = newMemberName.trim()
    if (!trimmed) return
    const usedColors = members.map((m) => m.color)
    const nextColor = MEMBER_COLORS.find((c) => !usedColors.includes(c)) ?? MEMBER_COLORS[members.length % MEMBER_COLORS.length]
    const newMember: Member = { id: generateId(), name: trimmed, color: nextColor }
    persistMembers([...members, newMember])
    setNewMemberName('')
    toast.success(`${trimmed} added`)
  }

  // ── Export ───────────────────────────────────────────────────────────────────

  function handleExport() {
    const data = exportGroupData(group!.id)
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${group!.name.replace(/[^a-z0-9]/gi, '_')}_splititt.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Group exported')
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  function handleDelete() {
    setConfirmConfig({
      title: `Delete "${group!.name}"?`,
      description: 'All expenses and settlements will be permanently lost. This cannot be undone.',
      confirmLabel: 'Delete group',
      danger: true,
      onConfirm: () => {
        deleteGroup(group!.id)
        toast.success('Group deleted')
        navigate('/', { replace: true })
      },
    })
  }

  return (
    <AppShell>
      <TopBar title="Settings" showBack />

      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
          {/* Desktop back */}
          <button
            onClick={() => navigate(`/g/${groupId}`)}
            className="hidden md:flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#4a4940] dark:text-[#a09880] hover:text-[#0a0a0a] dark:hover:text-[#f0ede5] transition-colors self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {group.name}
          </button>

          <h1 className="text-xl font-black uppercase tracking-[0.04em] text-[#0a0a0a] dark:text-[#f0ede5]">Group settings</h1>

          {/* ── Group info ─────────────────────────────────────────────────── */}
          <SectionCard title="Group info">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[13px] font-medium focus:outline-none focus:border-[#b9f542] focus:shadow-[2px_2px_0_#b9f542] transition-all"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-1.5">Type</label>
                <div className="flex gap-2 flex-wrap">
                  {GROUP_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        type === t.value
                          ? 'flex items-center gap-1.5 px-3 py-1.5 rounded border-2 border-[#0a0a0a] bg-[#b9f542] text-[#0a0a0a] text-[12px] font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0_#0a0a0a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                          : 'flex items-center gap-1.5 px-3 py-1.5 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/30 text-[#4a4940] dark:text-[#a09880] text-[12px] font-medium uppercase tracking-wider transition-colors hover:border-[#0a0a0a] dark:hover:border-[#f0ede5]'
                      )}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-1.5">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-10 px-3 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[13px] font-medium focus:outline-none focus:border-[#b9f542] focus:shadow-[2px_2px_0_#b9f542] transition-all"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                  ))}
                </select>
                {currency !== group.currency && (
                  <p className="text-xs text-[#f97316] mt-1.5">Changing currency only affects the symbol — existing expense amounts are not converted.</p>
                )}
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#4a4940] dark:text-[#a09880] mb-1.5">
                  Description <span className="font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What's this group for?"
                  className="w-full px-3 py-2 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5]/50 bg-white dark:bg-[#1a1a17] text-[#0a0a0a] dark:text-[#f0ede5] text-[13px] font-medium resize-none focus:outline-none focus:border-[#b9f542] focus:shadow-[2px_2px_0_#b9f542] transition-all"
                />
              </div>

              {infoChanged && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveInfo}>
                    <Check className="w-3.5 h-3.5" />
                    Save changes
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setName(group.name); setType(group.type)
                      setCurrency(group.currency); setDescription(group.description)
                    }}
                  >
                    Discard
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── Members ────────────────────────────────────────────────────── */}
          <SectionCard title="Members">
            <div className="flex flex-col gap-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 py-2 px-1 rounded hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] group/row transition-colors"
                >
                  <ColorPicker color={m.color} onChange={(c) => changeColor(m.id, c)} />

                  {editingId === m.id ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        ref={editInputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                        className="flex-1 h-8 px-2.5 rounded border-2 border-[#b9f542] bg-white dark:bg-[#1e1e1a] text-[13px] text-[#0a0a0a] dark:text-[#f0ede5] focus:outline-none shadow-[2px_2px_0_#b9f542]"
                      />
                      <button onClick={commitEdit} className="p-1 rounded text-[#4d6e08] dark:text-[#b9f542] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 rounded text-[#4a4940] dark:text-[#a09880] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-[13px] font-medium text-[#0a0a0a] dark:text-[#f0ede5] truncate">{m.name}</span>
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover/row:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(m)}
                          className="w-9 h-9 flex items-center justify-center rounded text-[#4a4940] dark:text-[#a09880] hover:text-[#0a0a0a] dark:hover:text-[#f0ede5] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] transition-colors"
                          title="Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeMember(m.id)}
                          className="w-9 h-9 flex items-center justify-center rounded text-[#4a4940] dark:text-[#a09880] hover:text-[#ff5c3d] hover:bg-[#ff5c3d]/10 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add member row */}
              {showAddInput ? (
                <div className="flex items-center gap-2 mt-1 py-1 px-1">
                  <div className="w-7 h-7 rounded-full shrink-0 bg-[#f0ede5] dark:bg-[#1a1a17] border-2 border-dashed border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 flex items-center justify-center text-[#4a4940] dark:text-[#a09880] text-xs font-bold">
                    {newMemberName[0]?.toUpperCase() ?? '+'}
                  </div>
                  <input
                    ref={addInputRef}
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { addMember(); setShowAddInput(false) }
                      if (e.key === 'Escape') { setNewMemberName(''); setShowAddInput(false) }
                    }}
                    placeholder="Member name"
                    className="flex-1 h-8 px-2.5 rounded border-2 border-[#b9f542] bg-white dark:bg-[#1e1e1a] text-[13px] text-[#0a0a0a] dark:text-[#f0ede5] focus:outline-none shadow-[2px_2px_0_#b9f542]"
                  />
                  <button
                    onClick={() => { addMember(); setShowAddInput(false) }}
                    className="p-1 rounded text-[#4d6e08] dark:text-[#b9f542] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setNewMemberName(''); setShowAddInput(false) }}
                    className="p-1 rounded text-[#4a4940] dark:text-[#a09880] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddInput(true)}
                  className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#88bc20] hover:text-[#6b9418] px-1 py-2 transition-colors mt-1 self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add member
                </button>
              )}
            </div>
          </SectionCard>

          {/* ── Export ─────────────────────────────────────────────────────── */}
          <SectionCard title="Backup">
            <p className="text-[11px] font-mono text-[#4a4940] dark:text-[#a09880] mb-4">
              Export this group (with all expenses) to a JSON file.
            </p>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              Export group
            </Button>
          </SectionCard>

          {/* ── Danger zone ─────────────────────────────────────────────────── */}
          <SectionCard className="border-[#ff5c3d]/40">
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-[#ff5c3d] mb-1">Danger zone</p>
            <p className="text-xs text-[#4a4940] dark:text-[#a09880] mb-3">
              Permanently deletes this group and all its expenses. This cannot be undone.
            </p>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete group
            </Button>
          </SectionCard>
        </div>
      </PageTransition>

      {confirmConfig && (
        <ConfirmModal
          {...confirmConfig}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </AppShell>
  )
}
