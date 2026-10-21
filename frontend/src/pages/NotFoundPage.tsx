import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <TopBar title="Not found" />
      <EmptyState
        title="Page not found"
        description="This link doesn't point to anything. If it was a group link, the group only exists on the device it was created on."
        action={<Button onClick={() => navigate('/', { replace: true })}>Go to my groups</Button>}
      />
    </AppShell>
  )
}
