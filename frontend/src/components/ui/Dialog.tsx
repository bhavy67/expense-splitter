import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './IconButton'

// Native <dialog> + showModal(): the browser makes the page inert (focus trap),
// closes on Escape, and renders in the top layer. React state stays the source
// of truth: `open` drives showModal()/close(), and every native close (Escape)
// is reported through onClose.

interface DialogProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  /** Pinned below the scroll area, e.g. the primary CTA. */
  footer?: React.ReactNode
  /** sheet = bottom sheet on mobile, centred from sm:. modal = always centred. */
  variant?: 'sheet' | 'modal'
  closeButton?: boolean
  className?: string
}

export function Dialog({
  open, onClose, title, description, children, footer, variant = 'sheet', closeButton = true, className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const closedByProp = useRef(false)
  const id = useId()

  useEffect(() => {
    const d = ref.current
    if (!open || !d) return
    const trigger = document.activeElement as HTMLElement | null
    closedByProp.current = false
    if (!d.open) d.showModal()
    // showModal() focuses the first focusable element (usually Close); React's autoFocus
    // doesn't render an attribute, so fields opt in with data-autofocus instead.
    d.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => {
      closedByProp.current = true
      if (d.open) d.close()
      // Native focus return doesn't happen when the dialog is unmounted while
      // open (conditionally rendered call sites), so restore it explicitly.
      trigger?.focus?.()
    }
  }, [open])

  function handleNativeClose() {
    // Ignore closes we caused ourselves, and stale ones (StrictMode re-opens
    // the dialog before the queued close event from its cleanup arrives).
    if (closedByProp.current || ref.current?.open) return
    onClose()
  }

  const sheet = variant === 'sheet'

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onClose={handleNativeClose}
      // The dialog box is the full viewport; only clicks outside the panel hit it.
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className={cn(
        'ui-dialog fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-fg',
        'open:flex justify-center sm:items-center sm:p-4',
        sheet ? 'items-end' : 'items-center p-4'
      )}
    >
      <div
        className={cn(
          'ui-dialog-panel flex max-h-[90dvh] w-full flex-col bg-surface shadow-float',
          sheet
            ? 'rounded-t-xl [--dialog-from:translateY(100%)] sm:max-w-md sm:rounded-xl sm:[--dialog-from:scale(0.98)]'
            : 'max-w-sm rounded-xl [--dialog-from:scale(0.98)]',
          className
        )}
      >
        <div
          className={cn(
            'overflow-y-auto overscroll-contain px-5 pt-3 pb-5',
            sheet && !footer && 'pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5'
          )}
        >
          {sheet && <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-surface-muted sm:hidden" aria-hidden />}
          <div className="mb-4 flex items-start gap-3">
            <div className="min-w-0 flex-1 pt-2">
              <h2 id={`${id}-title`} className="text-title">{title}</h2>
              {description && <p id={`${id}-desc`} className="mt-1 text-body text-fg-muted">{description}</p>}
            </div>
            {closeButton && (
              <IconButton aria-label="Close" onClick={onClose} className="-mr-2">
                <X />
              </IconButton>
            )}
          </div>
          {children}
        </div>
        {footer && (
          <div
            className={cn('shrink-0 border-t border-border px-5 pt-3', sheet ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3' : 'pb-3')}
          >
            {footer}
          </div>
        )}
      </div>
    </dialog>
  )
}

type VariantlessProps = Omit<DialogProps, 'variant'>

export function Sheet(props: VariantlessProps) {
  return <Dialog {...props} variant="sheet" />
}

export function Modal(props: VariantlessProps) {
  return <Dialog {...props} variant="modal" />
}
