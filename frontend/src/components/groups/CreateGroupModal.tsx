import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Field, Input } from '@/components/ui/Field'
import { Chip } from '@/components/ui/Chip'
import { Avatar } from '@/components/ui/Avatar'
import { Sheet } from '@/components/ui/Dialog'
import { GROUP_TYPE_ICONS } from '@/lib/icons'
import { GROUP_TYPE_LABELS, MEMBER_COLORS } from '@/lib/memberColors'
import { saveGroup, generateId } from '@/lib/storage'
import { toast } from '@/components/common/Toast'
import type { Group, GroupType, Member } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateGroupModal({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [type, setType] = useState<GroupType>('other')
  const [members, setMembers] = useState<string[]>(['', ''])

  function reset() {
    setName(''); setType('other'); setMembers(['', ''])
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
      currency: 'INR',
      members: validMembers,
      createdAt: now,
      updatedAt: now,
    }

    if (!saveGroup(group)) return
    toast.success(`"${trimmed}" created!`)
    reset()
    onClose()
    navigate(`/g/${group.id}`)
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="New group"
      footer={<Button type="submit" form="create-group-form" fullWidth>Create group</Button>}
    >
      <form id="create-group-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Group name">
          <Input
            data-autofocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Goa trip, Flat 4B, Friday dinners"
          />
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

        <div>
          <p className="text-caption text-fg-muted">Members</p>
          <p className="mb-2 text-body-sm text-fg-subtle">No accounts needed, just names.</p>
          <div className="flex flex-col gap-2">
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <Avatar name={m.trim() || String(i + 1)} />
                <Input
                  aria-label={`Member ${i + 1} name`}
                  value={m}
                  onChange={(e) => updateMember(i, e.target.value)}
                  maxLength={40}
                  placeholder={`Member ${i + 1}`}
                />
                {members.length > 1 && (
                  <IconButton aria-label={`Remove member ${i + 1}`} onClick={() => removeMember(i)} className="-mr-2">
                    <X />
                  </IconButton>
                )}
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addMember} className="-ml-2 self-start">
              <Plus className="size-4" />
              Add member
            </Button>
          </div>
        </div>
      </form>
    </Sheet>
  )
}
