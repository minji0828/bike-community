'use client'

import { useMemo, useState } from 'react'
import { Settings, ChevronRight, Route, Clock, Zap, Heart } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BottomNav } from '@/components/bottom-nav'
import { CourseCard } from '@/components/course-card'
import { sampleCourses, sampleRides } from '@/lib/sample-data'

export default function ProfilePage() {
  const { isAuthenticated, isLoading, startKakaoLogin, logout, user } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [isStartingLogin, setIsStartingLogin] = useState(false)
  const totalDistance = sampleRides.reduce((sum, ride) => sum + ride.distance, 0)
  const totalTime = sampleRides.reduce((sum, ride) => sum + ride.duration, 0)
  const avgSpeed = sampleRides.reduce((sum, ride) => sum + ride.avgSpeed, 0) / sampleRides.length
  const riderName = useMemo(() => (user ? `라이더 #${user.userId}` : '자전거매니아'), [user])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}시간 ${mins}분`
  }

  const handleKakaoLogin = async () => {
    if (isStartingLogin) {
      return
    }

    try {
      setIsStartingLogin(true)
      setAuthError(null)
      await startKakaoLogin()
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '카카오 로그인을 시작하지 못했습니다.')
      setIsStartingLogin(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <h1 className="font-semibold text-foreground">마이페이지</h1>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-xl font-bold text-white">
              {isAuthenticated ? 'KO' : 'GH'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground">{riderName}</h2>
            <p className="text-sm text-muted-foreground">
              {isAuthenticated ? '카카오 로그인 완료 · 코스모임 채팅 사용 가능' : '카카오 로그인 후 코스모임 참여 가능'}
            </p>
          </div>
        </div>

        <Card className="mb-6 overflow-hidden">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">카카오 로그인</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  코스모임 참가, 단체채팅, 공유 기능을 쓰려면 로그인이 필요해요.
                </p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-medium ${isAuthenticated ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                {isAuthenticated ? '로그인됨' : '비로그인'}
              </div>
            </div>

            {authError && <p className="text-sm text-rose-600">{authError}</p>}

            {isAuthenticated ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  현재 사용자 ID: <span className="font-semibold text-foreground">{user?.userId}</span>
                </p>
                <Button variant="outline" className="w-full rounded-full" onClick={logout}>
                  로그아웃
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                className="w-full rounded-full bg-[#FEE500] text-black hover:bg-[#f7da00]"
                onClick={handleKakaoLogin}
                onTouchEnd={handleKakaoLogin}
              >
                {isStartingLogin ? '카카오 로그인으로 이동 중...' : '카카오로 로그인'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="mb-4 font-semibold text-foreground">총 라이딩 통계</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Route className="h-6 w-6 text-primary" />
                </div>
                <span className="text-lg font-bold text-foreground">{totalDistance.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">km</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <span className="text-lg font-bold text-foreground">{Math.floor(totalTime / 3600)}</span>
                <span className="text-xs text-muted-foreground">시간</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <span className="text-lg font-bold text-foreground">{avgSpeed.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">km/h</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <p className="font-medium text-foreground">{ride.courseName || '자유 라이딩'}</p>
                    <p className="text-sm text-muted-foreground">
                      {ride.date} · {ride.distance}km · {formatDuration(ride.duration)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

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
