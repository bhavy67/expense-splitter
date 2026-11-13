import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Upload, ChevronRight, Users } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { CreateGroupModal } from '@/components/groups/CreateGroupModal'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { AvatarStack } from '@/components/ui/Avatar'
import { Money } from '@/components/ui/Money'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { useGroups } from '@/hooks/useStore'
import { getExpenses, getPayments, importGroupData, isGroupExport } from '@/lib/storage'
import { toast } from '@/components/common/Toast'
import { calculateBalances, getTotalExpenses, simplifyDebts } from '@/lib/calculations'
import { GROUP_TYPE_ICONS } from '@/lib/icons'
import type { Group } from '@/types'

function plural(n: number, word: string) {
  return `${n} ${word}${n !== 1 ? 's' : ''}`
}

function GroupCard({ group, index }: { group: Group; index: number }) {
  const total = getTotalExpenses(getExpenses(group.id))

  return (
    <Card
      as={Link}
      to={`/g/${group.id}`}
      variant="interactive"
      className="p-4 animate-[fade-up_200ms_var(--ease-out)_both]"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex items-center gap-3">
        <IconTile icon={GROUP_TYPE_ICONS[group.type] ?? GROUP_TYPE_ICONS.other} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-title">{group.name}</h2>
          <p className="truncate text-body-sm text-fg-muted">
            {plural(group.members.length, 'member')}
            {total > 0 && <> · <Money amount={total} currency={group.currency} size="sm" className="text-fg-muted" /> spent</>}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
      </div>
      <AvatarStack names={group.members.map((m) => m.name)} className="mt-3 pl-1.5" />
    </Card>
  )
}

// Presentation-only summary built from existing helpers (no new lib/ logic).
function SummaryStrip({ groups }: { groups: Group[] }) {
  const currencies = new Set(groups.map((g) => g.currency))
  const singleCurrency = currencies.size === 1 ? groups[0].currency : null
  const totalSpent = singleCurrency
    ? groups.reduce((s, g) => s + getTotalExpenses(getExpenses(g.id)), 0)
    : 0
  const pending = groups.filter((g) =>
    simplifyDebts(calculateBalances(getExpenses(g.id), getPayments(g.id), g.members)).length > 0
  ).length

  const stats: { label: string; value: React.ReactNode }[] = [
    { label: 'Groups', value: groups.length },
    ...(singleCurrency ? [{ label: 'Total spent', value: <Money amount={totalSpent} currency={singleCurrency} className="whitespace-normal" /> }] : []),
    { label: 'To settle', value: pending === 0 ? 'None' : plural(pending, 'group') },
  ]

  return (
    <Card variant="inset" className="mb-6 grid grid-flow-col auto-cols-fr divide-x divide-border">
      {stats.map((s) => (
        <div key={s.label} className="min-w-0 px-3 py-3">
          <p className="text-caption text-fg-muted">{s.label}</p>
          <p className="text-body font-semibold tabular-nums [overflow-wrap:anywhere]">{s.value}</p>
        </div>
      ))}
    </Card>
  )
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCreate, setShowCreate] = useState(searchParams.get('new') === '1')
  const groups = useGroups()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let data: unknown
    try { data = JSON.parse(await file.text()) } catch { data = null }
    if (!isGroupExport(data)) { toast.error("That isn't a SplitItt backup file"); return }
    const group = importGroupData(data)
    if (!group) return // storage full: the error toast is already shown
    toast.success(`"${group.name}" restored`)
    navigate(`/g/${group.id}`)
  }

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreate(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const openImport = () => fileRef.current?.click()

  return (
    <AppShell>
      <TopBar
        title="Groups"
        largeTitle
        actions={
          <IconButton aria-label="Import a backup" onClick={openImport}>
            <Upload />
          </IconButton>
        }
      />

      <PageTransition>
        <div className="mx-auto max-w-[640px] px-4 pt-4 pb-8 md:py-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-title-lg">Groups</h1>
              {groups.length > 0 && <p className="text-body-sm text-fg-muted">{plural(groups.length, 'group')}</p>}
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={openImport}>
                <Upload className="size-4" />
                Import
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="size-4" />
                New group
              </Button>
            </div>
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title="Split your first expense"
              description="No accounts needed. Create a group, add names and start splitting."
              action={
                <div className="flex flex-col items-center gap-2">
                  <Button onClick={() => setShowCreate(true)}>
                    <Plus className="size-4" />
                    Create a group
                  </Button>
                  <Button variant="ghost" onClick={openImport}>Restore from backup</Button>
                </div>
              }
            />
          ) : (
            <>
              <SummaryStrip groups={groups} />
              <div className="flex flex-col gap-3">
                {groups.map((g, i) => <GroupCard key={g.id} group={g} index={i} />)}
              </div>
            </>
          )}
        </div>
      </PageTransition>

      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} />
    </AppShell>
  )
}
