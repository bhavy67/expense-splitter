import { Button } from './Button'

interface Props {
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title, description, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-xl sm:mx-4 px-6 pt-6 pb-8 sm:pb-6">
        <div className="flex flex-col gap-1 mb-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
