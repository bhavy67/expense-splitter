import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Plus, Check, X, Pencil, Download, FileSpreadsheet, AtSign, BookMarked } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Card } from '@/components/ui/Card'
import { ListRow } from '@/components/ui/ListRow'
import { Avatar } from '@/components/ui/Avatar'
import { Chip } from '@/components/ui/Chip'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroup, useExpenses, usePayments } from '@/hooks/useStore'
import { saveGroup, deleteGroup, generateId, exportGroupData } from '@/lib/storage'
import { getTemplates, deleteTemplate } from '@/lib/templates'
import { downloadExpensesCSV } from '@/lib/export'
import { toast } from '@/components/common/Toast'
import { isValidUpiId } from '@/lib/upi'
import { isMemberInUse } from '@/lib/calculations'
import { GROUP_TYPE_ICONS } from '@/lib/icons'
import { GROUP_TYPE_LABELS, MEMBER_COLORS } from '@/lib/memberColors'
import type { GroupType, Member } from '@/types'

type ConfirmConfig = { title: string; description?: string; confirmLabel: string; danger?: boolean; onConfirm: () => void }

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionHeader title={title} />
      {description && <p className="-mt-1 mb-3 text-body-sm text-fg-muted">{description}</p>}
      {children}
    </section>
  )
}

