import axios from 'axios'
import { useAuthStore } from '@/store/auth'

// When the frontend and backend are deployed on different origins (e.g. the
// frontend on Vercel, the backend elsewhere), set VITE_API_URL to the
// backend's origin. Left unset, requests go to a relative path and rely on
// the Vite dev proxy (local dev) or same-origin hosting.
const API_ROOT = import.meta.env.VITE_API_URL ?? ''
export const API_BASE = `${API_ROOT}/api/v1`

export const api = axios.create({
  baseURL: API_BASE,
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
          .post<{ access_token: string }>(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
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
