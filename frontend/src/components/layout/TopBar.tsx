import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  title: string
  showBack?: boolean
  actions?: React.ReactNode
}

export function TopBar({ title, showBack, actions }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center h-14 px-4 bg-white border-b border-gray-200 gap-3">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors -ml-1.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="flex-1 text-base font-semibold text-gray-900 truncate">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
