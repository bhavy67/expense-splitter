import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  ready: boolean
  setUser: (user: User | null) => void
  setReady: (ready: boolean) => void
}

// Supabase's client manages the session (access + refresh tokens) itself in
// localStorage and refreshes it in the background — there's no manual
// token juggling here anymore. This store just mirrors the current user's
// profile for the UI, kept in sync by SessionGuard via onAuthStateChange.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user }),
  setReady: (ready) => set({ ready }),
}))
