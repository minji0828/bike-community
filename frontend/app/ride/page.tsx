'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Square, Save, LoaderCircle, MapPin } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BottomNav } from '@/components/bottom-nav'
import { MapView } from '@/components/map-view'
import { getOrCreateDeviceUuid } from '@/lib/device'
import { haversineDistanceKm, shouldAppendPoint, type GeoPoint } from '@/lib/geo'
import { createCourseFromRiding, createRiding } from '@/lib/ridings'

type RideState = 'idle' | 'recording' | 'paused' | 'finished'

type RidePoint = GeoPoint & {
  timestamp: number
}

export default function RidePage() {
  const router = useRouter()
  const { token } = useAuth()
  const watchIdRef = useRef<number | null>(null)
  const [rideState, setRideState] = useState<RideState>('idle')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [distance, setDistance] = useState(0)
  const [path, setPath] = useState<RidePoint[]>([])
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null)
  const [rideError, setRideError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  useEffect(() => {
    if (rideState !== 'recording') {
      return
    }

    const timer = window.setInterval(() => {
      setElapsedTime((previous) => previous + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [rideState])

  useEffect(() => {
    if (rideState !== 'recording') {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    if (!navigator.geolocation) {
      setRideError('브라우저가 위치 기록 기능을 지원하지 않습니다.')
      setRideState('paused')
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
        }

        setCurrentLocation({
          lat: nextPoint.lat,
          lng: nextPoint.lng,
        })
        setRideError(null)

        setPath((previous) => {
          const last = previous.at(-1) ?? null
          if (!shouldAppendPoint(last, nextPoint, 5)) {
            return previous
          }

          if (last) {
            setDistance((current) => current + haversineDistanceKm(last, nextPoint))
          }

          return [...previous, nextPoint]
        })
      },
      (error) => {
        setRideError(error.message || '현재 위치를 가져오지 못했습니다.')
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
  }, [rideState])

  useEffect(() => {
    if (rideState !== 'idle') {
      return
    }

    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        // noop
      }
    )
  }, [rideState])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const avgSpeed = useMemo(() => {
    if (elapsedTime <= 0) {
      return '0.0'
    }

    return (distance / (elapsedTime / 3600)).toFixed(1)
  }, [distance, elapsedTime])

  const resetRide = () => {
    setRideState('idle')
    setElapsedTime(0)
    setDistance(0)
    setPath([])
    setRideError(null)
    setIsSaving(false)
  }

  const handleStart = () => {
    setPath([])
    setDistance(0)
    setElapsedTime(0)
    setRideError(null)
    setRideState('recording')
  }

  const handlePause = () => setRideState('paused')
  const handleResume = () => setRideState('recording')
  const handleStop = () => setRideState('finished')

  const handleSave = async () => {
    if (path.length < 2) {
      setRideError('코스로 저장하려면 최소 2개 이상의 위치 포인트가 필요해요. 조금 더 이동한 뒤 다시 시도해주세요.')
      return
    }

    if (!token) {
      setRideError('로그인 후 라이딩을 저장할 수 있습니다.')
      router.push('/profile')
      return
    }

    try {
      setIsSaving(true)
      setRideError(null)

      const startedAt = path[0]?.timestamp ? new Date(path[0].timestamp) : new Date()
      const title = `라이딩 ${startedAt.getMonth() + 1}/${startedAt.getDate()} ${startedAt.getHours()}:${startedAt.getMinutes().toString().padStart(2, '0')}`

      const riding = await createRiding({
        deviceUuid: getOrCreateDeviceUuid(),
        title,
        totalDistance: Number(distance.toFixed(3)),
        totalTime: elapsedTime,
        avgSpeed: Number(avgSpeed),
        path: path.map((point) => ({
          lat: point.lat,
          lon: point.lng,
        })),
      }, token)

      const course = await createCourseFromRiding({
        ridingId: riding.ridingId,
        title,
        visibility: 'PUBLIC',
        sourceType: 'UGC',
        description: '내 라이딩 기록으로 만든 코스',
        tags: ['라이딩기록', '자동생성'],
      }, token)

      resetRide()
      router.push(`/course/${course.courseId}`)
    } catch (error) {
      setRideError(error instanceof Error ? error.message : '라이딩 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-center px-4">
          <h1 className="font-semibold text-foreground">
            {rideState === 'idle' && '라이딩 시작하기'}
            {rideState === 'recording' && '라이딩 기록 중'}
            {rideState === 'paused' && '라이딩 일시정지'}
            {rideState === 'finished' && '라이딩 저장 준비'}
          </h1>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <MapView
          className="h-64 rounded-none"
          showCurrentLocation
          currentLocation={currentLocation}
          center={currentLocation}
          showRoute={path.length > 1}
          routePath={path}
          fitBoundsPadding={{ top: 40, right: 24, bottom: 40, left: 24 }}
        />

        <div className="flex-1 p-4">
          {rideState === 'idle' ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
                <Play className="h-12 w-12 text-white" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">라이딩을 기록해보세요</h2>
              <p className="mb-3 text-muted-foreground">실제 GPS 경로를 저장하고 끝나면 바로 코스로 만들 수 있어요.</p>
              {currentLocation && (
                <p className="mb-8 inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  현재 위치 확인됨
                </p>
              )}
              <Button
                size="lg"
                className="h-16 w-56 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-lg font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-600"
                onClick={handleStart}
              >
                <Play className="mr-2 h-6 w-6" />
                기록 시작
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card className="col-span-3">
                  <CardContent className="flex flex-col items-center p-6">
                    <span className="text-5xl font-bold tabular-nums text-foreground">{formatTime(elapsedTime)}</span>
                    <span className="mt-2 text-sm text-muted-foreground">경과 시간</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center p-4">
                    <span className="text-2xl font-bold text-foreground">{distance.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">km</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center p-4">
                    <span className="text-2xl font-bold text-foreground">{avgSpeed}</span>
                    <span className="text-xs text-muted-foreground">km/h</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center p-4">
                    <span className="text-2xl font-bold text-foreground">{path.length}</span>
                    <span className="text-xs text-muted-foreground">포인트</span>
                  </CardContent>
                </Card>
              </div>

              {rideError && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{rideError}</p>}

              {rideState === 'finished' ? (
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">저장 후 곧바로 코스 상세로 이동합니다.</p>
                  <div className="flex justify-center gap-4">
                    <Button size="lg" variant="outline" className="h-14 rounded-full px-8" onClick={resetRide} disabled={isSaving}>
                      삭제
                    </Button>
                    <Button
                      size="lg"
                      className="h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 hover:from-emerald-600 hover:to-teal-600"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                      저장하기
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-16 w-16 rounded-full"
                    onClick={rideState === 'recording' ? handlePause : handleResume}
                  >
                    {rideState === 'recording' ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                  </Button>
                  <Button size="lg" variant="destructive" className="h-16 w-16 rounded-full" onClick={handleStop}>
                    <Square className="h-8 w-8" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
