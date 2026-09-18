import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

type ToastListener = (toast: Toast) => void

const listeners = new Set<ToastListener>()
let counter = 0

function emit(type: ToastType, message: string) {
  const t: Toast = { id: String(++counter), type, message }
  listeners.forEach((l) => l(t))
}

export const toast = {
  success: (message: string) => emit('success', message),
  error:   (message: string) => emit('error', message),
  info:    (message: string) => emit('info', message),
}

const config: Record<ToastType, { icon: React.ReactNode; accent: string; iconColor: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
    accent: 'border-l-4 border-[#b9f542]',
    iconColor: 'text-[#b9f542]',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 shrink-0" />,
    accent: 'border-l-4 border-[#ff5c3d]',
    iconColor: 'text-[#ff5c3d]',
  },
  info: {
    icon: <Info className="w-4 h-4 shrink-0" />,
    accent: 'border-l-4 border-[#f59e0b]',
    iconColor: 'text-[#f59e0b]',
  },
}

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 5000)
    return () => clearTimeout(timer)
  }, [onRemove])

  const c = config[t.type]

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded bg-[#0a0a0a] dark:bg-[#1e1e1a] border-2 border-[#0a0a0a] dark:border-[#f0ede5] shadow-[3px_3px_0_#b9f542] px-4 py-3 w-full',
        c.accent
      )}
      style={{ animation: 'toast-slide-down 0.2s ease-out both' }}
    >
      <span className={c.iconColor}>{c.icon}</span>
      <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#f0ede5] flex-1 leading-snug">{t.message}</p>
      <button
        onClick={onRemove}
        className="text-[#f0ede5]/40 hover:text-[#f0ede5] transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener: ToastListener = (t) => setToasts((prev) => [...prev, t])
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center w-full max-w-sm px-4">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
      ))}
    </div>
  )
}
