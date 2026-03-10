'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Copy,
  ExternalLink,
  MessageCircle,
  Plus,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { CourseCollectionSheet } from '@/components/collection/course-collection-sheet'
import { CourseHeroPanel } from '@/components/course/course-hero-panel'
import { HighlightForm } from '@/components/highlight/highlight-form'
import { HighlightList } from '@/components/highlight/highlight-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCourseDetail, issueCourseShare, toCourseDetailModel } from '@/lib/courses'
import { createCourseHighlight, listCourseHighlights, type CourseHighlight } from '@/lib/highlights'
import { createCourseMeetup, joinMeetup, leaveMeetup, listCourseMeetups, type CourseMeetup } from '@/lib/meetups'
import type { Course } from '@/lib/sample-data'

const highlightPoiTypeMap = {
  viewpoint: 'rest',
  restroom: 'toilet',
  water: 'water',
  cafe: 'cafe',
  danger: 'rest',
  photo: 'rest',
  note: 'rest',
} as const

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
  const courseId = Number(id)
  const router = useRouter()
  const { isAuthenticated, token } = useAuth()

  const [course, setCourse] = useState<Course | null>(null)
  const [courseLoading, setCourseLoading] = useState(Number.isFinite(courseId))
  const [courseError, setCourseError] = useState<string | null>(null)

  const [highlights, setHighlights] = useState<CourseHighlight[]>([])
  const [highlightsLoading, setHighlightsLoading] = useState(Number.isFinite(courseId))
  const [highlightsError, setHighlightsError] = useState<string | null>(null)
  const [highlightSubmitting, setHighlightSubmitting] = useState(false)

  const [meetups, setMeetups] = useState<CourseMeetup[]>([])
  const [meetupsLoading, setMeetupsLoading] = useState(true)
  const [meetupsError, setMeetupsError] = useState<string | null>(null)
  const [pendingMeetupId, setPendingMeetupId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null)

  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)

  const [defaultStartAt, setDefaultStartAt] = useState('')
  const [createForm, setCreateForm] = useState({
    title: '같이 탈 라이더 모집',
    startAt: '',
    meetingPointLat: '',
    meetingPointLon: '',
    capacity: '8',
  })

  useEffect(() => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    date.setMinutes(0, 0, 0)
    setDefaultStartAt(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16))
  }, [])

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      setCourseLoading(false)
      setCourseError('잘못된 코스 주소입니다.')
      return
    }

    setCourseLoading(true)
    setCourseError(null)
    setShareError(null)

    getCourseDetail(courseId)
      .then((response) => {
        setCourse(toCourseDetailModel(response))
      })
      .catch((error) => {
        setCourse(null)
        setCourseError(error instanceof Error ? error.message : '코스를 불러오지 못했습니다.')
      })
      .finally(() => {
        setCourseLoading(false)
      })
  }, [courseId])

  useEffect(() => {
    const nextCourse = course
    setCreateForm({
      title: nextCourse ? `${nextCourse.name} 같이 타실 분` : '같이 탈 라이더 모집',
      startAt: defaultStartAt,
      meetingPointLat: nextCourse?.path[0]?.lat?.toString() ?? '',
      meetingPointLon: nextCourse?.path[0]?.lng?.toString() ?? '',
      capacity: '8',
    })
  }, [course, defaultStartAt])

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      setHighlightsLoading(false)
      setHighlightsError('하이라이트를 조회할 수 없는 코스입니다.')
      return
    }

    setHighlightsLoading(true)
    listCourseHighlights(courseId, token)
      .then((response) => {
        setHighlights(response)
        setHighlightsError(null)
      })
      .catch((error) => {
        setHighlights([])
        setHighlightsError(error instanceof Error ? error.message : '하이라이트를 불러오지 못했습니다.')
      })
      .finally(() => {
        setHighlightsLoading(false)
      })
  }, [courseId, token])

  const loadMeetups = useCallback(async () => {
    if (!Number.isFinite(courseId)) {
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
  }, [courseId, token])

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

  const highlightPois = useMemo(
    () =>
      highlights
        .filter((highlight) => highlight.lat != null && highlight.lon != null)
        .map((highlight) => ({
          id: `highlight-${highlight.highlightId}`,
          type: highlightPoiTypeMap[highlight.type as keyof typeof highlightPoiTypeMap] ?? 'rest',
          name: highlight.title || '라이더 하이라이트',
          lat: highlight.lat as number,
          lng: highlight.lon as number,
        })),
    [highlights]
  )

  const mapPois = useMemo(() => [...(course?.pois ?? []), ...highlightPois], [course?.pois, highlightPois])

  const handleIssueShare = async () => {
    if (!token) {
      setShareError('로그인 후 공유 링크를 만들 수 있습니다.')
      router.push('/profile')
      return
    }

    if (!Number.isFinite(courseId)) {
      setShareError('공유할 수 없는 코스입니다.')
      return
    }

    try {
      setShareLoading(true)
      setShareError(null)
      const response = await issueCourseShare(courseId, token)
      const nextShareUrl = `${window.location.origin}/share/${response.shareId}`
      setShareUrl(nextShareUrl)

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(nextShareUrl)
      }
    } catch (error) {
      setShareError(error instanceof Error ? error.message : '공유 링크 발급에 실패했습니다.')
    } finally {
      setShareLoading(false)
    }
  }

  const handleCopyShareUrl = async () => {
    if (!shareUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      setShareError('링크를 복사하지 못했습니다. 수동으로 복사해주세요.')
    }
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
      router.push('/profile')
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

  const handleCreateHighlight = async (request: {
    type: 'viewpoint' | 'restroom' | 'water' | 'cafe' | 'danger' | 'photo' | 'note'
    title?: string
    note?: string
    lat: number
    lon: number
    visibility?: 'public' | 'private'
  }) => {
    if (!token) {
      throw new Error('로그인 후 하이라이트를 남길 수 있습니다.')
    }

    try {
      setHighlightSubmitting(true)
      setHighlightsError(null)
      await createCourseHighlight(courseId, request, token)
      const refreshed = await listCourseHighlights(courseId, token)
      setHighlights(refreshed)
    } finally {
      setHighlightSubmitting(false)
    }
  }

  if (!Number.isFinite(courseId)) {
    return (
      <div className="min-h-screen bg-[#f6f8f5] px-4 py-8">
        <Card className="mx-auto max-w-md rounded-[28px]">
          <CardContent className="space-y-4 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
            <div>
              <h1 className="text-xl font-bold text-slate-950">잘못된 코스 주소입니다.</h1>
              <p className="mt-2 text-sm text-slate-500">홈에서 다시 코스를 선택해주세요.</p>
            </div>
            <Link href="/">
              <Button className="w-full rounded-full">홈으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (courseLoading && !course && !courseError) {
    return (
      <div className="min-h-screen bg-[#f6f8f5] px-4 py-8">
        <Card className="mx-auto max-w-5xl rounded-[32px] border border-emerald-200/70 bg-white/90 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="h-3 w-32 rounded-full bg-slate-200" />
            <div className="h-10 w-2/3 rounded-2xl bg-slate-200" />
            <div className="h-5 w-1/2 rounded-full bg-slate-100" />
            <div className="h-72 rounded-[28px] bg-slate-100" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 rounded-[24px] bg-slate-100" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f8f5] pb-24">
      <header className="sticky top-0 z-40 border-b border-white/80 bg-[#f6f8f5]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Course</p>
            <h1 className="text-sm font-semibold text-slate-900">코스 상세</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {course ? (
          <CourseHeroPanel
            course={course}
            mapPois={mapPois}
            loading={courseLoading}
            modeLabel="MVP1 핵심 흐름"
            caption="Komoot / AllTrails 구조를 참고한 읽기 중심 레이아웃"
            actions={
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link href={`/course/${course.id}/guide`}>
                    <Button className="h-14 w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-600">
                      <Sparkles className="mr-2 h-4 w-4" />
                      코스 따라가기
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="h-14 rounded-full border-slate-300 bg-white/85 text-base font-semibold"
                    onClick={handleIssueShare}
                    disabled={shareLoading}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    {shareLoading ? '링크 발급 중...' : '공유 링크 만들기'}
                  </Button>
                </div>

                {(shareUrl || shareError) && (
                  <Card className="rounded-[24px] border-slate-200 bg-white/90">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">공유 링크</p>
                          <p className="text-xs text-slate-500">링크를 열면 읽기 전용 코스 화면으로 진입합니다.</p>
                        </div>
                        {shareUrl && (
                          <Badge className="rounded-full bg-emerald-100 text-emerald-700">복사 준비됨</Badge>
                        )}
                      </div>
                      {shareUrl && (
                        <div className="flex gap-2">
                          <Input value={shareUrl} readOnly className="h-11 rounded-full bg-slate-50" />
                          <Button variant="outline" className="rounded-full" onClick={handleCopyShareUrl}>
                            <Copy className="mr-2 h-4 w-4" />
                            복사
                          </Button>
                          <a href={shareUrl} target="_blank" rel="noreferrer">
                            <Button variant="outline" className="rounded-full">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              열기
                            </Button>
                          </a>
                        </div>
                      )}
                      {shareError && <p className="text-sm text-rose-600">{shareError}</p>}
                    </CardContent>
                  </Card>
                )}
              </div>
            }
            footer={
              <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="rounded-[24px] border-white/80 bg-white/85 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Core Notes</p>
                    <h2 className="mt-2 text-lg font-bold text-slate-950">핵심 사용 흐름</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold text-slate-400">1</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">지도를 보고 코스 길이를 판단</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold text-slate-400">2</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">따라가기로 실시간 진행 상태 확인</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold text-slate-400">3</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">공유 링크로 같은 코스를 바로 열기</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[24px] border-white/80 bg-slate-950 text-white shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">Amenity Snapshot</p>
                    <h2 className="mt-2 text-lg font-bold">경로 주변 포인트</h2>
                    <div className="mt-4 space-y-3">
                      {(course.pois.length ? course.pois.slice(0, 3) : []).map((poi) => (
                        <div key={poi.id} className="rounded-2xl bg-white/10 px-4 py-3">
                          <p className="text-sm font-semibold">{poi.name}</p>
                          <p className="text-xs text-white/60">{poiTypeLabels[poi.type]}</p>
                        </div>
                      ))}
                      {!course.pois.length && (
                        <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/70">
                          아직 상세 POI가 적습니다. 현재는 코스 길과 공유 경험을 우선 완성합니다.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            }
          />
        ) : (
          <Card className="rounded-[28px]">
            <CardContent className="space-y-4 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-950">코스를 불러오지 못했습니다.</h2>
                <p className="mt-2 text-sm text-slate-500">{courseError || '잠시 후 다시 시도해주세요.'}</p>
              </div>
              <Link href="/">
                <Button className="w-full rounded-full">홈으로 돌아가기</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {course && (
          <details className="group rounded-[28px] border border-slate-200 bg-white/85 shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">P1 Experimental</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">확장 기능 묶음</h2>
                <p className="text-sm text-slate-500">컬렉션, 하이라이트, 코스모임은 핵심 흐름을 방해하지 않도록 아래에 접어둡니다.</p>
              </div>
              <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700 group-open:bg-slate-900 group-open:text-white">
                열기
              </Badge>
            </summary>

            <div className="space-y-8 border-t border-slate-100 px-5 py-5">
              <section>
                <div className="mb-3">
                  <h3 className="font-semibold text-slate-950">여행 컬렉션</h3>
                  <p className="text-sm text-slate-500">코스를 주말 여행, 장거리 투어 컬렉션으로 묶어둘 수 있습니다.</p>
                </div>
                <CourseCollectionSheet courseId={courseId} token={token} isAuthenticated={isAuthenticated} />
              </section>

              <section>
                <div className="mb-3">
                  <h3 className="font-semibold text-slate-950">라이더 하이라이트</h3>
                  <p className="text-sm text-slate-500">현장 메모와 보급 포인트를 간단히 남길 수 있습니다.</p>
                </div>

                {highlightsError && <p className="mb-3 text-sm text-rose-600">{highlightsError}</p>}

                {highlightsLoading ? (
                  <Card>
                    <CardContent className="p-4 text-sm text-slate-500">하이라이트를 불러오는 중...</CardContent>
                  </Card>
                ) : (
                  <HighlightList highlights={highlights} />
                )}

                <div className="mt-3">
                  {isAuthenticated ? (
                    <HighlightForm
                      defaultLat={course.path[0]?.lat}
                      defaultLon={course.path[0]?.lng}
                      onSubmit={handleCreateHighlight}
                      isSubmitting={highlightSubmitting}
                    />
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="space-y-3 p-4 text-sm text-slate-500">
                        <p>하이라이트 작성은 로그인 후 사용할 수 있습니다.</p>
                        <Link href="/profile">
                          <Button variant="outline" className="w-full rounded-full">
                            프로필에서 로그인하기
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-950">코스모임</h3>
                    <p className="text-sm text-slate-500">원하면 이 코스를 함께 탈 사람들과 채팅방을 열 수 있습니다.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
                      {meetups.length}개
                    </Badge>
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
                      <p className="text-sm text-slate-500">모임 참가와 단체채팅은 카카오 로그인 후 사용할 수 있습니다.</p>
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
                        <h4 className="font-semibold text-slate-950">새 코스모임 만들기</h4>
                        <p className="text-sm text-slate-500">모임 생성 후 바로 단체채팅으로 이동합니다.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meetup-title">모임 제목</Label>
                        <Input
                          id="meetup-title"
                          value={createForm.title}
                          onChange={(event) => setCreateForm((previous) => ({ ...previous, title: event.target.value }))}
                          placeholder="예: 강변 노을 라이딩 같이 가요"
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
                        <div className="space-y-2">
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
                        <div className="space-y-2">
                          <Label htmlFor="meetup-lat">집결 위도</Label>
                          <Input
                            id="meetup-lat"
                            inputMode="decimal"
                            value={createForm.meetingPointLat}
                            onChange={(event) => setCreateForm((previous) => ({ ...previous, meetingPointLat: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="meetup-lon">집결 경도</Label>
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
                    <CardContent className="p-4 text-sm text-slate-500">코스모임 목록을 불러오는 중...</CardContent>
                  </Card>
                ) : meetups.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-sm text-slate-500">아직 열린 코스모임이 없습니다.</CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {meetups.map((meetup) => (
                      <Card key={meetup.meetupId} className="rounded-[24px] border-slate-200">
                        <CardContent className="space-y-4 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-950">{meetup.title}</p>
                              <p className="mt-1 text-xs text-slate-500">상태: {meetup.status}</p>
                            </div>
                            <Badge className={meetup.joined ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                              {meetup.joined ? '참가중' : '참가 가능'}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm text-slate-500">
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
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {meetup.joined ? (
                              <>
                                <Link href={`/meetups/${meetup.meetupId}/chat`}>
                                  <Button className="w-full rounded-full">
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    단체채팅
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  className="w-full rounded-full"
                                  onClick={() => handleLeave(meetup.meetupId)}
                                  disabled={pendingMeetupId === meetup.meetupId}
                                >
                                  나가기
                                </Button>
                              </>
                            ) : (
                              <Button
                                className="col-span-2 w-full rounded-full"
                                onClick={() => handleJoin(meetup.meetupId)}
                                disabled={!isAuthenticated || pendingMeetupId === meetup.meetupId}
                              >
                                참가하기
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </details>
        )}
      </main>
    </div>
  )
}
