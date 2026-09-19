import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Plus, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme'

export function BottomNav() {
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()
  const { pathname } = useLocation()

  if (pathname.includes('/expenses/new')) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fafaf7] dark:bg-[#0d0d0d] border-t-2 border-[#0a0a0a] dark:border-[#b9f542] pb-safe">
      <div className="flex items-center justify-around px-4 h-16">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-5 py-2 min-h-[44px] justify-center transition-colors',
              isActive
                ? 'text-[#4d6e08] dark:text-[#b9f542]'
                : 'text-[#4a4940]/50 dark:text-[#f0ede5]/40 hover:text-[#0a0a0a] dark:hover:text-[#f0ede5]'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Home</span>
        </NavLink>

        <button
          onClick={() => navigate('/?new=1')}
          className="w-12 h-12 rounded bg-[#b9f542] flex items-center justify-center border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] dark:shadow-[3px_3px_0_#b9f542] -mt-5 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <Plus className="w-6 h-6 text-[#0a0a0a]" strokeWidth={3} />
        </button>

        <button
          onClick={toggle}
          className="flex flex-col items-center gap-0.5 px-5 py-2 min-h-[44px] justify-center text-[#4a4940]/50 dark:text-[#f0ede5]/40 hover:text-[#0a0a0a] dark:hover:text-[#f0ede5] transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Theme</span>
        </button>
      </div>
    </nav>
  )
}
