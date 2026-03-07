'use client'

import { AlertTriangle, Camera, Coffee, Droplets, Eye, MapPin, NotebookPen, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { CourseHighlight } from '@/lib/highlights'

const iconMap = {
  viewpoint: Eye,
  restroom: MapPin,
  water: Droplets,
  cafe: Coffee,
  danger: ShieldAlert,
  photo: Camera,
  note: NotebookPen,
} as const

const labelMap = {
  viewpoint: '전망 포인트',
  restroom: '화장실',
  water: '보급/음수',
  cafe: '카페',
  danger: '주의 구간',
  photo: '사진 스팟',
  note: '현장 메모',
} as const

export function HighlightList({ highlights }: { highlights: CourseHighlight[] }) {
  if (highlights.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground">
          아직 등록된 하이라이트가 없어요. 라이더가 직접 전망/보급/주의 포인트를 남기면 여기에 보여요.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {highlights.map((highlight) => {
        const Icon = iconMap[highlight.type as keyof typeof iconMap] ?? AlertTriangle
        const label = labelMap[highlight.type as keyof typeof labelMap] ?? highlight.type

        return (
          <Card key={highlight.highlightId}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{highlight.title || label}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{label}</span>
                    {highlight.visibility === 'private' && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">나만 보기</span>
                    )}
                  </div>
                  {highlight.note && <p className="mt-1 text-sm text-muted-foreground">{highlight.note}</p>}
                </div>
              </div>

              {highlight.lat != null && highlight.lon != null && (
                <p className="text-xs text-muted-foreground">
                  좌표 {highlight.lat.toFixed(4)}, {highlight.lon.toFixed(4)}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
