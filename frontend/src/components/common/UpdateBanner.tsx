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
    <div role="status" className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-[#0a0a0a] dark:bg-[#1e1e1a] border-2 border-[#0a0a0a] dark:border-[#f0ede5] rounded shadow-[3px_3px_0_#b9f542] px-4 py-3 flex items-center gap-3">
        <p className="flex-1 text-sm font-bold text-[#f0ede5]">A new version is ready</p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 min-h-[44px] rounded border-2 border-[#0a0a0a] bg-[#b9f542] text-[#0a0a0a] text-xs font-bold uppercase tracking-wider active:scale-[0.97] transition-transform"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload
        </button>
      </div>
    </div>
  )
}
