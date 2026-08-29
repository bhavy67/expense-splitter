import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
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
  const toast: Toast = { id: String(++counter), type, message }
  listeners.forEach((l) => l(toast))
}

export const toast = {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  info: (message: string) => emit('info', message),
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
}

const styles: Record<ToastType, string> = {
  success: 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/40',
  error: 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40',
  info: 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    const t = setTimeout(onRemove, 4000)
    return () => clearTimeout(t)
  }, [onRemove])

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg max-w-sm w-full',
        'transition-all duration-200',
        styles[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="text-sm text-gray-800 dark:text-zinc-200 flex-1">{toast.message}</p>
      <button onClick={onRemove} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
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
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
      ))}
    </div>
  )
}
