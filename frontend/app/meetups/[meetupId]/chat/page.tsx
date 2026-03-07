'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { MeetupChat } from '@/components/chat/meetup-chat'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getMeetup, type CourseMeetup } from '@/lib/meetups'

export default function MeetupChatPage() {
  const routeParams = useParams()
  const router = useRouter()
  const meetupIdParam = routeParams?.meetupId
  const meetupId = typeof meetupIdParam === 'string' ? meetupIdParam : Array.isArray(meetupIdParam) ? meetupIdParam[0] : ''
  const parsedMeetupId = Number(meetupId)
  const { token, isAuthenticated } = useAuth()
  const [meetup, setMeetup] = useState<CourseMeetup | null>(null)
  const [isMeetupLoading, setIsMeetupLoading] = useState(Number.isFinite(parsedMeetupId))
  const [error, setError] = useState<string | null>(Number.isFinite(parsedMeetupId) ? null : '잘못된 모임 ID입니다.')

  useEffect(() => {
    if (!Number.isFinite(parsedMeetupId)) {
      return
    }

    const loadingTimer = window.setTimeout(() => {
      setIsMeetupLoading(true)
    }, 0)

    getMeetup(parsedMeetupId, token)
      .then((response) => {
        setMeetup(response)
        setError(null)
      })
      .catch((meetupError) => {
        setMeetup(null)
        setError(meetupError instanceof Error ? meetupError.message : '모임 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        setIsMeetupLoading(false)
        window.clearTimeout(loadingTimer)
      })

    return () => {
      window.clearTimeout(loadingTimer)
    }
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
        ) : isMeetupLoading ? (
          <Card>
            <CardContent className="space-y-3 p-5 text-center">
              <p className="font-semibold text-foreground">모임 참가 상태를 확인하고 있어요.</p>
              <p className="text-sm text-muted-foreground">채팅 연결 전에 모임 정보와 참가 여부를 먼저 확인합니다.</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="space-y-3 p-5 text-center">
              <p className="font-semibold text-foreground">채팅방에 들어갈 수 없어요.</p>
              <p className="text-sm text-rose-600">{error}</p>
            </CardContent>
          </Card>
        ) : meetup && !meetup.joined ? (
          <Card>
            <CardContent className="space-y-4 p-5 text-center">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">모임 참가자만 채팅에 입장할 수 있어요.</p>
                <p className="text-sm text-muted-foreground">먼저 코스 모임에 참가한 뒤 다시 채팅방으로 들어와 주세요.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => router.back()} className="w-full">
                  이전 화면으로 돌아가기
                </Button>
                <Link href={`/course/${meetup.courseId}`}>
                  <Button className="w-full">코스 상세로 이동</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : meetup ? (
          <MeetupChat meetupId={parsedMeetupId} token={token} />
        ) : (
          <Card>
            <CardContent className="space-y-3 p-5 text-center">
              <p className="font-semibold text-foreground">채팅방 준비 중입니다.</p>
              <p className="text-sm text-muted-foreground">모임 정보를 다시 확인한 뒤 채팅을 열어 주세요.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
