import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plus, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-center justify-around px-2 h-16">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors',
              isActive ? 'text-indigo-600' : 'text-gray-500')
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        {/* FAB-style center button */}
        <button
          onClick={() => navigate('/?new=1')}
          className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 -mt-4 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors',
              isActive ? 'text-indigo-600' : 'text-gray-500')
          }
        >
          <UserCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </NavLink>
      </div>
    </nav>
  )
}
