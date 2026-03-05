import type { MeetupChatMessage } from '../types/bikeoasis';

function toWebSocketUrl(apiBaseUrl: string) {
  const trimmed = apiBaseUrl.replace(/\/+$/, '');
  if (trimmed.startsWith('https://')) {
    return `wss://${trimmed.slice('https://'.length)}/ws-stomp`;
  }
  if (trimmed.startsWith('http://')) {
    return `ws://${trimmed.slice('http://'.length)}/ws-stomp`;
  }
  return `${trimmed}/ws-stomp`;
}

function parseMessage(payload: unknown): MeetupChatMessage | null {
  const raw = payload as any;
  if (!raw) return null;
  return {
    messageId: String(raw.messageId ?? ''),
    meetupId: Number(raw.meetupId ?? 0),
    authorDisplayName: String(raw.authorDisplayName ?? '익명'),
    body: String(raw.body ?? ''),
    sentAt: String(raw.sentAt ?? new Date().toISOString()),
  };
}

export type MeetupChatHandlers = {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onMessage?: (message: MeetupChatMessage) => void;
  onHistory?: (messages: MeetupChatMessage[]) => void;
  onError?: (error: string) => void;
};

export class MeetupChatClient {
  private readonly meetupId: number;
  private readonly token: string;
  private readonly wsUrl: string;
  private readonly handlers: MeetupChatHandlers;

  private socket: WebSocket | null = null;
  private connected = false;

  constructor(params: {
    meetupId: number;
    apiBaseUrl: string;
    token: string;
    handlers?: MeetupChatHandlers;
  }) {
    this.meetupId = params.meetupId;
    this.wsUrl = toWebSocketUrl(params.apiBaseUrl);
    this.token = params.token;
    this.handlers = params.handlers ?? {};
  }

  connect() {
    if (this.socket) return;

    this.socket = new WebSocket(this.wsUrl);
    this.socket.onopen = () => {
      this.sendFrame('CONNECT', {
        'accept-version': '1.2',
        'heart-beat': '10000,10000',
        Authorization: `Bearer ${this.token}`,
      });
    };

    this.socket.onmessage = (event) => {
      this.handleRawFrames(String(event.data ?? ''));
    };

    this.socket.onerror = () => {
      this.handlers.onError?.('채팅 소켓 오류');
    };

    this.socket.onclose = () => {
      this.connected = false;
      this.socket = null;
      this.handlers.onDisconnected?.();
    };
  }

  disconnect() {
    if (!this.socket) return;
    this.sendFrame('DISCONNECT');
    this.socket.close();
    this.socket = null;
    this.connected = false;
  }

  requestHistory() {
    if (!this.connected) return;
    this.sendFrame('SEND', {
      destination: `/app/meetups/${this.meetupId}/chat.history`,
    }, '');
  }

  send(body: string) {
    if (!this.connected) {
      this.handlers.onError?.('채팅이 연결되지 않았습니다.');
      return;
    }
    this.sendFrame(
      'SEND',
      {
        destination: `/app/meetups/${this.meetupId}/chat.send`,
        'content-type': 'application/json',
      },
      JSON.stringify({ body })
    );
  }

  private sendFrame(command: string, headers: Record<string, string> = {}, body = '') {
    if (!this.socket) return;
    const headerText = Object.entries(headers)
      .map(([k, v]) => `${k}:${v}`)
      .join('\n');
    const frame = `${command}\n${headerText}\n\n${body}\0`;
    this.socket.send(frame);
  }

  private handleRawFrames(raw: string) {
    const frames = raw.split('\0').map((f) => f.trim()).filter((f) => f.length > 0);
    for (const frame of frames) {
      const lines = frame.split('\n');
      const command = lines[0]?.trim();
      const separatorIndex = lines.findIndex((line) => line.trim().length === 0);
      const headerLines = separatorIndex >= 0 ? lines.slice(1, separatorIndex) : lines.slice(1);
      const bodyLines = separatorIndex >= 0 ? lines.slice(separatorIndex + 1) : [];
      const headers: Record<string, string> = {};
      for (const line of headerLines) {
        const idx = line.indexOf(':');
        if (idx > 0) {
          headers[line.slice(0, idx)] = line.slice(idx + 1);
        }
      }
      const body = bodyLines.join('\n');

      if (command === 'CONNECTED') {
        this.connected = true;
        this.sendFrame('SUBSCRIBE', {
          id: `sub-chat-${this.meetupId}`,
          destination: `/topic/meetups/${this.meetupId}/chat`,
        });
        this.sendFrame('SUBSCRIBE', {
          id: `sub-history-${this.meetupId}`,
          destination: `/user/queue/meetups/${this.meetupId}/chat.history`,
        });
        this.handlers.onConnected?.();
        continue;
      }

      if (command === 'MESSAGE') {
        const destination = headers.destination ?? '';
        if (destination.endsWith('/chat.history')) {
          this.handleHistoryMessage(body);
        } else {
          this.handleChatMessage(body);
        }
        continue;
      }

      if (command === 'ERROR') {
        this.handlers.onError?.(headers.message || '채팅 연결 오류');
      }
    }
  }

  private handleChatMessage(rawBody: string) {
    try {
      const parsed = parseMessage(JSON.parse(rawBody));
      if (parsed) {
        this.handlers.onMessage?.(parsed);
      }
    } catch (e) {
      this.handlers.onError?.(`메시지 파싱 실패: ${String(e)}`);
    }
  }

  private handleHistoryMessage(rawBody: string) {
    try {
      const parsed = JSON.parse(rawBody);
      const list = Array.isArray(parsed)
        ? parsed.map(parseMessage).filter((v): v is MeetupChatMessage => v !== null)
        : [];
      this.handlers.onHistory?.(list);
    } catch (e) {
      this.handlers.onError?.(`히스토리 파싱 실패: ${String(e)}`);
    }
  }
}
