// Dev-only (/__ui): every primitive in every state. Not registered in production builds.
import { useState } from 'react'
import { Moon, Sun, Trash2, Plus, Search, ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react'
import { useThemeStore } from '@/store/theme'
import { cn } from '@/lib/utils'
import { CATEGORY_ICONS, GROUP_TYPE_ICONS } from '@/lib/icons'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Field, Input, MoneyInput, Select, Textarea } from '@/components/ui/Field'
import { Card } from '@/components/ui/Card'
import { ListRow } from '@/components/ui/ListRow'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { IconTile } from '@/components/ui/IconTile'
import { Badge } from '@/components/ui/Badge'
import { Chip, ChipGroup } from '@/components/ui/Chip'
import { SegmentedTabs, TabPanel } from '@/components/ui/SegmentedTabs'
import { Modal, Sheet } from '@/components/ui/Dialog'
import { StickyActionBar } from '@/components/ui/StickyActionBar'
import { Money } from '@/components/ui/Money'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { toast } from '@/components/common/Toast'

const MERGE_CHECKS: [string, string, string][] = [
  ['text-title', 'text-fg', 'text-title text-fg'],
  ['text-caption', 'text-fg-muted', 'text-caption text-fg-muted'],
  ['shadow-float', 'bg-surface', 'shadow-float bg-surface'],
]

const NAMES = ['Riya Shah', 'Aman', 'Kabir Mehta', 'Neha', 'Zoya Khan', 'Dev', 'Ira']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title={title} />
      {children}
    </section>
  )
}

