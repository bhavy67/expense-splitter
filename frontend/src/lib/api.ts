import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // sends httpOnly refresh cookie
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (!refreshPromise) {
        refreshPromise = axios
          .post<{ access_token: string }>('/api/v1/auth/refresh', {}, { withCredentials: true })
          .then((res) => {
            useAuthStore.getState().setAccessToken(res.data.access_token)
            return res.data.access_token
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      try {
        const token = await refreshPromise
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)