export default function GroupSettingsPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const group = useGroup(groupId!)
  const expenses = useExpenses(groupId!)
  const payments = usePayments(groupId!)
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null)
  const [templates, setTemplates] = useState(() => getTemplates())

  // Group info state
  const [name, setName] = useState(group?.name ?? '')
  const [type, setType] = useState<GroupType>(group?.type ?? 'other')
  const [description, setDescription] = useState(group?.description ?? '')

  // Member state
  const [members, setMembers] = useState<Member[]>(group?.members ?? [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingUpiId, setEditingUpiId] = useState<string | null>(null)
  const [editingUpiValue, setEditingUpiValue] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const addInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const upiInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (group) {
      setName(group.name)
      setType(group.type)
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

  useEffect(() => {
    if (editingUpiId) upiInputRef.current?.focus()
  }, [editingUpiId])

  if (!group) {
    return (
      <AppShell>
        <TopBar title="Settings" showBack />
        <EmptyState title="Group not found" description="It may have been deleted on this device." />
      </AppShell>
    )
  }

  const infoChanged =
    name.trim() !== group.name ||
    type !== group.type ||
    description !== group.description

  // ── Group info ──────────────────────────────────────────────────────────────

  function saveInfo() {
    const trimmed = name.trim()
    if (!trimmed) { toast.error('Name is required'); return }
    if (!saveGroup({ ...group!, name: trimmed, type, description, updatedAt: new Date().toISOString() })) return
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

  // ── UPI ID (independent from name editing) ───────────────────────────────

  function startUpiEdit(m: Member) {
    setEditingUpiId(m.id)
    setEditingUpiValue(m.upiId ?? '')
  }

  function commitUpiEdit() {
    const trimmed = editingUpiValue.trim()
    if (!trimmed) { setEditingUpiId(null); return }

    if (!isValidUpiId(trimmed)) {
      toast.error('Invalid UPI ID — try name@upi or 9876543210@ybl')
      return
    }

    const dupe = members.find((m) => m.id !== editingUpiId && m.upiId === trimmed)
    if (dupe) toast.info(`This UPI ID is already saved for ${dupe.name}`)

    const member = members.find((m) => m.id === editingUpiId)
    const isUpdate = !!member?.upiId

    persistMembers(members.map((m) => m.id === editingUpiId ? { ...m, upiId: trimmed } : m))
    toast.success(isUpdate ? `UPI ID updated for ${member!.name}` : `UPI ID saved for ${member!.name}`)
    setEditingUpiId(null)
  }

  function cancelUpiEdit() {
    setEditingUpiId(null)
    setEditingUpiValue('')
  }

  function clearUpi(m: Member) {
    persistMembers(members.map((mb) => mb.id === m.id ? { ...mb, upiId: undefined } : mb))
    toast.info(`UPI ID removed for ${m.name}`)
  }

  function removeMember(memberId: string) {
    const member = members.find((m) => m.id === memberId)
    if (isMemberInUse(memberId, expenses, payments)) {
      toast.error(`${member?.name ?? 'This member'} is part of expenses or payments — delete those first`)
      return
    }
    setConfirmConfig({
      title: `Remove ${member?.name ?? 'member'}?`,
      description: 'They will be removed from this group.',
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

  const withUpi = members.filter((m) => m.upiId).length

  return (
    <AppShell>
      <TopBar title="Settings" showBack largeTitle />

      <PageTransition>
        <div className="mx-auto flex max-w-[640px] flex-col gap-8 px-4 pt-4 pb-10 md:py-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/g/${groupId}`)} className="mb-2 -ml-3 hidden md:inline-flex">
              <ArrowLeft className="size-4" />
              Back to group
            </Button>
            <h1 className="text-title-lg">Settings</h1>
            <p className="truncate text-body-sm text-fg-muted">{group.name}</p>
          </div>

          {/* ── General ───────────────────────────────────────────────────── */}
          <Section title="General">
            <Card className="flex flex-col gap-4 p-4">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <div>
                <p className="mb-1.5 text-caption text-fg-muted">Type</p>
                <div role="group" aria-label="Group type" className="flex flex-wrap gap-2">
                  {(Object.keys(GROUP_TYPE_LABELS) as GroupType[]).map((t) => {
                    const Icon = GROUP_TYPE_ICONS[t]
                    return (
                      <Chip key={t} selected={type === t} onClick={() => setType(t)}>
                        <Icon />
                        {GROUP_TYPE_LABELS[t]}
                      </Chip>
                    )
                  })}
                </div>
              </div>
              <Field label="Description (optional)">
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What's this group for?" className="resize-none" />
              </Field>
              {infoChanged && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveInfo}>
                    <Check className="size-4" />
                    Save changes
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setName(group.name); setType(group.type)
                      setDescription(group.description)
                    }}
                  >
                    Discard
                  </Button>
                </div>
              )}
            </Card>
          </Section>

          {/* ── Members ───────────────────────────────────────────────────── */}
          <Section
            title="Members"
            description={
              members.length === 0 ? undefined
              : withUpi === 0 ? 'No UPI IDs yet. Add one to show a payment QR for that person.'
              : withUpi === members.length ? `All ${members.length} members have a UPI ID.`
              : `${withUpi} of ${members.length} members have a UPI ID.`
            }
          >
            <Card className="overflow-hidden">
              {members.map((m) => (
                <div key={m.id} className="flex items-start gap-3 border-b border-border px-4 py-3">
                  <Avatar name={m.name} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    {editingId === m.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          ref={editInputRef}
                          aria-label={`Rename ${m.name}`}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                          className="h-10"
                        />
                        <IconButton aria-label="Save name" onMouseDown={(e) => e.preventDefault()} onClick={commitEdit}><Check /></IconButton>
                        <IconButton aria-label="Cancel" onMouseDown={(e) => e.preventDefault()} onClick={cancelEdit}><X /></IconButton>
                      </div>
                    ) : (
                      <p className="truncate text-body font-medium leading-10">{m.name}</p>
                    )}

                    {editingId !== m.id && (
                      editingUpiId === m.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            ref={upiInputRef}
                            aria-label={`UPI ID for ${m.name}`}
                            value={editingUpiValue}
                            onChange={(e) => setEditingUpiValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitUpiEdit(); if (e.key === 'Escape') cancelUpiEdit() }}
                            onBlur={cancelUpiEdit}
                            placeholder="name@upi or 9876543210@ybl"
                            className="h-10 font-mono text-body-sm"
                          />
                          <IconButton aria-label="Save UPI ID" onMouseDown={(e) => e.preventDefault()} onClick={commitUpiEdit}><Check /></IconButton>
                          <IconButton aria-label="Cancel" onMouseDown={(e) => e.preventDefault()} onClick={cancelUpiEdit}><X /></IconButton>
                        </div>
                      ) : m.upiId ? (
                        <div className="-ml-2 flex min-w-0 items-center">
                          <Button variant="ghost" size="sm" onClick={() => startUpiEdit(m)} aria-label={`Edit UPI ID for ${m.name}`} className="min-w-0 shrink px-2 font-normal text-fg-muted">
                            <AtSign className="size-3.5 shrink-0" />
                            <span className="truncate font-mono">{m.upiId}</span>
                          </Button>
                          <IconButton aria-label={`Remove UPI ID for ${m.name}`} onClick={() => clearUpi(m)} className="text-fg-muted"><X /></IconButton>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => startUpiEdit(m)} className="-ml-2 px-2 font-normal text-fg-muted">
                          <Plus className="size-3.5" />
                          Add UPI ID
                        </Button>
                      )
                    )}
                  </div>

                  {editingId !== m.id && editingUpiId !== m.id && (
                    <div className="-mr-2 flex shrink-0 items-center">
                      <IconButton aria-label={`Rename ${m.name}`} onClick={() => startEdit(m)}><Pencil /></IconButton>
                      <IconButton aria-label={`Remove ${m.name}`} onClick={() => removeMember(m.id)}><Trash2 /></IconButton>
                    </div>
                  )}
                </div>
              ))}

              {showAddInput ? (
                <div className="flex items-center gap-1 px-4 py-3">
                  <Avatar name={newMemberName || '+'} className="mr-2" />
                  <Input
                    ref={addInputRef}
                    aria-label="New member name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { addMember(); setShowAddInput(false) }
                      if (e.key === 'Escape') { setNewMemberName(''); setShowAddInput(false) }
                    }}
                    placeholder="Member name"
                    className="h-10"
                  />
                  <IconButton aria-label="Add member" onClick={() => { addMember(); setShowAddInput(false) }}><Check /></IconButton>
                  <IconButton aria-label="Cancel" onClick={() => { setNewMemberName(''); setShowAddInput(false) }}><X /></IconButton>
                </div>
              ) : (
                <ListRow
                  as="button"
                  onClick={() => setShowAddInput(true)}
                  leading={<span className="flex size-9 items-center justify-center rounded-full border border-dashed border-border-strong"><Plus className="size-4" /></span>}
                  title="Add member"
                />
              )}
            </Card>
          </Section>

          {/* ── Templates (shared by all groups) ──────────────────────────── */}
          {templates.length > 0 && (
            <Section title="Expense templates" description="Shared by all your groups.">
              <Card className="overflow-hidden">
                {templates.map((t) => (
                  <ListRow
                    key={t.id}
                    divider
                    className="pr-2"
                    leading={<BookMarked className="size-5 text-fg-muted" aria-hidden />}
                    title={t.name}
                    subtitle={t.title}
                    trailing={
                      <IconButton aria-label={`Delete template ${t.name}`} onClick={() => { deleteTemplate(t.id); setTemplates(getTemplates()) }}>
                        <Trash2 />
                      </IconButton>
                    }
                  />
                ))}
              </Card>
            </Section>
          )}

          {/* ── Data ──────────────────────────────────────────────────────── */}
          <Section title="Data" description="Export this group's expenses, or download a backup you can restore later.">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => downloadExpensesCSV(group, expenses)} disabled={expenses.length === 0}>
                <FileSpreadsheet className="size-4" />
                Export CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download className="size-4" />
                Download backup
              </Button>
            </div>
          </Section>

          {/* ── Danger zone ───────────────────────────────────────────────── */}
          <section className="border-t border-border pt-6">
            <h2 className="text-title">Delete group</h2>
            <p className="mt-1 mb-3 text-body-sm text-fg-muted">
              Permanently deletes this group and all its expenses. This cannot be undone.
            </p>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="size-4" />
              Delete group
            </Button>
          </section>
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
