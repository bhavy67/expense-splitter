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

export function AuthLayout({
  children,
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-indigo-50/40 flex flex-col items-center justify-center p-4">
      {/* Decorative glow — pure CSS, no images, respects the mobile-first
          padding so it never forces horizontal scroll. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute -bottom-28 -right-16 w-80 h-80 rounded-full bg-indigo-200/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3 rounded-2xl shadow-lg shadow-indigo-900/10">
            <LogoMark size={52} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Split<span className="text-indigo-700">Itt</span>
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-indigo-950/5 border border-gray-100 px-6 py-8 sm:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>

          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {footerText}{' '}
          <Link
            to={footerLinkTo}
            className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {footerLinkText}
          </Link>
        </p>
      </div>

      {/* Bottom brand line */}
      <p className="relative mt-8 text-xs text-gray-400 text-center px-6">
        Split smarter. Settle faster.
      </p>
    </div>
  )
}
