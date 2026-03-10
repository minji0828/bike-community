'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, Globe2, MapPinned, Route, ShieldCheck, Timer, Undo2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MapView } from '@/components/map-view'
import type { Course, POI } from '@/lib/sample-data'

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

const visibilityLabels: Record<string, string> = {
  public: '공개',
  unlisted: '링크 공유',
  private: '비공개',
}

const sourceLabels: Record<string, string> = {
  curated: '큐레이션',
  ugc: '사용자 생성',
  import: '가져온 코스',
}

const verifiedLabels: Record<string, string> = {
  curated: '검수 완료',
  community: '커뮤니티 확인',
  unverified: '미검증',
}

type CourseHeroPanelProps = {
  course: Course
  mapPois?: POI[]
  loading?: boolean
  modeLabel: string
  caption: string
  actions?: ReactNode
  footer?: ReactNode
}

export function CourseHeroPanel({
  course,
  mapPois = course.pois,
  loading = false,
  modeLabel,
  caption,
  actions,
  footer,
}: CourseHeroPanelProps) {
  const warningPreview = course.warnings?.slice(0, 2) ?? []

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_44%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(245,252,248,0.98))] p-5 shadow-[0_18px_60px_-28px_rgba(15,118,110,0.45)]">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="absolute left-6 top-12 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl" />

      <div className="relative">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge className={difficultyColors[course.difficulty]}>{difficultyLabels[course.difficulty]}</Badge>
          <Badge variant="secondary" className="rounded-full bg-white/80">
            {modeLabel}
          </Badge>
          {course.visibility && (
            <Badge variant="outline" className="rounded-full bg-white/80">
              <Globe2 className="mr-1 h-3.5 w-3.5" />
              {visibilityLabels[course.visibility] ?? course.visibility}
            </Badge>
          )}
          {course.verifiedStatus && (
            <Badge variant="outline" className="rounded-full bg-white/80">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              {verifiedLabels[course.verifiedStatus] ?? course.verifiedStatus}
            </Badge>
          )}
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700/80">{caption}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950">{course.name}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{course.description}</p>
          {loading && <p className="mt-2 text-xs text-slate-500">실제 코스 데이터를 확인하는 중...</p>}
        </div>

        {!!course.tags?.length && (
          <div className="mb-5 flex flex-wrap gap-2">
            {course.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mb-5 overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Route Preview</p>
              <p className="text-sm font-medium text-slate-700">길의 리듬과 휴식 포인트를 먼저 확인하세요.</p>
            </div>
            {course.sourceType && (
              <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
                {sourceLabels[course.sourceType] ?? course.sourceType}
              </Badge>
            )}
          </div>

          <MapView
            className="h-72 rounded-none border-none bg-transparent"
            showRoute
            routePath={course.path}
            pois={mapPois}
            showCurrentLocation={false}
            fitBoundsPadding={{ top: 72, right: 24, bottom: 32, left: 24 }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="rounded-[24px] border-white/80 bg-white/85 shadow-sm">
            <CardContent className="p-4">
              <Route className="mb-3 h-5 w-5 text-emerald-600" />
              <p className="text-2xl font-black text-slate-950">{course.distance.toFixed(1)}</p>
              <p className="text-xs text-slate-500">km 거리</p>
            </CardContent>
          </Card>
          <Card className="rounded-[24px] border-white/80 bg-white/85 shadow-sm">
            <CardContent className="p-4">
              <Timer className="mb-3 h-5 w-5 text-amber-500" />
              <p className="text-2xl font-black text-slate-950">{course.estimatedTime}</p>
              <p className="text-xs text-slate-500">예상 분</p>
            </CardContent>
          </Card>
          <Card className="rounded-[24px] border-white/80 bg-white/85 shadow-sm">
            <CardContent className="p-4">
              <MapPinned className="mb-3 h-5 w-5 text-sky-600" />
              <p className="text-2xl font-black text-slate-950">{course.toiletCount}</p>
              <p className="text-xs text-slate-500">화장실</p>
            </CardContent>
          </Card>
          <Card className="rounded-[24px] border-white/80 bg-white/85 shadow-sm">
            <CardContent className="p-4">
              <Undo2 className="mb-3 h-5 w-5 text-violet-600" />
              <p className="text-2xl font-black text-slate-950">{course.loop ? 'Loop' : 'One way'}</p>
              <p className="text-xs text-slate-500">코스 형태</p>
            </CardContent>
          </Card>
        </div>

        {!!warningPreview.length && (
          <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50/90 p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-900">출발 전 체크할 주의 구간</p>
            </div>
            <div className="space-y-2">
              {warningPreview.map((warning, index) => (
                <div key={`${warning.type}-${warning.lat}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl bg-white/80 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium capitalize text-slate-800">{warning.type}</p>
                    <p className="text-xs text-slate-500">{warning.note || '현장 상황을 확인하며 천천히 진입하세요.'}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full bg-white text-amber-700">
                    Lv.{warning.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {actions && <div className="mt-5">{actions}</div>}
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </section>
  )
}
