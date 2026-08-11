import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/common/Toast'
import type { User } from '@/types'
import type { AxiosError } from 'axios'

interface TokenResponse {
  access_token: string
}

function getErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail: string | { msg: string }[] }>
  const detail = axiosErr.response?.data?.detail
  if (!detail) return 'Something went wrong. Please try again.'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail[0]?.msg ?? 'Validation error'
  return 'Something went wrong.'
}

async function fetchMe(token: string): Promise<User> {
  const res = await api.get<User>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: { email: string; name: string; password: string }) => {
      const res = await api.post<TokenResponse>('/auth/register', data)
      return res.data
    },
    onSuccess: async ({ access_token }) => {
      const user = await fetchMe(access_token)
      setAuth(user, access_token)
      navigate('/')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useLogin(redirectTo = '/') {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<TokenResponse>('/auth/login', data)
      return res.data
    },
    onSuccess: async ({ access_token }) => {
      const user = await fetchMe(access_token)
      setAuth(user, access_token)
      navigate(redirectTo, { replace: true })
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useGoogleAuth(redirectTo = '/') {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (idToken: string) => {
      const res = await api.post<TokenResponse>('/auth/google', { id_token: idToken })
      return res.data
    },
    onSuccess: async ({ access_token }) => {
      const user = await fetchMe(access_token)
      setAuth(user, access_token)
      navigate(redirectTo, { replace: true })
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  return async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAuth()
      navigate('/auth/login')
    }
  }
}

export function useUpdateProfile() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name?: string; avatar_url?: string }) => {
      const res = await api.patch<import('@/types').User>('/auth/me', data)
      return res.data
    },
    onSuccess: (user) => {
      setAuth(user, accessToken ?? '')
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Profile updated')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}
