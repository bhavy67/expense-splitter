import { Link } from 'react-router-dom'
import { SplitSquareVertical, Receipt, Zap } from 'lucide-react'
import { Logo } from '@/components/common/Logo'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  footerText: string
  footerLinkText: string
  footerLinkTo: string
}

const features = [
  { icon: SplitSquareVertical, text: 'Split equally, by percentage, or exact amounts' },
  { icon: Receipt, text: 'Track every expense with a full audit trail' },
  { icon: Zap, text: 'Settle up instantly — auto-calculated balances' },
]

function BrandPanel() {
  return (
    <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between bg-indigo-700 dark:bg-zinc-900 px-10 py-12 border-r border-indigo-600 dark:border-zinc-800">
      <Logo size={30} light />

      <div>
        <h2 className="text-3xl font-bold text-white leading-snug tracking-tight">
          Split smarter.<br />Settle faster.
        </h2>
        <p className="mt-3 text-indigo-200 dark:text-zinc-400 text-sm leading-relaxed">
          The expense splitter that doesn't make you do maths.
        </p>
        <ul className="mt-8 flex flex-col gap-4">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-600 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-indigo-200 dark:text-zinc-300" />
              </span>
              <span className="text-sm text-indigo-100 dark:text-zinc-300 leading-snug">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-indigo-400 dark:text-zinc-600">© 2026 SplitItt</p>
    </div>
  )
}

export function AuthLayout({ children, title, subtitle, footerText, footerLinkText, footerLinkTo }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      {/* Form side */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4 py-12">
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-8">
          <Logo size={30} />
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-black/5 dark:shadow-none border border-gray-100 dark:border-zinc-800 px-6 py-8 sm:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">{title}</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{subtitle}</p>
            </div>
            {children}
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-zinc-500 mt-6">
            {footerText}{' '}
            <Link
              to={footerLinkTo}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
