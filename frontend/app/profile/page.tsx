'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Settings, ChevronRight, Route, Clock, Zap, Heart, CheckCircle2, MessageCircle, Users } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BottomNav } from '@/components/bottom-nav'
import { CourseCard } from '@/components/course-card'
import { sampleCourses, sampleRides } from '@/lib/sample-data'

export default function ProfilePage() {
  const { isAuthenticated, logout, user, authError: providerAuthError } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [loginErrorMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const loginError = new URLSearchParams(window.location.search).get('loginError')
    if (!loginError) {
      return null
    }

    const predefinedMessages: Record<string, string> = {
      invalid_response: '카카오 로그인 응답이 올바르지 않습니다.',
      missing_session: '로그인 세션 정보가 없습니다. 다시 시도해주세요.',
      invalid_session: '로그인 세션을 읽지 못했습니다. 다시 시도해주세요.',
      state_mismatch: '로그인 state 검증에 실패했습니다.',
      network: '로그인 처리 중 네트워크 오류가 발생했습니다.',
    }

    return predefinedMessages[loginError] || loginError
  })
  const [loginSuccess] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return new URLSearchParams(window.location.search).get('login') === 'success'
  })
  const totalDistance = sampleRides.reduce((sum, ride) => sum + ride.distance, 0)
  const totalTime = sampleRides.reduce((sum, ride) => sum + ride.duration, 0)
  const avgSpeed = sampleRides.reduce((sum, ride) => sum + ride.avgSpeed, 0) / sampleRides.length
  const riderName = useMemo(() => {
    if (!user) {
      return '자전거매니아'
    }
    return user.username?.trim() || `라이더 #${user.userId}`
  }, [user])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}시간 ${mins}분`
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
              {isAuthenticated ? (riderName.charAt(0) || 'R') : 'GH'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground">{riderName}</h2>
            <p className="text-sm text-muted-foreground">
              {isAuthenticated ? '카카오 로그인 완료 · 코스모임 채팅 사용 가능' : '카카오 로그인 후 코스모임 참여 가능'}
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <Card className="mb-4 overflow-hidden border-emerald-200 bg-emerald-50/70">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-700">{loginSuccess ? '카카오 로그인 성공' : '현재 로그인된 상태예요'}</p>
                  <h3 className="mt-1 text-lg font-bold text-foreground">{riderName}님, 코스모임과 채팅을 바로 사용할 수 있어요.</h3>
                  <p className="mt-1 text-sm text-muted-foreground">이제 모임 참가, 단체채팅, 기록 저장이 로그인 기준으로 동작해요.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="secondary" className="rounded-full">
                  <Link href="/explore">
                    <Users className="mr-2 h-4 w-4" />
                    코스 보러가기
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full bg-white">
                  <Link href="/meetups/1/chat">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    채팅 바로가기
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 overflow-hidden">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">{isAuthenticated ? '내 계정' : '카카오 로그인'}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAuthenticated
                    ? '로그인된 계정으로 코스모임, 단체채팅, 기록 저장을 사용할 수 있어요.'
                    : '코스모임 참가, 단체채팅, 공유 기능을 쓰려면 로그인이 필요해요.'}
                </p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-medium ${isAuthenticated ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                {isAuthenticated ? '로그인됨' : '비로그인'}
              </div>
            </div>

            {(authError || providerAuthError || loginErrorMessage) && (
              <p className="text-sm text-rose-600">{authError || providerAuthError || loginErrorMessage}</p>
            )}

            {!isAuthenticated && !loginErrorMessage && providerAuthError && (
              <p className="text-xs text-muted-foreground">토큰이 남아 있어도 서버 인증 확인에 실패하면 자동으로 로그아웃 처리돼요.</p>
            )}

            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">로그인 사용자</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{user?.username || riderName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">사용자 ID: {user?.userId}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link href="/ride">라이딩 시작</Link>
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={logout}>
                    로그아웃
                  </Button>
                </div>
              </div>
            ) : (
              <Button asChild className="w-full rounded-full bg-[#FEE500] text-black hover:bg-[#f7da00]">
                <Link href="/auth/kakao/start" onClick={() => setAuthError(null)}>
                  카카오로 로그인
                </Link>
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
