import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/common/Toast'
import { defaultAvatarForEmail } from '@/lib/avatars'
import type { User } from '@/types'

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return 'Something went wrong. Please try again.'
}

async function loadProfile(userId: string): Promise<User> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error || !data) throw error ?? new Error('Profile not found')
  return { id: data.id, email: data.email, name: data.name, avatar_url: data.avatar_url, created_at: data.created_at }
}

export function useRegister() {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: { email: string; name: string; password: string }) => {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name } },
      })
      if (error) throw error
      return { signUpData, email: data.email }
    },
    onSuccess: async ({ signUpData: { session, user }, email }) => {
      if (session && user) {
        // Assign a default avatar based on the email so every new account gets one
        const defaultAvatar = defaultAvatarForEmail(email)
        await supabase.from('profiles').update({ avatar_url: defaultAvatar }).eq('id', user.id)
        setUser(await loadProfile(user.id))
        navigate('/')
      } else {
        toast.success('Account created! Check your email to confirm, then sign in.')
        navigate('/auth/login')
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useLogin(redirectTo = '/') {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const { data: signInData, error } = await supabase.auth.signInWithPassword(data)
      if (error) throw error
      return signInData
    },
    onSuccess: async ({ user }) => {
      setUser(await loadProfile(user.id))
      navigate(redirectTo, { replace: true })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
    },
    onSuccess: () => toast.success('Reset link sent — check your inbox.'),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
    onSuccess: async () => {
      await supabase.auth.signOut()
      toast.success('Password updated successfully. Please sign in.')
      navigate('/auth/login', { replace: true })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useLogout() {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  return async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      navigate('/auth/login')
    }
  }
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name?: string; avatar_url?: string }) => {
      const userId = useAuthStore.getState().user?.id
      if (!userId) throw new Error('Not signed in')
      const { data: updated, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select('*')
        .single()
      if (error || !updated) throw error ?? new Error('Failed to update profile')
      return updated
    },
    onSuccess: (data) => {
      setUser({ id: data.id, email: data.email, name: data.name, avatar_url: data.avatar_url, created_at: data.created_at })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Profile saved!')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
