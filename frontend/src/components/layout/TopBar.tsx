import { ArrowLeft, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/theme'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title: string
  showBack?: boolean
  actions?: React.ReactNode
  /** The page shows its own title-lg heading; fade this title in only once that scrolls away. */
  largeTitle?: boolean
}

export function TopBar({ title, showBack, actions, largeTitle }: TopBarProps) {
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()

  return (
    <header className="topbar md:hidden sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-border bg-bg/85 px-2 backdrop-blur">
      {showBack && (
        <IconButton
          aria-label="Go back"
          // Opened from a shared link there's no history to go back to — go home instead.
          onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/')}
        >
          <ArrowLeft />
        </IconButton>
      )}
      <h1 className={cn('min-w-0 flex-1 truncate text-[17px] font-semibold text-fg', !showBack && 'pl-2', largeTitle && 'topbar-title-large')}>
        {title}
      </h1>
      {actions}
      <IconButton aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggle}>
        {theme === 'dark' ? <Sun /> : <Moon />}
      </IconButton>
    </header>
  )
}
