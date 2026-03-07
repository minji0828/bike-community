'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CreateCourseHighlightRequest } from '@/lib/highlights'

const highlightTypes: Array<{ value: CreateCourseHighlightRequest['type']; label: string }> = [
  { value: 'viewpoint', label: '전망 포인트' },
  { value: 'restroom', label: '화장실' },
  { value: 'water', label: '보급/음수' },
  { value: 'cafe', label: '카페' },
  { value: 'danger', label: '주의 구간' },
  { value: 'photo', label: '사진 스팟' },
  { value: 'note', label: '현장 메모' },
]

export function HighlightForm({
  defaultLat,
  defaultLon,
  onSubmit,
  isSubmitting,
}: {
  defaultLat?: number
  defaultLon?: number
  onSubmit: (request: CreateCourseHighlightRequest) => Promise<void>
  isSubmitting: boolean
}) {
  const [form, setForm] = useState({
    type: 'viewpoint' as CreateCourseHighlightRequest['type'],
    title: '',
    note: '',
    lat: defaultLat?.toString() ?? '',
    lon: defaultLon?.toString() ?? '',
    visibility: 'public' as 'public' | 'private',
  })
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => form.lat.trim() && form.lon.trim() && (form.title.trim() || form.note.trim()), [form])

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div>
          <h4 className="font-semibold text-foreground">새 하이라이트 남기기</h4>
          <p className="text-sm text-muted-foreground">전망, 보급, 주의 구간 같은 현장 포인트를 남길 수 있어요.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="highlight-type">유형</Label>
          <select
            id="highlight-type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.type}
            onChange={(event) => setForm((previous) => ({ ...previous, type: event.target.value as CreateCourseHighlightRequest['type'] }))}
          >
            {highlightTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="highlight-title">제목</Label>
          <Input
            id="highlight-title"
            value={form.title}
            onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
            placeholder="예: 정상 전망 좋아요"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="highlight-note">메모</Label>
          <textarea
            id="highlight-note"
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.note}
            onChange={(event) => setForm((previous) => ({ ...previous, note: event.target.value }))}
            placeholder="초보도 쉬기 좋고 사진 찍기 좋아요"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="highlight-lat">위도</Label>
            <Input
              id="highlight-lat"
              inputMode="decimal"
              value={form.lat}
              onChange={(event) => setForm((previous) => ({ ...previous, lat: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="highlight-lon">경도</Label>
            <Input
              id="highlight-lon"
              inputMode="decimal"
              value={form.lon}
              onChange={(event) => setForm((previous) => ({ ...previous, lon: event.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="highlight-visibility">공개 범위</Label>
          <select
            id="highlight-visibility"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.visibility}
            onChange={(event) => setForm((previous) => ({ ...previous, visibility: event.target.value as 'public' | 'private' }))}
          >
            <option value="public">공개</option>
            <option value="private">나만 보기</option>
          </select>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button
          className="w-full rounded-full"
          disabled={!canSubmit || isSubmitting}
          onClick={async () => {
            try {
              setError(null)
              await onSubmit({
                type: form.type,
                title: form.title.trim() || undefined,
                note: form.note.trim() || undefined,
                lat: Number(form.lat),
                lon: Number(form.lon),
                visibility: form.visibility,
              })
              setForm((previous) => ({ ...previous, title: '', note: '' }))
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : '하이라이트 등록에 실패했습니다.')
            }
          }}
        >
          {isSubmitting ? '등록 중...' : '하이라이트 등록'}
        </Button>
      </CardContent>
    </Card>
  )
}
