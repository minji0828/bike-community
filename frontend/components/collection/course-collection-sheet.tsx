'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  addCourseToCollection,
  createCourseCollection,
  listMyCollections,
  type CourseCollectionSummary,
} from '@/lib/collections'

export function CourseCollectionSheet({
  courseId,
  token,
  isAuthenticated,
}: {
  courseId: number
  token: string | null
  isAuthenticated: boolean
}) {
  const [collections, setCollections] = useState<CourseCollectionSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    region: '',
    tripNotes: '',
    visibility: 'private' as 'private' | 'unlisted' | 'public',
  })

  useEffect(() => {
    if (!token) {
      setCollections([])
      return
    }

    setLoading(true)
    listMyCollections(token)
      .then((response) => {
        setCollections(response)
        setError(null)
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : '컬렉션을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [token])

  if (!isAuthenticated || !token) {
    return (
      <Card className="border-dashed">
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>컬렉션은 로그인 후 사용할 수 있어요. 여행처럼 여러 코스를 한 번에 묶어둘 수 있습니다.</p>
          <Link href="/profile">
            <Button variant="outline" className="w-full rounded-full">
              프로필에서 로그인하기
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-foreground">여행 컬렉션에 담기</h4>
              <p className="text-sm text-muted-foreground">여러 코스를 주말 여행, 장거리 투어 단위로 묶어 관리할 수 있어요.</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowCreateForm((prev) => !prev)}>
              새 컬렉션
            </Button>
          </div>

          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}

          {showCreateForm && (
            <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-3">
              <div className="space-y-2">
                <Label htmlFor="collection-title">컬렉션 제목</Label>
                <Input
                  id="collection-title"
                  value={createForm.title}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="예: 1박 2일 강원 라이딩"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-region">지역</Label>
                <Input
                  id="collection-region"
                  value={createForm.region}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, region: event.target.value }))}
                  placeholder="예: 강원 / 남한강"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-notes">여행 메모</Label>
                <textarea
                  id="collection-notes"
                  className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={createForm.tripNotes}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, tripNotes: event.target.value }))}
                  placeholder="숙소, 점심, 보급 계획 등을 적어두세요"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-visibility">공개 범위</Label>
                <select
                  id="collection-visibility"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={createForm.visibility}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, visibility: event.target.value as 'private' | 'unlisted' | 'public' }))}
                >
                  <option value="private">비공개</option>
                  <option value="unlisted">링크 공개</option>
                  <option value="public">공개</option>
                </select>
              </div>
              <Button
                className="w-full rounded-full"
                disabled={loading || !createForm.title.trim()}
                onClick={async () => {
                  try {
                    setLoading(true)
                    setError(null)
                    const created = await createCourseCollection(
                      {
                        title: createForm.title,
                        region: createForm.region || undefined,
                        tripNotes: createForm.tripNotes || undefined,
                        visibility: createForm.visibility,
                      },
                      token
                    )
                    await addCourseToCollection(created.collectionId, { courseId }, token)
                    const refreshed = await listMyCollections(token)
                    setCollections(refreshed)
                    setMessage('새 컬렉션을 만들고 현재 코스를 바로 담았어요.')
                    setShowCreateForm(false)
                    setCreateForm({ title: '', region: '', tripNotes: '', visibility: 'private' })
                  } catch (createError) {
                    setError(createError instanceof Error ? createError.message : '컬렉션 생성에 실패했습니다.')
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                {loading ? '생성 중...' : '컬렉션 만들고 담기'}
              </Button>
            </div>
          )}

          {collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 내 컬렉션이 없어요. 새 컬렉션을 만들고 코스를 담아보세요.</p>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <div key={collection.collectionId} className="rounded-2xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/collections/${collection.collectionId}`} className="font-semibold text-foreground underline-offset-2 hover:underline">
                        {collection.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {collection.region || '지역 미정'} · {collection.itemCount}개 코스 · {collection.visibility}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={loading}
                      onClick={async () => {
                        try {
                          setLoading(true)
                          setError(null)
                          await addCourseToCollection(collection.collectionId, { courseId }, token)
                          setMessage(`'${collection.title}' 컬렉션에 코스를 담았어요.`)
                        } catch (addError) {
                          setError(addError instanceof Error ? addError.message : '컬렉션 담기에 실패했습니다.')
                        } finally {
                          setLoading(false)
                        }
                      }}
                    >
                      담기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
