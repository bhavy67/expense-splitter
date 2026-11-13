import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const card = cva('block rounded-lg text-fg', {
  variants: {
    variant: {
      default: 'bg-surface border border-border',
      interactive:
        'bg-surface border border-border text-left transition-[background-color,transform] duration-[120ms] ease-out hover:bg-surface-subtle active:scale-[0.99]',
      inset: 'bg-surface-subtle',
    },
  },
  defaultVariants: { variant: 'default' },
})

type CardProps = VariantProps<typeof card> &
  React.HTMLAttributes<HTMLElement> & {
    /** Render as another element or component, e.g. `as={Link} to="/g/1"` or `as="button"`. */
    as?: React.ElementType
    [prop: string]: unknown
  }

export function Card({ as: Comp = 'div', variant, className, ...props }: CardProps) {
  return <Comp className={cn(card({ variant }), className)} {...props} />
}
