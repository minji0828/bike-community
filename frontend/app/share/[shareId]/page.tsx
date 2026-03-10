'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Compass, LockKeyhole, Navigation } from 'lucide-react'
import { CourseHeroPanel } from '@/components/course/course-hero-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getPublicCourse, toCourseDetailModel } from '@/lib/courses'
import type { Course } from '@/lib/sample-data'

export default function SharedCoursePage() {
  const routeParams = useParams()
  const shareIdParam = routeParams?.shareId
  const shareId = typeof shareIdParam === 'string' ? shareIdParam : Array.isArray(shareIdParam) ? shareIdParam[0] : ''
  const hasValidShareId = shareId.length > 0

  const [course, setCourse] = useState<Course | null>(null)
  const [error, setError] = useState<string | null>(null)
  const loading = hasValidShareId && !course && !error

  useEffect(() => {
    if (!hasValidShareId) {
      return
    }

    getPublicCourse(shareId)
      .then((response) => {
        setCourse(toCourseDetailModel(response))
      })
      .catch((nextError) => {
        setCourse(null)
        setError(nextError instanceof Error ? nextError.message : '공유 코스를 불러오지 못했습니다.')
      })
  }, [hasValidShareId, shareId])

  return (
    <div className="min-h-screen bg-[#f6f8f5] pb-16">
      <header className="sticky top-0 z-40 border-b border-white/80 bg-[#f6f8f5]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Shared Route</p>
            <h1 className="text-sm font-semibold text-slate-900">공유 코스</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {!hasValidShareId ? (
          <Card className="rounded-[28px]">
            <CardContent className="space-y-4 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-950">잘못된 공유 링크입니다.</h2>
                <p className="mt-2 text-sm text-slate-500">링크 주소를 다시 확인해주세요.</p>
              </div>
              <Link href="/">
                <Button className="w-full rounded-full">홈으로 돌아가기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : loading && !course && !error ? (
          <Card className="rounded-[28px] border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="h-3 w-28 rounded-full bg-slate-200" />
              <div className="h-10 w-2/3 rounded-2xl bg-slate-200" />
              <div className="h-5 w-1/2 rounded-full bg-slate-100" />
              <div className="h-72 rounded-[28px] bg-slate-100" />
            </CardContent>
          </Card>
        ) : course ? (
          <>
            <CourseHeroPanel
              course={course}
              loading={loading}
              modeLabel="Read Only"
              caption="공유 링크로 들어온 코스는 읽기 전용으로 열립니다"
              actions={
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link href={`/course/${course.id}/guide`}>
                    <Button className="h-14 w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-600">
                      <Navigation className="mr-2 h-4 w-4" />
                      이 코스 따라가기
                    </Button>
                  </Link>
                  <Link href={`/course/${course.id}`}>
                    <Button variant="outline" className="h-14 w-full rounded-full border-slate-300 bg-white/85 text-base font-semibold">
                      <Compass className="mr-2 h-4 w-4" />
                      상세 화면으로 열기
                    </Button>
                  </Link>
                </div>
              }
              footer={
                <Card className="rounded-[24px] border-white/80 bg-slate-950 text-white shadow-sm">
                  <CardContent className="grid gap-4 p-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <LockKeyhole className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">읽기 전용 공유 모드</p>
                        <p className="text-xs text-white/60">링크로 들어온 사용자는 코스를 읽고 가이드만 시작할 수 있습니다.</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/70">
                      로그인 상태와 소유권이 확인된 경우에만 편집, 공유 재발급, 기록 저장 같은 쓰기 기능이 열립니다.
                    </div>
                  </CardContent>
                </Card>
              }
            />

            <Card className="rounded-[28px] border-slate-200 bg-white/85 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Share Context</p>
                <h2 className="mt-2 text-lg font-bold text-slate-950">공유 링크에서 확인할 포인트</h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">코스 난이도와 거리</p>
                    <p className="mt-1 text-sm text-slate-500">출발 전에 체력과 시간을 판단할 수 있게 상단 카드에 먼저 배치합니다.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">주의 구간 메모</p>
                    <p className="mt-1 text-sm text-slate-500">공유받은 코스를 처음 타더라도 위험 요소를 바로 읽을 수 있어야 합니다.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">즉시 따라가기</p>
                    <p className="mt-1 text-sm text-slate-500">앱 내부 다른 화면을 거치지 않고 바로 가이드 화면으로 이동할 수 있어야 합니다.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="rounded-[28px]">
            <CardContent className="space-y-4 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-950">공유 코스를 불러오지 못했습니다.</h2>
                <p className="mt-2 text-sm text-slate-500">{error || '비공개 코스이거나 만료된 링크일 수 있습니다.'}</p>
              </div>
              <Link href="/">
                <Button className="w-full rounded-full">홈으로 돌아가기</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