export default function KitchenSinkPage() {
  const { theme, toggle } = useThemeStore()
  const [tab, setTab] = useState<'expenses' | 'balances' | 'stats'>('expenses')
  const [chips, setChips] = useState<string[]>(['all'])
  const [sheet, setSheet] = useState(false)
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [bar, setBar] = useState(false)

  const toggleChip = (id: string) =>
    setChips((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))

  return (
    <AppShell>
      <div className={cn('mx-auto flex max-w-2xl flex-col gap-10 px-4 py-6 text-fg', bar && 'pb-28')}>
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-title-lg">UI kitchen sink</h1>
            <p className="text-body-sm text-fg-muted">Dev only · {theme} theme</p>
          </div>
          <IconButton aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={toggle}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </IconButton>
        </header>

        <Section title="cn() / tailwind-merge">
          <Card className="flex flex-col gap-2 p-4">
            {MERGE_CHECKS.map(([a, b, want]) => {
              const got = cn(a, b)
              return (
                <p key={a} className="text-body-sm font-mono break-all">
                  {got === want ? 'PASS' : 'FAIL'} · cn('{a}', '{b}') → '{got}'
                </p>
              )
            })}
            <p className={cn('text-title', 'text-fg-muted')}>This line is cn('text-title', 'text-fg-muted'): 18px and muted.</p>
          </Card>
        </Section>

        <Section title="Type scale">
          <div className="flex flex-col gap-2">
            <p className="text-display tabular-nums">₹1,24,560.00</p>
            <p className="text-title-lg">Page title (title-lg)</p>
            <p className="text-title">Section title (title)</p>
            <p className="text-body">Body text, 15/22. The quick brown fox splits the bill.</p>
            <p className="text-body-sm text-fg-muted">Body small, muted meta</p>
            <p className="text-caption text-fg-subtle">Caption, subtle</p>
            <p className="text-title tabular-nums">₹ $ € £ ¥ · 0123456789 · −12.50</p>
          </div>
        </Section>

        <Section title="Colour tokens">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {['bg', 'surface', 'surface-subtle', 'surface-muted', 'fg', 'fg-muted', 'fg-subtle', 'border', 'border-strong', 'border-input', 'inverse-bg', 'inverse-fg'].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span className="size-6 shrink-0 rounded-sm border border-border" style={{ background: `var(--${t})` }} />
                <span className="truncate text-caption">{t}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Button">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger"><Trash2 className="size-4" />Delete</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="secondary" aria-label="Add"><Plus className="size-5" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <Button loading>Saving</Button>
            <Button variant="secondary" loading>Loading</Button>
          </div>
          <Button fullWidth size="lg">Full width</Button>
          <div className="flex items-center gap-1">
            <IconButton aria-label="Search"><Search /></IconButton>
            <IconButton aria-label="Delete"><Trash2 /></IconButton>
            <IconButton aria-label="Disabled" disabled><Plus /></IconButton>
          </div>
        </Section>

        <Section title="Fields">
          <Field label="Title" hint="What was it for?">
            <Input placeholder="Dinner at Toit" />
          </Field>
          <Field label="Amount" error="Enter an amount above zero">
            <Input defaultValue="-20" />
          </Field>
          <Field label="Disabled">
            <Input disabled defaultValue="Can't edit" />
          </Field>
          <Field label="Category">
            <Select defaultValue="food">
              <option value="food">Food</option>
              <option value="travel">Travel</option>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea placeholder="Optional" />
          </Field>
          <Field label="Total">
            <MoneyInput prefix="₹" placeholder="0" />
          </Field>
        </Section>

        <Section title="Card">
          <Card className="p-4">Default card</Card>
          <Card variant="interactive" as="button" className="w-full p-4" onClick={() => toast.info('Card clicked')}>
            Interactive card (button)
          </Card>
          <Card variant="inset" className="p-4">Inset card</Card>
        </Section>

        <Section title="ListRow">
          <Card className="overflow-hidden">
            <ListRow
              divider
              leading={<IconTile icon={CATEGORY_ICONS.food} />}
              title="Dinner at a very long restaurant name that truncates"
              subtitle="Paid by Riya · Equally"
              trailing={<Money amount={1240} />}
              chevron
            />
            <ListRow
              divider
              as="button"
              onClick={() => toast.success('Row clicked')}
              leading={<Avatar name="Aman Verma" />}
              title="Aman"
              subtitle={<span className="inline-flex items-center gap-1"><ArrowUpRight className="size-3.5" />owes</span>}
              trailing={<Money amount={-500} showSign tone="negative" className="font-semibold" />}
            />
            <ListRow
              leading={<Avatar name="Riya Shah" />}
              title="Riya"
              subtitle={<span className="inline-flex items-center gap-1"><ArrowDownLeft className="size-3.5" />gets back</span>}
              trailing={<Money amount={500} showSign tone="positive" className="font-medium" />}
            />
          </Card>
        </Section>

        <Section title="Avatar, IconTile, Badge, Skeleton">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name="Riya Shah" size={20} />
            <Avatar name="Riya Shah" size={28} />
            <Avatar name="Riya Shah" size={36} />
            <Avatar name="Riya Shah" size={48} color="#ff0000" />
            <AvatarStack names={NAMES} />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_ICONS).map(([k, I]) => <IconTile key={k} icon={I} />)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(GROUP_TYPE_ICONS).map(([k, I]) => <IconTile key={k} icon={I} size="sm" />)}
            <IconTile icon={Check} size="lg" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>4 members</Badge>
            <Badge><Check className="size-3" />Settled</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </Section>

        <Section title="Chips">
          <ChipGroup aria-label="Filter by category">
            {['all', ...Object.keys(CATEGORY_ICONS)].map((id) => {
              const Icon = CATEGORY_ICONS[id as keyof typeof CATEGORY_ICONS]
              return (
                <Chip key={id} selected={chips.includes(id)} onClick={() => toggleChip(id)}>
                  {Icon && <Icon />}
                  <span className="capitalize">{id}</span>
                </Chip>
              )
            })}
            <Chip disabled>Disabled</Chip>
          </ChipGroup>
        </Section>

        <Section title="SegmentedTabs">
          <SegmentedTabs
            id="demo-tabs"
            aria-label="Group sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'expenses', label: 'Expenses' },
              { id: 'balances', label: 'Balances' },
              { id: 'stats', label: 'Stats' },
            ]}
          />
          <TabPanel tabsId="demo-tabs" value={tab}>
            <Card variant="inset" className="p-4 text-body capitalize">{tab} panel</Card>
          </TabPanel>
        </Section>

        <Section title="Money">
          <div className="flex flex-col gap-1">
            <Money amount={123456.5} size="display" />
            <Money amount={500} showSign tone="positive" size="lg" />
            <Money amount={-500} showSign tone="negative" size="lg" />
            <Money amount={0} showSign size="md" />
            <Money amount={42} currency="USD" size="sm" />
            <Money amount={42} currency="EUR" size="sm" />
          </div>
        </Section>

        <Section title="Dialogs and toasts">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setSheet(true)}>Open sheet</Button>
            <Button variant="secondary" onClick={() => setModal(true)}>Open modal</Button>
            <Button variant="secondary" onClick={() => setConfirm(true)}>Open confirm</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => toast.success('Expense saved')}>Success toast</Button>
            <Button variant="ghost" onClick={() => toast.error('Storage full')}>Error toast</Button>
            <Button variant="ghost" onClick={() => toast.info('UPI is only available for INR groups')}>Info toast</Button>
          </div>
          <Button variant="secondary" onClick={() => setBar((b) => !b)}>
            {bar ? 'Hide' : 'Show'} sticky action bar
          </Button>
        </Section>

        <Section title="EmptyState">
          <Card>
            <EmptyState
              icon={<GROUP_TYPE_ICONS.friends />}
              title="Split your first expense"
              description="Create a group, add people, and start adding expenses."
              action={<Button>Create a group</Button>}
            />
          </Card>
        </Section>

        {/* Tall content so the scroll container (and scroll lock under dialogs) can be tested. */}
        <div className="flex flex-col gap-2">
          {Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
      </div>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Paid by"
        description="Pick who paid for this expense."
        footer={<Button fullWidth onClick={() => setSheet(false)}>Done</Button>}
      >
        <div className="flex flex-col gap-3">
          <Field label="Search members"><Input placeholder="Name" /></Field>
          <Button variant="ghost" onClick={() => toast.success('Toast above the sheet')}>Trigger toast</Button>
          {NAMES.map((n) => <ListRow key={n} leading={<Avatar name={n} />} title={n} divider />)}
        </div>
      </Sheet>

      <Modal open={modal} onClose={() => setModal(false)} title="Centred modal">
        <div className="flex flex-col gap-3">
          <p className="text-body text-fg-muted">Tab should stay inside this modal. Escape closes it.</p>
          <Field label="Note"><Input /></Field>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => toast.info('Toast above the modal')}>Toast</Button>
            <Button className="flex-1" onClick={() => setModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {confirm && (
        <ConfirmModal
          title="Delete this expense?"
          description="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => { setConfirm(false); toast.success('Deleted') }}
          onCancel={() => setConfirm(false)}
        />
      )}

      {bar && (
        <StickyActionBar summary={<><Money amount={1240} size="sm" className="text-fg" /> · split 4 ways</>}>
          <Button fullWidth>Save expense</Button>
        </StickyActionBar>
      )}
    </AppShell>
  )
}
