import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-xl border px-3.5 text-sm',
            'bg-white dark:bg-zinc-900',
            'text-gray-900 dark:text-zinc-100',
            'placeholder:text-gray-400 dark:placeholder:text-zinc-500',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-0 focus:border-indigo-500 dark:focus:border-indigo-400',
            'disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-zinc-800 disabled:text-gray-500 dark:disabled:text-zinc-500',
            error
              ? 'border-red-400 dark:border-red-500 focus:ring-red-400 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500'
              : 'border-gray-300 dark:border-zinc-700',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500 dark:text-zinc-500">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
