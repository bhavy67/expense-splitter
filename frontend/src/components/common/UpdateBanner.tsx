import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

const CHECK_EVERY_MS = 60 * 60 * 1000

// Installed apps are resumed, not reloaded — so poll for new deploys
// (hourly, on tab focus, on reconnect) and offer a reload when one lands.
export function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return
      const check = () => { if (navigator.onLine) reg.update() }
      setInterval(check, CHECK_EVERY_MS)
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check() })
      window.addEventListener('online', check)
    },
  })

  if (!needRefresh) return null

  return (
    <div role="status" className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 md:bottom-6">
      <div className="flex items-center gap-3 rounded-lg bg-inverse-bg py-2 pr-2 pl-4 text-inverse-fg shadow-float animate-[fade-up_200ms_var(--ease-out)_both]">
        <p className="flex-1 text-body-sm font-medium">A new version is ready</p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-inverse-fg px-3 text-body-sm font-medium text-inverse-bg active:scale-[0.98]"
        >
          <RefreshCw className="size-4" />
          Reload
        </button>
      </div>
    </div>
  )
}
