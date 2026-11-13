import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'splititt-install-dismissed'

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if dismissed before or already installed
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    function handler(e: Event) {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setVisible(false)
    else dismiss()
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Install SplitItt"
      className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 md:bottom-6"
    >
      <div className="flex items-center gap-3 rounded-lg bg-inverse-bg py-3 pr-2 pl-3 text-inverse-fg shadow-float animate-[fade-up_200ms_var(--ease-out)_both]">
        <img src="/icons/icon-192.png" alt="" className="size-10 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-medium">Add to home screen</p>
          <p className="truncate text-caption font-normal opacity-70">Install SplitItt for quick access</p>
        </div>
        <button
          onClick={install}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-inverse-fg px-3 text-body-sm font-medium text-inverse-bg active:scale-[0.98]"
        >
          <Download className="size-4" />
          Install
        </button>
        <button aria-label="Dismiss" onClick={dismiss} className="flex size-11 shrink-0 items-center justify-center rounded-full opacity-70 hover:opacity-100">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
