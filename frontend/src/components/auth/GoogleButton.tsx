import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface GoogleButtonProps {
  onToken: (idToken: string) => void
  loading?: boolean
  className?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (element: HTMLElement, config: object) => void
          prompt: () => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

export function GoogleButton({ onToken, loading, className }: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current) return

    function initGoogle() {
      if (!window.google || !containerRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          onToken(response.credential)
        },
      })
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'continue_with',
        size: 'large',
        width: containerRef.current.offsetWidth,
      })
    }

    if (window.google) {
      initGoogle()
    } else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initGoogle
      document.head.appendChild(script)
    }
  }, [onToken])

  // Fallback button when no client ID configured (dev mode)
  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          'flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed opacity-60',
          className
        )}
      >
        <GoogleIcon />
        Continue with Google
        <span className="text-xs text-gray-400">(configure VITE_GOOGLE_CLIENT_ID)</span>
      </button>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('w-full overflow-hidden rounded-xl', loading && 'opacity-50 pointer-events-none', className)}
    />
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
