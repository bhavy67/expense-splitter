import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
          className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="bg-white dark:bg-[#1e1e1a] border-2 border-[#0a0a0a] dark:border-[#f0ede5] rounded shadow-[5px_5px_0_#0a0a0a] dark:shadow-[5px_5px_0_#b9f542] px-4 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] bg-[#0a0a0a] flex items-center justify-center shrink-0">
              <img src="/icons/icon-192.png" alt="SplitItt" className="w-8 h-8 rounded" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.04em] text-[#0a0a0a] dark:text-[#f0ede5]">Add to Home Screen</p>
              <p className="text-xs text-[#4a4940] dark:text-[#a09880] truncate">Install SplitItt for quick access</p>
            </div>
            <button
              onClick={install}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded border-2 border-[#0a0a0a] bg-[#b9f542] text-[#0a0a0a] text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_#0a0a0a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
            <button
              onClick={dismiss}
              className="shrink-0 w-7 h-7 rounded border border-[#0a0a0a]/20 dark:border-[#f0ede5]/20 flex items-center justify-center text-[#4a4940] dark:text-[#a09880] hover:bg-[#f0ede5] dark:hover:bg-[#1a1a17] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
