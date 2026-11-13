import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface MoneyProps {
  amount: number
  currency?: string
  /** Semantic hook for the future colour phase; all three render as `fg` today. */
  tone?: 'neutral' | 'positive' | 'negative'
  /** Prefix + / − (sign is shown on the absolute value). */
  showSign?: boolean
  size?: 'sm' | 'md' | 'lg' | 'display'
  className?: string
}

const tones = { neutral: 'text-fg', positive: 'text-positive', negative: 'text-negative' }
const sizes = { sm: 'text-body-sm', md: 'text-body', lg: 'text-title', display: 'text-display' }

export function Money({ amount, currency = 'INR', tone = 'neutral', showSign, size = 'md', className }: MoneyProps) {
  const sign = showSign && amount !== 0 ? (amount > 0 ? '+' : '−') : ''
  const value = showSign ? Math.abs(amount) : amount
  return (
    <span className={cn('tabular-nums whitespace-nowrap', tones[tone], sizes[size], className)}>
      {sign}
      {formatCurrency(value, currency)}
    </span>
  )
}
