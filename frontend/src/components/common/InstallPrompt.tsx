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
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl dark:shadow-black/60 px-4 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <img src="/icons/icon-192.png" alt="SplitItt" className="w-8 h-8 rounded-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Add to Home Screen</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">Install SplitItt for quick access</p>
            </div>
            <button
              onClick={install}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
            <button
              onClick={dismiss}
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
