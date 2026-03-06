type Frame = {
  command: string
  headers: Record<string, string>
  body: string
}

function buildFrame(command: string, headers: Record<string, string> = {}, body = '') {
  const headerLines = Object.entries(headers)
    .map(([key, value]) => `${key}:${value}`)
    .join('\n')

  return `${command}\n${headerLines}\n\n${body}\0`
}

function parseFrames(chunk: string) {
  return chunk
    .split('\0')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((raw) => {
      const [head, ...bodyParts] = raw.split('\n\n')
      const lines = head.split('\n')
      const command = lines[0]
      const headers = lines.slice(1).reduce<Record<string, string>>((acc, line) => {
        const index = line.indexOf(':')
        if (index > -1) {
          acc[line.slice(0, index)] = line.slice(index + 1)
        }
        return acc
      }, {})

      return {
        command,
        headers,
        body: bodyParts.join('\n\n'),
      } satisfies Frame
    })
}

type StompClientOptions = {
  url: string
  connectHeaders?: Record<string, string>
  onMessage?: (frame: Frame) => void
  onError?: (message: string) => void
  onClose?: () => void
}

export class SimpleStompClient {
  private socket: WebSocket | null = null
  private readonly options: StompClientOptions
  private isDisconnecting = false

  constructor(options: StompClientOptions) {
    this.options = options
  }

  connect() {
    return new Promise<void>((resolve, reject) => {
      let settled = false
      this.isDisconnecting = false
      this.socket = new WebSocket(this.options.url)

      this.socket.onopen = () => {
        this.socket?.send(
          buildFrame('CONNECT', {
            'accept-version': '1.2',
            'heart-beat': '0,0',
            ...this.options.connectHeaders,
          })
        )
      }

      this.socket.onmessage = (event) => {
        const frames = parseFrames(String(event.data))

        frames.forEach((frame) => {
          if (frame.command === 'CONNECTED') {
            settled = true
            resolve()
            return
          }

          if (frame.command === 'ERROR') {
            const message = frame.body || frame.headers.message || '채팅 연결에 실패했습니다.'
            this.options.onError?.(message)
            if (!settled) {
              settled = true
              reject(new Error(message))
            }
            return
          }

          if (frame.command === 'MESSAGE') {
            this.options.onMessage?.(frame)
          }
        })
      }

      this.socket.onerror = () => {
        if (!settled) {
          settled = true
          reject(new Error('웹소켓 연결 중 오류가 발생했습니다.'))
        }
      }

      this.socket.onclose = () => {
        const wasDisconnecting = this.isDisconnecting
        this.socket = null
        this.isDisconnecting = false

        if (!settled && !wasDisconnecting) {
          settled = true
          reject(new Error('웹소켓 연결이 닫혔습니다.'))
        }

        this.options.onClose?.()
      }
    })
  }

  subscribe(destination: string, id: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }

    this.socket.send(
      buildFrame('SUBSCRIBE', {
        id,
        destination,
      })
    )
  }

  send(destination: string, body = '', headers: Record<string, string> = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }

    this.socket.send(
      buildFrame(
        'SEND',
        {
          destination,
          ...headers,
        },
        body
      )
    )
  }

  disconnect() {
    if (!this.socket) {
      return
    }

    this.isDisconnecting = true

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(buildFrame('DISCONNECT'))
    }

    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close()
    }

    if (this.socket.readyState === WebSocket.CLOSING || this.socket.readyState === WebSocket.CLOSED) {
      this.socket = null
      this.isDisconnecting = false
    }
  }
}

export function toWebSocketUrl(baseHttpUrl: string) {
  const normalized = baseHttpUrl.replace(/\/$/, '')
  if (normalized.startsWith('https://')) {
    return normalized.replace(/^https:\/\//, 'wss://')
  }
  if (normalized.startsWith('http://')) {
    return normalized.replace(/^http:\/\//, 'ws://')
  }
  return normalized
}
