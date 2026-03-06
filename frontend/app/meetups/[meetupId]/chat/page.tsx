'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { MeetupChat } from '@/components/chat/meetup-chat'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getMeetup, type CourseMeetup } from '@/lib/meetups'

export default function MeetupChatPage() {
  const routeParams = useParams()
  const meetupIdParam = routeParams?.meetupId
  const meetupId = typeof meetupIdParam === 'string' ? meetupIdParam : Array.isArray(meetupIdParam) ? meetupIdParam[0] : ''
  const parsedMeetupId = Number(meetupId)
  const { token, isAuthenticated } = useAuth()
  const [meetup, setMeetup] = useState<CourseMeetup | null>(null)
  const [error, setError] = useState<string | null>(Number.isFinite(parsedMeetupId) ? null : '잘못된 모임 ID입니다.')

  useEffect(() => {
    if (!Number.isFinite(parsedMeetupId)) {
      return
    }

    getMeetup(parsedMeetupId, token)
      .then((response) => {
        setMeetup(response)
        setError(null)
      })
      .catch((meetupError) => {
        setError(meetupError instanceof Error ? meetupError.message : '모임 정보를 불러오지 못했습니다.')
      })
  }, [parsedMeetupId, token])

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link href={meetup ? `/course/${meetup.courseId}` : '/'}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-foreground">모임 단체채팅</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
        {meetup && (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">Course Meetup</p>
                <h2 className="text-xl font-bold text-foreground">{meetup.title}</h2>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(meetup.startAt).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {meetup.participantCount} / {meetup.capacity}명
                  </span>
                </div>
                {meetup.meetingPointLat != null && meetup.meetingPointLon != null && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {meetup.meetingPointLat.toFixed(4)}, {meetup.meetingPointLon.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!isAuthenticated || !token ? (
          <Card>
            <CardContent className="space-y-3 p-5 text-center">
              <p className="font-semibold text-foreground">채팅을 사용하려면 로그인이 필요해요.</p>
              <p className="text-sm text-muted-foreground">카카오 로그인 후 코스모임에 참가하면 단체채팅을 사용할 수 있어요.</p>
              <Link href="/profile">
                <Button className="w-full">프로필에서 로그인하기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="space-y-3 p-5 text-center">
              <p className="font-semibold text-foreground">채팅방에 들어갈 수 없어요.</p>
              <p className="text-sm text-rose-600">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <MeetupChat meetupId={parsedMeetupId} token={token} />
        )}
      </main>
    </div>
  )
}
