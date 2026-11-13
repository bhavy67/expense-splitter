import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Dialog'

interface Props {
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Call sites mount this conditionally; Dialog opens it on mount and returns focus on unmount.
export function ConfirmModal({
  title, description, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel,
}: Props) {
  return (
    <Sheet open onClose={onCancel} title={title} description={description} closeButton={false}>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  )
}
