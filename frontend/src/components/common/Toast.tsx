import { useEffect, useRef, useState } from 'react'
import { X, CircleCheck, CircleAlert, Info } from 'lucide-react'

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

const icons: Record<ToastType, React.ReactNode> = {
  success: <CircleCheck className="size-4 shrink-0" aria-hidden />,
  error: <CircleAlert className="size-4 shrink-0" aria-hidden />,
  info: <Info className="size-4 shrink-0" aria-hidden />,
}

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 2500)
    return () => clearTimeout(timer)
  }, [onRemove])

  return (
    <div
      role={t.type === 'error' ? 'alert' : 'status'}
      className="flex w-full items-center gap-3 rounded-md bg-inverse-bg px-4 py-3 text-inverse-fg shadow-float"
      style={{ animation: 'toast-slide-down 0.2s var(--ease-out) both' }}
    >
      {icons[t.type]}
      <p className="flex-1 text-body-sm font-medium">{t.message}</p>
      <button
        aria-label="Dismiss notification"
        onClick={onRemove}
        className="-m-3 flex size-11 shrink-0 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const listener: ToastListener = (t) => setToasts((prev) => [...prev, t])
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  // A manual popover lives in the top layer, so toasts can sit above an open
  // <dialog>. Re-showing on every new toast moves it above a dialog opened since.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.matches(':popover-open')) el.hidePopover()
    if (toasts.length) el.showPopover()
  }, [toasts.length])

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <div
      ref={ref}
      popover="manual"
      className="fixed inset-x-0 top-0 bottom-auto m-0 mx-auto h-auto w-full max-w-sm overflow-visible border-0 bg-transparent p-0 px-4"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <div className="flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
        ))}
      </div>
    </div>
  )
}
