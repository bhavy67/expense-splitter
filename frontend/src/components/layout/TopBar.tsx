import { ArrowLeft, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/theme'

interface TopBarProps {
  title: string
  showBack?: boolean
  actions?: React.ReactNode
}

export function TopBar({ title, showBack, actions }: TopBarProps) {
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center h-14 px-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 gap-3">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors -ml-1.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="flex-1 text-base font-semibold text-gray-900 dark:text-zinc-100 truncate">{title}</h1>
      <div className="flex items-center gap-1">
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        <button
          onClick={toggle}
          className="p-1.5 rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
      </div>
    </header>
  )
}
