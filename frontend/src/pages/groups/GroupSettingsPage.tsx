import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Plus, Check, X, Pencil, Download, Upload } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroup } from '@/hooks/useStore'
import { saveGroup, deleteGroup, generateId, exportGroupData, importGroupData } from '@/lib/storage'
import type { GroupExport } from '@/lib/storage'
import { toast } from '@/components/common/Toast'
import { cn } from '@/lib/utils'
import type { GroupType, Member } from '@/types'

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
    <div className={cn('bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4', className)}>
      {title && <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-4">{title}</p>}
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
        className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-zinc-900 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 transition-transform hover:scale-110 shrink-0"
        style={{ background: color }}
        title="Change color"
      />
      {open && (
        <div className="absolute left-0 top-9 z-20 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl p-2 grid grid-cols-5 gap-1.5">
          {MEMBER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false) }}
              className={cn(
                'w-6 h-6 rounded-full transition-transform hover:scale-110',
                c === color && 'ring-2 ring-offset-1 ring-indigo-500'
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
  const importRef = useRef<HTMLInputElement>(null)

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
        <div className="flex items-center justify-center min-h-screen text-gray-500 dark:text-zinc-500">
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
    if (!confirm('Remove this member?')) return
    persistMembers(members.filter((m) => m.id !== memberId))
    toast.success('Member removed')
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

  // ── Export / Import ──────────────────────────────────────────────────────────

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

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string
        const data = JSON.parse(raw) as GroupExport
        if (data.version !== 1 || !data.group || !Array.isArray(data.expenses)) {
          toast.error('Invalid file format'); return
        }
        const imported = importGroupData(data)
        toast.success(`Imported "${imported.name}"`)
        navigate(`/g/${imported.id}`)
      } catch {
        toast.error('Could not read file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  function handleDelete() {
    if (!confirm(`Delete "${group!.name}"? All expenses and settlements will be lost. This cannot be undone.`)) return
    deleteGroup(group!.id)
    toast.success('Group deleted')
    navigate('/', { replace: true })
  }

  return (
    <AppShell>
      <TopBar title="Settings" showBack />

      <PageTransition>
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
          {/* Desktop back */}
          <button
            onClick={() => navigate(`/g/${groupId}`)}
            className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {group.name}
          </button>

          <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Group settings</h1>

          {/* ── Group info ─────────────────────────────────────────────────── */}
          <SectionCard title="Group info">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                  Description <span className="font-normal text-gray-400 dark:text-zinc-500">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What's this group for?"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 group/row transition-colors"
                >
                  <ColorPicker color={m.color} onChange={(c) => changeColor(m.id, c)} />

                  {editingId === m.id ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        ref={editInputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                        className="flex-1 h-8 px-2.5 rounded-lg border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button onClick={commitEdit} className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{m.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(m)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                          title="Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeMember(m.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
                  <div className="w-7 h-7 rounded-full shrink-0 bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-400 text-xs font-bold">
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
                    className="flex-1 h-8 px-2.5 rounded-lg border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => { addMember(); setShowAddInput(false) }}
                    className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setNewMemberName(''); setShowAddInput(false) }}
                    className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddInput(true)}
                  className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium px-1 py-2 transition-colors mt-1 self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add member
                </button>
              )}
            </div>
          </SectionCard>

          {/* ── Export / Import ─────────────────────────────────────────────── */}
          <SectionCard title="Backup & restore">
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
              Export this group (with all expenses) to a JSON file. Import a previously exported group as a copy.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download className="w-3.5 h-3.5" />
                Export group
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => importRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5" />
                Import group
              </Button>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </SectionCard>

          {/* ── Danger zone ─────────────────────────────────────────────────── */}
          <SectionCard className="border-red-100 dark:border-red-900/30">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Danger zone</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mb-3">
              Permanently deletes this group and all its expenses. This cannot be undone.
            </p>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete group
            </Button>
          </SectionCard>
        </div>
      </PageTransition>
    </AppShell>
  )
}
