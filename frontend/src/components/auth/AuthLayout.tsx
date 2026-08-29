import { Link } from 'react-router-dom'
import { LogoMark } from '@/components/common/Logo'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  footerText: string
  footerLinkText: string
  footerLinkTo: string
}

export function AuthLayout({ children, title, subtitle, footerText, footerLinkText, footerLinkTo }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-indigo-300/20 dark:bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 w-80 h-80 rounded-full bg-indigo-200/30 dark:bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3 rounded-2xl shadow-lg shadow-indigo-900/10 dark:shadow-indigo-900/30">
            <LogoMark size={52} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 tracking-tight">
            Split<span className="text-indigo-600 dark:text-indigo-400">Itt</span>
          </h1>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-indigo-950/5 dark:shadow-none border border-gray-100 dark:border-zinc-800 px-6 py-8 sm:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{subtitle}</p>
          </div>
          {children}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-zinc-500 mt-6">
          {footerText}{' '}
          <Link to={footerLinkTo} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            {footerLinkText}
          </Link>
        </p>
      </div>

      <p className="relative mt-8 text-xs text-gray-400 dark:text-zinc-600 text-center px-6">
        Split smarter. Settle faster.
      </p>
    </div>
  )
}
