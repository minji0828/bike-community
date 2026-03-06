'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { API_BASE_URL } from '@/lib/api'
import { MeetupChatMessage } from '@/lib/meetups'
import { SimpleStompClient, toWebSocketUrl } from '@/lib/stomp'

function upsertMessages(previous: MeetupChatMessage[], incoming: MeetupChatMessage[]) {
  const map = new Map(previous.map((message) => [message.messageId, message]))
  incoming.forEach((message) => map.set(message.messageId, message))
  return [...map.values()].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
}

export function MeetupChat({ meetupId, token }: { meetupId: number; token: string }) {
  const [messages, setMessages] = useState<MeetupChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<SimpleStompClient | null>(null)

  const wsUrl = useMemo(() => `${toWebSocketUrl(API_BASE_URL)}/ws-stomp`, [])

  useEffect(() => {
    const client = new SimpleStompClient({
      url: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onMessage: (frame) => {
        const destination = frame.headers.destination

        try {
          if (destination === `/topic/meetups/${meetupId}/chat`) {
            const message = JSON.parse(frame.body) as MeetupChatMessage
            setMessages((previous) => upsertMessages(previous, [message]))
            return
          }

          if (destination === `/user/queue/meetups/${meetupId}/chat.history`) {
            const history = JSON.parse(frame.body) as MeetupChatMessage[]
            setMessages((previous) => upsertMessages(previous, history))
          }
        } catch {
          setError('채팅 메시지를 해석하지 못했습니다.')
        }
      },
      onError: (message) => {
        setStatus('error')
        setError(message.includes('403') ? '모임 참가자만 단체채팅을 사용할 수 있습니다.' : message)
      },
      onClose: () => {
        setStatus((previous) => (previous === 'error' ? previous : 'connecting'))
      },
    })

    clientRef.current = client

    client
      .connect()
      .then(() => {
        setStatus('connected')
        client.subscribe(`/topic/meetups/${meetupId}/chat`, `meetup-chat-${meetupId}`)
        client.subscribe(`/user/queue/meetups/${meetupId}/chat.history`, `meetup-history-${meetupId}`)
        client.send(`/app/meetups/${meetupId}/chat.history`)
      })
      .catch((connectError) => {
        setStatus('error')
        setError(connectError instanceof Error ? connectError.message : '채팅 연결에 실패했습니다.')
      })

    return () => {
      client.disconnect()
      clientRef.current = null
    }
  }, [meetupId, token, wsUrl])

  const handleSend = () => {
    const body = draft.trim()
    if (!body || !clientRef.current || status !== 'connected') {
      return
    }

    clientRef.current.send(
      `/app/meetups/${meetupId}/chat.send`,
      JSON.stringify({ body }),
      {
        'content-type': 'application/json',
      }
    )
    setDraft('')
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-semibold text-foreground">단체채팅</p>
            <p className="text-xs text-muted-foreground">코스모임 참가자끼리 실시간으로 대화해요</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {status === 'connected' ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600">연결됨</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-rose-500" />
                <span className="text-rose-600">{status === 'connecting' ? '연결 중' : '연결 실패'}</span>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <div className="max-h-[420px] min-h-[320px] space-y-3 overflow-y-auto bg-muted/30 px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[280px] items-center justify-center text-center text-sm text-muted-foreground">
              아직 대화가 없어요. 첫 메시지를 남겨보세요.
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.messageId} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{message.authorDisplayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.sentAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3 py-2 text-sm text-foreground shadow-sm">
                  {message.body}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border p-3">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSend()
              }
            }}
            placeholder="모임원들에게 보낼 메시지를 입력하세요"
            maxLength={200}
            disabled={status !== 'connected'}
          />
          <Button onClick={handleSend} disabled={status !== 'connected' || !draft.trim()} className="rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
