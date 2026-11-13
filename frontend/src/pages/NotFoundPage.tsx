import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <TopBar title="Not found" />
      <div className="mx-auto flex min-h-[60dvh] max-w-sm flex-col items-center justify-center px-4 text-center">
        <p className="text-display tabular-nums" aria-hidden>404</p>
        <h1 className="mt-2 text-title">Page not found</h1>
        <p className="mt-2 text-body text-fg-muted">
          This link doesn't point to anything. If it was a group link, the group only exists on the device it was created on.
        </p>
        <Button className="mt-6" onClick={() => navigate('/', { replace: true })}>Go home</Button>
      </div>
    </AppShell>
  )
}
