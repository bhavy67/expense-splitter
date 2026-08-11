type WSEvent = {
  type: string
  payload: unknown
}

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
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    this.ws = new WebSocket(`${protocol}://${window.location.host}/ws/groups/${groupId}?token=${token}`)

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
