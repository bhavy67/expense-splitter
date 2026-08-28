type WSEvent = {
  type: string
  payload: unknown
}

// Resolve the WebSocket origin. Explicit VITE_WS_URL wins; otherwise derive
// it from VITE_API_URL (swapping http(s) for ws(s)) so a single env var
// covers both REST and WS when the backend lives on another origin. With
// neither set, fall back to the current page's origin (same-origin/dev-proxy
// setups).
function resolveWsOrigin(): string | null {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined
  if (explicit) return explicit.replace(/\/$/, '')

  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (apiUrl) return apiUrl.replace(/\/$/, '').replace(/^http/, 'ws')

  return null
}

const WS_ORIGIN = resolveWsOrigin()

type Listener = (event: WSEvent) => void

class GroupWebSocket {
  private ws: WebSocket | null = null
  private groupId: string | null = null
  private listeners = new Set<Listener>()
  private reconnectDelay = 1000
  private maxDelay = 30000
  private stopped = false

  connect(groupId: string, token: string) {
    this.stopped = false
    this.groupId = groupId
    this._open(groupId, token)
  }

  private _open(groupId: string, token: string) {
    const origin =
      WS_ORIGIN ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
    this.ws = new WebSocket(`${origin}/ws/groups/${groupId}?token=${token}`)

    this.ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as WSEvent
        this.listeners.forEach((l) => l(event))
      } catch {}
    }

    this.ws.onclose = () => {
      if (!this.stopped) {
        setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay)
          // Re-fetch token from store before reconnecting
          const { accessToken } = (window as any).__authStore?.getState?.() ?? {}
          if (accessToken && this.groupId) {
            this._open(this.groupId, accessToken)
          }
        }, this.reconnectDelay)
      }
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1000
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  disconnect() {
    this.stopped = true
    this.ws?.close()
    this.ws = null
  }
}

export const groupWS = new GroupWebSocket()
