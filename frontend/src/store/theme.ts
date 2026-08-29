import { create } from 'zustand'

type Theme = 'light' | 'dark'

function getInitial(): Theme {
  try {
    const stored = localStorage.getItem('splititt-theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  try { localStorage.setItem('splititt-theme', theme) } catch {}
}

const initial = getInitial()
applyTheme(initial)

interface ThemeStore {
  theme: Theme
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: initial,
  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    set({ theme: next })
  },
}))
