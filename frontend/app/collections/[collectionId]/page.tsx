'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, MapPinned, Route } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCollectionDetail, type CourseCollectionDetail } from '@/lib/collections'

export default function CollectionDetailPage() {
  const params = useParams()
  const collectionIdParam = params?.collectionId
  const collectionId = Number(typeof collectionIdParam === 'string' ? collectionIdParam : Array.isArray(collectionIdParam) ? collectionIdParam[0] : '')
  const isValidCollectionId = Number.isFinite(collectionId)
  const { token } = useAuth()
  const [collection, setCollection] = useState<CourseCollectionDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isValidCollectionId)

  useEffect(() => {
    if (!isValidCollectionId) {
      return
    }

    getCollectionDetail(collectionId, token)
      .then((response) => {
        setCollection(response)
        setError(null)
      })
      .catch((loadError) => {
        setCollection(null)
        setError(loadError instanceof Error ? loadError.message : '컬렉션을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [collectionId, isValidCollectionId, token])

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-foreground">여행 컬렉션</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-6">
        {loading ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">컬렉션을 불러오는 중...</CardContent>
          </Card>
        ) : !isValidCollectionId ? (
          <Card>
            <CardContent className="p-4 text-sm text-rose-600">잘못된 컬렉션 ID입니다.</CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-4 text-sm text-rose-600">{error}</CardContent>
          </Card>
        ) : collection ? (
          <>
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">Trip Collection</p>
                    <h2 className="text-2xl font-bold text-foreground">{collection.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{collection.region || '지역 미정'} · {collection.visibility}</p>
                  </div>
                  {collection.mine && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">내 컬렉션</span>}
                </div>
                {collection.description && <p className="text-sm text-muted-foreground">{collection.description}</p>}
                {collection.tripNotes && <p className="rounded-2xl bg-muted/50 p-3 text-sm text-foreground">{collection.tripNotes}</p>}
              </CardContent>
            </Card>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">담긴 코스</h3>
                <span className="text-sm text-muted-foreground">{collection.itemCount}개</span>
              </div>
              {collection.items.map((item) => (
                <Card key={item.itemId}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{item.courseTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.distanceKm?.toFixed(1) ?? '-'}km · {item.estimatedDurationMin ?? '-'}분
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">#{item.positionIndex + 1}</span>
                    </div>
                    <Link href={`/course/${item.courseId}`}>
                      <Button variant="outline" className="w-full rounded-full">
                        <MapPinned className="mr-2 h-4 w-4" />
                        코스 상세 보기
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </section>
          </>
        ) : null}
      </main>

      <div className="mx-auto max-w-md px-4 pb-20">
        <Link href="/explore">
          <Button className="h-12 w-full rounded-full">
            <Route className="mr-2 h-4 w-4" />
            더 많은 코스 탐색하기
          </Button>
        </Link>
      </div>
      <BottomNav />
    </div>
  )
}
