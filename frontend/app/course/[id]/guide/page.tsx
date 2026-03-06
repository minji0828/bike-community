'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Play, Pause, AlertTriangle, MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MapView } from '@/components/map-view'
import { getCourseDetail, toCourseDetailModel } from '@/lib/courses'
import { sampleCourses } from '@/lib/sample-data'

export default function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const courseId = Number(id)
  const [course, setCourse] = useState(sampleCourses.find((c) => c.id === id) || sampleCourses[0])

  const [isPlaying, setIsPlaying] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const isOffRoute = progress > 30 && progress < 40

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      return
    }

    getCourseDetail(courseId)
      .then((response) => {
        setCourse(toCourseDetailModel(response))
      })
      .catch(() => {
        setCourse(sampleCourses.find((candidate) => candidate.id === id) || sampleCourses[0])
      })
  }, [courseId, id])

  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
      setProgress((prev) => Math.min(prev + 0.5, 100))
    }, 1000)
    return () => clearInterval(timer)
  }, [isPlaying])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentDistance = ((progress / 100) * course.distance).toFixed(1)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link href={`/course/${course.id}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-foreground">{course.name}</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="relative flex-1 px-3 pt-3">
        <MapView
          className="h-full min-h-[300px] rounded-3xl"
          showRoute
          routePath={course.path}
          pois={course.pois}
          showCurrentLocation
          progress={progress}
          fitBoundsPadding={{ top: 124, right: 28, bottom: 132, left: 28 }}
        />

        {isOffRoute && (
          <div className="absolute left-4 right-4 top-4">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-800">경로 이탈 감지</p>
                  <p className="text-sm text-amber-600">경로에서 벗어났습니다. 다시 코스 방향을 확인해볼까요?</p>
                </div>
                <Button size="sm" className="rounded-full bg-amber-500 hover:bg-amber-600">
                  코스 보기
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">다음: {course.pois[0]?.name || '다음 체크포인트'}</span>
                </div>
                <span className="text-sm text-muted-foreground">약 500m 앞</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-t border-border bg-card">
        <div className="mx-auto max-w-md p-4">
          <div className="mb-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{currentDistance}</p>
              <p className="text-xs text-muted-foreground">km</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatTime(elapsedTime)}</p>
              <p className="text-xs text-muted-foreground">경과 시간</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{progress.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">진행률</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button size="lg" variant="outline" className="h-14 w-14 rounded-full" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Link href={`/course/${course.id}`}>
              <Button size="lg" variant="destructive" className="h-14 rounded-full px-8">
                종료
              </Button>
            </Link>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {(course.pois.length ? course.pois : [{ id: 'route-summary', name: '경로 중심 안내', lat: 0, lng: 0, type: 'rest' as const }]).map((poi) => (
              <Card key={poi.id} className="flex-shrink-0">
                <CardContent className="flex items-center gap-2 p-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{poi.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
