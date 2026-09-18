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
    <header className="md:hidden sticky top-0 z-30 flex items-center h-14 px-3 bg-[#0a0a0a] dark:bg-[#0d0d0d] border-b-2 border-[#b9f542] gap-2">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded text-[#f0ede5] hover:bg-white/10 transition-colors -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="flex-1 text-[13px] font-black text-[#f0ede5] uppercase tracking-[0.06em] truncate">{title}</h1>
      <div className="flex items-center gap-1">
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
        <button
          onClick={toggle}
          className="p-1.5 rounded text-[#f0ede5]/60 hover:text-[#b9f542] hover:bg-white/10 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
