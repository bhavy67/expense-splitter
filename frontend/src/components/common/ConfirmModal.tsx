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
      <div className="absolute inset-0 bg-[#0a0a0a]/60" onClick={onCancel} />
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-[#1e1e1a] rounded-t sm:rounded border-2 border-[#0a0a0a] dark:border-[#f0ede5] shadow-[5px_5px_0_#0a0a0a] dark:shadow-[5px_5px_0_#b9f542] sm:mx-4 px-6 pt-6 pb-8 sm:pb-6">
        <div className="flex flex-col gap-1.5 mb-6">
          <h2 className="text-base font-black uppercase tracking-[0.04em] text-[#0a0a0a] dark:text-[#f0ede5]">{title}</h2>
          {description && (
            <p className="text-[12px] font-mono text-[#4a4940] dark:text-[#a09880] leading-relaxed">{description}</p>
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
