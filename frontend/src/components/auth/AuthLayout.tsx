import { Link } from 'react-router-dom'

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex flex-col items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-3">
            <SplitIcon />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">SplitEase</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 px-8 py-8">
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
      <p className="mt-8 text-xs text-gray-400">
        Split expenses fairly. Settle simply.
      </p>
    </div>
  )
}

function SplitIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" />
    </svg>
  )
}
