import { cloneElement, forwardRef, isValidElement, useId } from 'react'
import { cn } from '@/lib/utils'

const control =
  'w-full rounded-md border border-border-input bg-surface-subtle px-3 text-body text-fg placeholder:text-fg-subtle transition-[border-color,box-shadow] duration-[120ms] focus:border-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/20 disabled:opacity-50 disabled:cursor-not-allowed aria-[invalid=true]:border-negative'

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(control, 'h-11', className)} {...props} />
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(control, 'min-h-11 py-2.5 resize-y', className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn(control, 'h-11 pr-8', className)} {...props} />
)
Select.displayName = 'Select'

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'prefix'> {
  prefix?: React.ReactNode // currency symbol or a currency chip
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ prefix, className, ...props }, ref) => (
    <div className={cn(control, 'flex h-16 items-center gap-2 focus-within:border-fg', className)}>
      {prefix && <span className="shrink-0 text-title text-fg-muted">{prefix}</span>}
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-display tabular-nums text-fg placeholder:text-fg-subtle focus:outline-none"
        {...props}
      />
    </div>
  )
)
MoneyInput.displayName = 'MoneyInput'

interface FieldProps {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  className?: string
  /** A single Input / Textarea / Select / MoneyInput; Field injects id + aria wiring. */
  children: React.ReactElement<Record<string, unknown>>
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-caption text-fg-muted">{label}</label>
      {isValidElement(children) &&
        cloneElement(children, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && <p id={hintId} className="text-body-sm text-fg-muted">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-body-sm font-medium text-negative">{error}</p>}
    </div>
  )
}
