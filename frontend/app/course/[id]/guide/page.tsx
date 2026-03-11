'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Compass,
  LocateFixed,
  Navigation,
  Pause,
  Play,
  Route,
  Timer,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MapView } from '@/components/map-view'
import { getCourseDetail, toCourseDetailModel } from '@/lib/courses'
import { computePathDistanceKm, getPathProgress, isOffRoute, type GeoPoint } from '@/lib/geo'
import type { Course } from '@/lib/sample-data'

type GuideState = 'loading' | 'ready' | 'playing' | 'paused' | 'off_route' | 'finished'

const stateLabels: Record<GuideState, string> = {
  loading: '가이드 준비 중',
  ready: '출발 준비',
  playing: '가이드 진행 중',
  paused: '일시정지',
  off_route: '경로 이탈',
  finished: '가이드 종료',
}

export default function GuidePage() {
  const routeParams = useParams()
  const idParam = routeParams?.id
  const id = typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : ''
  const courseId = Number(id)
  const hasValidCourseId = Number.isFinite(courseId)

  const [course, setCourse] = useState<Course | null>(null)
  const [courseError, setCourseError] = useState<string | null>(null)
  const [guideState, setGuideState] = useState<GuideState>('loading')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null)
  const [distanceFromPathMeters, setDistanceFromPathMeters] = useState<number | null>(null)
  const [traveledDistanceKm, setTraveledDistanceKm] = useState(0)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const offRouteCountRef = useRef(0)

  useEffect(() => {
    if (!hasValidCourseId) {
      return
    }

    getCourseDetail(courseId)
      .then((response) => {
        setCourse(toCourseDetailModel(response))
        setGuideState('ready')
      })
      .catch((error) => {
        setCourse(null)
        setGuideState('finished')
        setCourseError(error instanceof Error ? error.message : '코스를 불러오지 못했습니다.')
      })
  }, [courseId, hasValidCourseId])

  useEffect(() => {
    if (guideState !== 'playing' && guideState !== 'off_route') {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    if (!course) {
      return
    }

    if (!navigator.geolocation) {
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        const snapshot = getPathProgress(course.path, nextLocation)
        setCurrentLocation(nextLocation)
        setTraveledDistanceKm(snapshot.traveledDistanceKm)
        setProgress(snapshot.progressPercent)
        setDistanceFromPathMeters(snapshot.distanceFromPathMeters)
        setLocationMessage('실제 현재 위치 기준으로 가이드를 업데이트하고 있습니다.')

        if (snapshot.progressPercent >= 99.5) {
          offRouteCountRef.current = 0
          setGuideState('finished')
          return
        }

        // POL-010: 30m 초과가 3회 연속 관측되면 off_route로 본다.
        if (isOffRoute(snapshot.distanceFromPathMeters, 30)) {
          offRouteCountRef.current += 1
          if (offRouteCountRef.current >= 3) {
            setGuideState('off_route')
            return
          }
        } else {
          offRouteCountRef.current = 0
          if (guideState !== 'playing') {
            setGuideState('playing')
          }
        }
      },
      (error) => {
        // POL-009: 위치 권한이 없더라도 읽기 전용 가이드 상태로 복귀한다.
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage('위치 권한이 없어 읽기 전용 가이드 상태로 전환했습니다.')
        } else {
          setLocationMessage(error.message || '현재 위치를 가져오지 못했습니다.')
        }
        setGuideState('ready')
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [course, guideState])

  useEffect(() => {
    if (guideState !== 'playing' && guideState !== 'off_route') {
      return
    }

    const timer = window.setInterval(() => {
      setElapsedTime((previous) => previous + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [guideState])

  const totalPathDistanceKm = useMemo(() => computePathDistanceKm(course?.path ?? []), [course?.path])
  const remainingDistanceKm = useMemo(
    () => Math.max((totalPathDistanceKm || course?.distance || 0) - traveledDistanceKm, 0),
    [course?.distance, totalPathDistanceKm, traveledDistanceKm]
  )
  const nextPoi = useMemo(() => {
    if (!course?.pois.length) {
      return null
    }

    const nextIndex = Math.min(course.pois.length - 1, Math.floor((progress / 100) * course.pois.length))
    return course.pois[nextIndex]
  }, [course?.pois, progress])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    if (!navigator.geolocation) {
      setLocationMessage('브라우저가 위치 안내 기능을 지원하지 않습니다.')
      return
    }
    setLocationMessage('현재 위치 권한을 확인하고 있습니다.')
    setGuideState('playing')
  }

  const handlePause = () => setGuideState('paused')
  const handleResume = () => setGuideState('playing')
  const handleFinish = () => setGuideState('finished')

  if (guideState === 'loading' && !courseError) {
    return (
      <div className="min-h-screen bg-[#08111f] px-4 py-8">
        <Card className="mx-auto max-w-5xl rounded-[28px] border-white/10 bg-[#0e1a2f] text-white">
          <CardContent className="space-y-4 p-6">
            <div className="h-3 w-24 rounded-full bg-white/10" />
            <div className="h-8 w-1/2 rounded-2xl bg-white/10" />
            <div className="h-[52vh] rounded-[28px] bg-white/5" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasValidCourseId) {
    return (
      <div className="min-h-screen bg-[#08111f] px-4 py-8">
        <Card className="mx-auto max-w-md rounded-[28px] border-white/10 bg-[#0e1a2f] text-white">
          <CardContent className="space-y-4 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-rose-300" />
            <div>
              <h1 className="text-xl font-bold">가이드를 시작할 수 없습니다.</h1>
              <p className="mt-2 text-sm text-white/65">잘못된 코스 주소입니다.</p>
            </div>
            <Link href="/">
              <Button className="w-full rounded-full">홈으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-[#f6f8f5] px-4 py-8">
        <Card className="mx-auto max-w-md rounded-[28px]">
          <CardContent className="space-y-4 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
            <div>
              <h1 className="text-xl font-bold text-slate-950">가이드를 시작할 수 없습니다.</h1>
              <p className="mt-2 text-sm text-slate-500">{courseError || '코스 정보를 확인한 뒤 다시 시도해주세요.'}</p>
            </div>
            <Link href="/">
              <Button className="w-full rounded-full">홈으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08111f] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08111f]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href={`/course/${course.id}`}>
            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Guide</p>
            <h1 className="text-sm font-semibold">{course.name}</h1>
          </div>

          <Badge className="rounded-full bg-emerald-500/20 text-emerald-200">{stateLabels[guideState]}</Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0e1a2f] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.7)]">
          <MapView
            className="h-[55vh] min-h-[420px] rounded-none border-none bg-transparent"
            showRoute
            routePath={course.path}
            pois={course.pois}
            showCurrentLocation
            currentLocation={currentLocation}
            center={currentLocation}
            progress={progress}
            focusCurrentLocation
            level={4}
            fitBoundsPadding={{ top: 88, right: 28, bottom: 120, left: 28 }}
          />

          <div className="absolute left-4 right-4 top-4 flex flex-col gap-3">
            <Card className="border-white/10 bg-slate-950/80 text-white backdrop-blur">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Live Progress</p>
                  <p className="mt-1 text-lg font-bold">{progress.toFixed(0)}% 진행</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/50">경로와의 거리</p>
                  <p className="text-lg font-bold">{distanceFromPathMeters != null ? `${Math.round(distanceFromPathMeters)}m` : '-'}</p>
                </div>
              </CardContent>
            </Card>

            {guideState === 'off_route' && (
              <Card className="border-amber-400/20 bg-amber-500/10 text-amber-50 backdrop-blur">
                <CardContent className="flex items-start gap-3 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
                  <div>
                    <p className="font-semibold">경로 이탈 감지</p>
                    <p className="text-sm text-amber-100/80">현재 위치가 기준 경로에서 30m 이상 벗어난 상태가 연속 감지됐습니다. 지도를 다시 확인해 주세요.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <Card className="rounded-[28px] border-white/10 bg-white/95 text-slate-950 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.5)]">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trip Control</p>
                <h2 className="mt-2 text-xl font-black">실시간 따라가기</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Komoot의 집중형 가이드와 Navmii의 HUD 구성을 참고해, 화면은 현재 위치와 남은 흐름만 보여주도록 정리했습니다.
                </p>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <Route className="mb-2 h-4 w-4 text-emerald-600" />
                  <p className="text-xl font-black">{traveledDistanceKm.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">km 진행</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <Timer className="mb-2 h-4 w-4 text-amber-500" />
                  <p className="text-xl font-black">{formatTime(elapsedTime)}</p>
                  <p className="text-xs text-slate-500">경과 시간</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <Compass className="mb-2 h-4 w-4 text-sky-600" />
                  <p className="text-xl font-black">{remainingDistanceKm.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">km 남음</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Next Focus</p>
                <p className="mt-2 text-base font-semibold">{nextPoi?.name || '코스 중심을 유지하며 진행하세요.'}</p>
                <p className="mt-1 text-sm text-white/65">
                  {nextPoi ? '다음 주요 포인트가 가까워지면 위치와 남은 거리가 자동으로 업데이트됩니다.' : 'POI 정보가 부족한 코스는 경로와 오프루트 상태를 중심으로 안내합니다.'}
                </p>
              </div>

              {locationMessage && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <LocateFixed className="mr-2 inline h-4 w-4" />
                  {locationMessage}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-white/10 bg-[#0e1a2f] text-white">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Guide State</p>
                  <p className="mt-1 text-lg font-bold">{stateLabels[guideState]}</p>
                </div>
                <Badge className="rounded-full bg-white/10 text-white">{course.distance.toFixed(1)}km 코스</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {guideState === 'playing' || guideState === 'off_route' ? (
                  <Button variant="outline" className="h-14 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={handlePause}>
                    <Pause className="mr-2 h-4 w-4" />
                    일시정지
                  </Button>
                ) : (
                  <Button className="h-14 rounded-full bg-emerald-500 text-white hover:bg-emerald-600" onClick={guideState === 'finished' ? handleStart : guideState === 'paused' ? handleResume : handleStart}>
                    <Play className="mr-2 h-4 w-4" />
                    {guideState === 'paused' ? '다시 시작' : guideState === 'finished' ? '다시 따라가기' : '가이드 시작'}
                  </Button>
                )}

                <Link href={`/course/${course.id}`}>
                  <Button variant="outline" className="h-14 w-full rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={handleFinish}>
                    <Navigation className="mr-2 h-4 w-4" />
                    종료
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
