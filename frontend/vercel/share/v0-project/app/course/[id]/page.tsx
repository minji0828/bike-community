'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Route, MapPin, Navigation, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapView } from '@/components/map-view'
import { sampleCourses } from '@/lib/sample-data'

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

const poiTypeLabels = {
  toilet: '화장실',
  water: '음수대',
  rest: '쉼터',
  cafe: '카페',
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const course = sampleCourses.find((c) => c.id === id) || sampleCourses[0]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-foreground">코스 상세</h1>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md">
        {/* Map */}
        <MapView
          className="h-56 rounded-none"
          showRoute
          pois={course.pois}
          showCurrentLocation={false}
        />

        {/* Course Info */}
        <div className="px-4 py-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Badge className={difficultyColors[course.difficulty]}>
                {difficultyLabels[course.difficulty]}
              </Badge>
              <h2 className="mt-2 text-2xl font-bold text-foreground">
                {course.name}
              </h2>
              <p className="mt-1 text-muted-foreground">{course.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="flex flex-col items-center p-4">
                <Route className="mb-2 h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">
                  {course.distance}km
                </span>
                <span className="text-xs text-muted-foreground">거리</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-4">
                <Clock className="mb-2 h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">
                  {course.estimatedTime}분
                </span>
                <span className="text-xs text-muted-foreground">예상 시간</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center p-4">
                <MapPin className="mb-2 h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">
                  {course.toiletCount}개
                </span>
                <span className="text-xs text-muted-foreground">화장실</span>
              </CardContent>
            </Card>
          </div>

          {/* POI List */}
          <section>
            <h3 className="mb-3 font-semibold text-foreground">
              경로 주변 시설
            </h3>
            <div className="space-y-2">
              {course.pois.map((poi) => (
                <Card key={poi.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{poi.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {poiTypeLabels[poi.type]}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full">
                      안내
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
        <div className="mx-auto max-w-md">
          <Link href={`/course/${course.id}/guide`}>
            <Button className="h-14 w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-lg font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-600">
              <Navigation className="mr-2 h-5 w-5" />
              코스 따라가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
