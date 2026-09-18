import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plus, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme'

export function BottomNav() {
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 pb-safe">
      <div className="flex items-center justify-around px-2 h-16">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors',
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-zinc-500'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        <button
          onClick={() => navigate('/?new=1')}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/25 -mt-4 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={toggle}
          className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-[10px] font-medium">Theme</span>
        </button>
      </div>
    </nav>
  )
}
