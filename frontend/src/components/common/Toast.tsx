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

// Supabase / backend error → human-friendly message
const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials':         'Incorrect email or password. Please try again.',
  'Email not confirmed':               'Please confirm your email before signing in.',
  'User already registered':           'An account with this email already exists. Try signing in.',
  'Email already in use':              'This email is already registered. Try signing in.',
  'Password should be at least 6 characters': 'Please choose a stronger password (min. 8 characters).',
  'Email rate limit exceeded':         'Too many attempts. Please wait a moment and try again.',
  'Token has expired or is invalid':   'Your link has expired. Please request a new one.',
  'JWT expired':                       'Your session expired. Please sign in again.',
  'User not found':                    'No account found with this email.',
  'Signups not allowed for this instance': 'Registrations are currently disabled.',
  'Invalid invite code':               'This invite link is invalid or has already been used.',
  'Already a member':                  'You\'re already a member of this group.',
}

function humanize(raw: string): string {
  // strip "detail: " prefix that FastAPI sometimes sends
  const clean = raw.replace(/^detail:\s*/i, '').trim()
  return ERROR_MAP[clean] ?? (clean.length > 0 && clean.length < 200 ? clean : 'Something went wrong. Please try again.')
}

function emit(type: ToastType, message: string) {
  const toast: Toast = { id: String(++counter), type, message }
  listeners.forEach((l) => l(toast))
}

export const toast = {
  success: (message: string) => emit('success', message),
  error:   (raw: string)     => emit('error', humanize(raw)),
  info:    (message: string) => emit('info', message),
}

const config: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; iconColor: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
    bg: 'bg-white dark:bg-zinc-900',
    border: 'border-l-4 border-emerald-500',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5 shrink-0" />,
    bg: 'bg-white dark:bg-zinc-900',
    border: 'border-l-4 border-red-500',
    iconColor: 'text-red-500',
  },
  info: {
    icon: <Info className="w-5 h-5 shrink-0" />,
    bg: 'bg-white dark:bg-zinc-900',
    border: 'border-l-4 border-blue-500',
    iconColor: 'text-blue-500',
  },
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    const t = setTimeout(onRemove, 5000)
    return () => clearTimeout(t)
  }, [onRemove])

  const c = config[toast.type]

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl shadow-xl px-4 py-3.5 w-full border border-gray-100 dark:border-zinc-800',
        c.bg, c.border,
      )}
      style={{ animation: 'toast-slide-down 0.25s ease-out both' }}
    >
      <span className={c.iconColor}>{c.icon}</span>
      <p className="text-sm font-medium text-gray-800 dark:text-zinc-100 flex-1 leading-snug pt-0.5">{toast.message}</p>
      <button onClick={onRemove} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors mt-0.5 shrink-0">
        <X className="w-4 h-4" />
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
