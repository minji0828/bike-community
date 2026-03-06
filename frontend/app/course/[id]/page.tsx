'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MessageCircle, Plus, Route, MapPin, Navigation, Heart, Users } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapView } from '@/components/map-view'
import { getCourseDetail, toCourseDetailModel } from '@/lib/courses'
import { createCourseMeetup, joinMeetup, leaveMeetup, listCourseMeetups, type CourseMeetup } from '@/lib/meetups'
import { sampleCourses } from '@/lib/sample-data'

const difficultyColors = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-rose-100 text-rose-700',
}

const difficultyLabels = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
}

const poiTypeLabels = {
  toilet: '화장실',
  water: '음수대',
  rest: '쉼터',
  cafe: '카페',
}

export default function CourseDetailPage() {
  const routeParams = useParams()
  const idParam = routeParams?.id
  const id = typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : ''
  const router = useRouter()
  const courseId = Number(id)
  const { isAuthenticated, token } = useAuth()
  const [course, setCourse] = useState(() => sampleCourses.find((c) => c.id === id) || sampleCourses[0])
  const [courseLoading, setCourseLoading] = useState(Number.isFinite(courseId))
  const [meetups, setMeetups] = useState<CourseMeetup[]>([])
  const [meetupsLoading, setMeetupsLoading] = useState(true)
  const [meetupsError, setMeetupsError] = useState<string | null>(null)
  const [pendingMeetupId, setPendingMeetupId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null)

  const defaultStartAt = useMemo(() => {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
    date.setMinutes(0, 0, 0)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }, [])

  const [createForm, setCreateForm] = useState({
    title: `${course.name} 같이 타실 분`,
    startAt: defaultStartAt,
    meetingPointLat: course.path[0]?.lat?.toString() ?? '',
    meetingPointLon: course.path[0]?.lng?.toString() ?? '',
    capacity: '8',
  })

  const canFetchMeetups = useMemo(() => Number.isFinite(courseId), [courseId])

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      setCourseLoading(false)
      return
    }

    setCourseLoading(true)
    getCourseDetail(courseId)
      .then((response) => {
        setCourse(toCourseDetailModel(response))
      })
      .catch(() => {
        setCourse(sampleCourses.find((candidate) => candidate.id === id) || sampleCourses[0])
      })
      .finally(() => {
        setCourseLoading(false)
      })
  }, [courseId, id])

  useEffect(() => {
    setCreateForm({
      title: `${course.name} 같이 타실 분`,
      startAt: defaultStartAt,
      meetingPointLat: course.path[0]?.lat?.toString() ?? '',
      meetingPointLon: course.path[0]?.lng?.toString() ?? '',
      capacity: '8',
    })
  }, [course.name, course.path, defaultStartAt])

  const loadMeetups = useCallback(async () => {
    if (!canFetchMeetups) {
      setMeetupsLoading(false)
      setMeetupsError('모임을 조회할 수 없는 코스입니다.')
      return
    }

    try {
      setMeetupsLoading(true)
      const response = await listCourseMeetups(courseId, token)
      setMeetups(response)
      setMeetupsError(null)
    } catch (error) {
      setMeetupsError(error instanceof Error ? error.message : '모임 목록을 불러오지 못했습니다.')
    } finally {
      setMeetupsLoading(false)
    }
  }, [canFetchMeetups, courseId, token])

  useEffect(() => {
    void loadMeetups()
  }, [loadMeetups])

  const parseOptionalNumber = (value: string) => {
    if (!value.trim()) {
      return undefined
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const handleCreateMeetup = async () => {
    if (!token) {
      setMeetupsError('로그인 후 코스모임을 만들 수 있습니다.')
      return
    }

    try {
      setCreateLoading(true)
      setMeetupsError(null)
      setCreateSuccessMessage(null)

      const response = await createCourseMeetup(
        courseId,
        {
          title: createForm.title,
          startAt: createForm.startAt,
          meetingPointLat: parseOptionalNumber(createForm.meetingPointLat),
          meetingPointLon: parseOptionalNumber(createForm.meetingPointLon),
          capacity: parseOptionalNumber(createForm.capacity),
        },
        token
      )

      setCreateSuccessMessage('코스모임이 생성됐어요. 단체채팅방으로 이동합니다.')
      setShowCreateForm(false)
      await loadMeetups()
      router.push(`/meetups/${response.meetupId}/chat`)
    } catch (error) {
      setMeetupsError(error instanceof Error ? error.message : '코스모임 생성에 실패했습니다.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoin = async (meetupId: number) => {
    if (!token) {
      setMeetupsError('로그인 후 코스모임에 참가할 수 있습니다.')
      return
    }

    try {
      setPendingMeetupId(meetupId)
      await joinMeetup(meetupId, token)
      await loadMeetups()
    } catch (error) {
      setMeetupsError(error instanceof Error ? error.message : '모임 참가에 실패했습니다.')
    } finally {
      setPendingMeetupId(null)
    }
  }

  const handleLeave = async (meetupId: number) => {
    if (!token) {
      setMeetupsError('로그인 후 코스모임에서 나갈 수 있습니다.')
      return
    }

    try {
      setPendingMeetupId(meetupId)
      await leaveMeetup(meetupId, token)
      await loadMeetups()
    } catch (error) {
      setMeetupsError(error instanceof Error ? error.message : '모임 나가기에 실패했습니다.')
    } finally {
      setPendingMeetupId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-foreground">코스 상세</h1>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md bg-background px-4 py-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Badge className={difficultyColors[course.difficulty]}>{difficultyLabels[course.difficulty]}</Badge>
              <h2 className="mt-2 text-2xl font-bold text-foreground">{course.name}</h2>
              <p className="mt-1 text-muted-foreground">{course.description}</p>
              {courseLoading && <p className="mt-2 text-sm text-muted-foreground">실제 코스 데이터를 확인하는 중...</p>}
            </div>
          </div>

          <section className="mb-6">
            <MapView
              className="h-64 rounded-2xl border border-border bg-card"
              showRoute
              routePath={course.path}
              pois={course.pois}
              showCurrentLocation={false}
              fitBoundsPadding={{ top: 96, right: 24, bottom: 36, left: 24 }}
            />
          </section>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="flex flex-col items-center p-4">
                <Route className="mb-2 h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">{course.distance}km</span>
                <span className="text-xs text-muted-foreground">거리</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-4">
                <Clock className="mb-2 h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">{course.estimatedTime}분</span>
                <span className="text-xs text-muted-foreground">예상 시간</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-4">
                <MapPin className="mb-2 h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">{course.toiletCount}개</span>
                <span className="text-xs text-muted-foreground">화장실</span>
              </CardContent>
            </Card>
          </div>

          <section>
            <h3 className="mb-3 font-semibold text-foreground">경로 주변 시설</h3>
            {course.pois.length ? (
              <div className="space-y-2">
                {course.pois.map((poi) => (
                  <Card key={poi.id}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{poi.name}</p>
                        <p className="text-sm text-muted-foreground">{poiTypeLabels[poi.type]}</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full">
                        안내
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  이 코스는 아직 상세 편의시설 목록이 없어요. 현재는 경로와 기본 메타데이터 중심으로 보여드려요.
                </CardContent>
              </Card>
            )}
          </section>

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">코스모임</h3>
                <p className="text-sm text-muted-foreground">이 코스를 함께 탈 사람들과 단체채팅으로 이야기할 수 있어요.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{meetups.length}개</Badge>
                {isAuthenticated && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setShowCreateForm((previous) => !previous)
                      setCreateSuccessMessage(null)
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    모임 만들기
                  </Button>
                )}
              </div>
            </div>

            {!isAuthenticated && (
              <Card className="mb-3 border-dashed">
                <CardContent className="space-y-3 p-4">
                  <p className="text-sm text-muted-foreground">모임 참가와 단체채팅은 카카오 로그인 후 사용할 수 있어요.</p>
                  <Link href="/profile">
                    <Button variant="outline" className="w-full rounded-full">
                      프로필에서 로그인하기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {showCreateForm && isAuthenticated && (
              <Card className="mb-3">
                <CardContent className="space-y-4 p-4">
                  <div>
                    <h4 className="font-semibold text-foreground">새 코스모임 만들기</h4>
                    <p className="text-sm text-muted-foreground">모임을 생성하면 자동으로 참가 처리되고 바로 단체채팅을 열 수 있어요.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meetup-title">모임 제목</Label>
                    <Input
                      id="meetup-title"
                      value={createForm.title}
                      onChange={(event) => setCreateForm((previous) => ({ ...previous, title: event.target.value }))}
                      placeholder="예: 한강 야간 라이딩 같이 가요"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meetup-startAt">시작 일시</Label>
                    <Input
                      id="meetup-startAt"
                      type="datetime-local"
                      value={createForm.startAt}
                      onChange={(event) => setCreateForm((previous) => ({ ...previous, startAt: event.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="meetup-capacity">정원</Label>
                      <Input
                        id="meetup-capacity"
                        type="number"
                        min={1}
                        max={100}
                        value={createForm.capacity}
                        onChange={(event) => setCreateForm((previous) => ({ ...previous, capacity: event.target.value }))}
                      />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="meetup-lat">집결지 위도</Label>
                      <Input
                        id="meetup-lat"
                        inputMode="decimal"
                        value={createForm.meetingPointLat}
                        onChange={(event) => setCreateForm((previous) => ({ ...previous, meetingPointLat: event.target.value }))}
                      />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label htmlFor="meetup-lon">집결지 경도</Label>
                      <Input
                        id="meetup-lon"
                        inputMode="decimal"
                        value={createForm.meetingPointLon}
                        onChange={(event) => setCreateForm((previous) => ({ ...previous, meetingPointLon: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 rounded-full" onClick={handleCreateMeetup} disabled={createLoading}>
                      {createLoading ? '생성 중...' : '코스모임 생성'}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setShowCreateForm(false)}
                      disabled={createLoading}
                    >
                      닫기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {meetupsError && <p className="mb-3 text-sm text-rose-600">{meetupsError}</p>}
            {createSuccessMessage && <p className="mb-3 text-sm text-emerald-600">{createSuccessMessage}</p>}

            {meetupsLoading ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">코스모임 목록을 불러오는 중...</CardContent>
              </Card>
            ) : meetups.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">아직 열린 코스모임이 없어요. 백엔드에서 meetup을 만들면 여기 표시됩니다.</CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {meetups.map((meetup) => (
                  <Card key={meetup.meetupId}>
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{meetup.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">상태: {meetup.status}</p>
                        </div>
                        <Badge className={meetup.joined ? 'bg-emerald-100 text-emerald-700' : ''}>
                          {meetup.joined ? '참가중' : '참가 가능'}
                        </Badge>
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
                            {meetup.participantCount} / {meetup.capacity}명 참가
                          </span>
                        </div>
                        {meetup.meetingPointLat != null && meetup.meetingPointLon != null && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              집결지 {meetup.meetingPointLat.toFixed(4)}, {meetup.meetingPointLon.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {meetup.joined ? (
                          <>
                            <Link href={`/meetups/${meetup.meetupId}/chat`}>
                              <Button className="w-full rounded-full">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                단체채팅 입장
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              className="w-full rounded-full"
                              onClick={() => handleLeave(meetup.meetupId)}
                              disabled={pendingMeetupId === meetup.meetupId}
                            >
                              모임 나가기
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="col-span-2 w-full rounded-full"
                            onClick={() => handleJoin(meetup.meetupId)}
                            disabled={!isAuthenticated || pendingMeetupId === meetup.meetupId}
                          >
                            코스모임 참가하기
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
        <div className="mx-auto max-w-md">
          <Link href={`/course/${course.id}/guide`}>
            <Button className="h-14 w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-lg font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-600">
              <Navigation className="mr-2 h-5 w-5" />
              코스 따라가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
