'use client'

import { Settings, ChevronRight, Route, Clock, Zap, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BottomNav } from '@/components/bottom-nav'
import { CourseCard } from '@/components/course-card'
import { sampleCourses, sampleRides } from '@/lib/sample-data'

export default function ProfilePage() {
  const totalDistance = sampleRides.reduce((sum, ride) => sum + ride.distance, 0)
  const totalTime = sampleRides.reduce((sum, ride) => sum + ride.duration, 0)
  const avgSpeed =
    sampleRides.reduce((sum, ride) => sum + ride.avgSpeed, 0) / sampleRides.length

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}시간 ${mins}분`
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <h1 className="font-semibold text-foreground">마이페이지</h1>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Profile */}
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-xl font-bold text-white">
              JH
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground">자전거매니아</h2>
            <p className="text-sm text-muted-foreground">
              가입일: 2024년 1월 15일
            </p>
          </div>
        </div>

        {/* Stats */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="mb-4 font-semibold text-foreground">총 라이딩 통계</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Route className="h-6 w-6 text-primary" />
                </div>
                <span className="text-lg font-bold text-foreground">
                  {totalDistance.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">km</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <span className="text-lg font-bold text-foreground">
                  {Math.floor(totalTime / 3600)}
                </span>
                <span className="text-xs text-muted-foreground">시간</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <span className="text-lg font-bold text-foreground">
                  {avgSpeed.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">km/h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Rides */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">최근 라이딩</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              전체보기
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {sampleRides.map((ride) => (
              <Card key={ride.id}>
                <CardContent className="flex items-center gap-4 p-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400">
                    <Route className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {ride.courseName || '자유 라이딩'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ride.date} · {ride.distance}km ·{' '}
                      {formatDuration(ride.duration)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Saved Courses */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              <Heart className="mr-1 inline h-4 w-4 text-primary" />
              저장한 코스
            </h3>
            <Button variant="ghost" size="sm" className="text-primary">
              전체보기
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {sampleCourses.slice(0, 2).map((course) => (
              <CourseCard key={course.id} course={course} variant="compact" />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
