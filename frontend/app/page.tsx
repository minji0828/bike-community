'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, Navigation } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BottomNav } from '@/components/bottom-nav'
import { CourseCard } from '@/components/course-card'
import { MapView } from '@/components/map-view'
import { getFeaturedCourses, toCourseCardModel } from '@/lib/courses'
import { getNearbyToilets, toPoiModel } from '@/lib/pois'
import { sampleCourses, nearbyPOIs } from '@/lib/sample-data'

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState(sampleCourses)
  const [featuredFallback, setFeaturedFallback] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearby, setNearby] = useState(nearbyPOIs)
  const [locationMessage, setLocationMessage] = useState('현재 위치를 확인하는 중...')

  useEffect(() => {
    getFeaturedCourses()
      .then((courses) => {
        if (!courses.length) {
          setFeaturedFallback(true)
          return
        }
        setFeaturedCourses(courses.map(toCourseCardModel))
        setFeaturedFallback(false)
      })
      .catch(() => {
        setFeaturedFallback(true)
      })
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMessage('브라우저가 위치 기능을 지원하지 않습니다.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCurrentLocation(coords)
        setLocationMessage('내 주변 공공화장실을 불러왔어요.')

        getNearbyToilets(coords.lat, coords.lng, 500)
          .then((pois) => {
            if (pois.length) {
              setNearby(pois.map(toPoiModel))
              setLocationMessage('실제 내 위치 기준 주변 공공화장실입니다.')
            } else {
              setNearby([])
              setLocationMessage('현재 반경 500m 내 공공화장실 데이터가 없습니다.')
            }
          })
          .catch(() => {
            setLocationMessage('주변 시설 데이터를 불러오지 못했습니다.')
          })
      },
      () => {
        setLocationMessage('위치 권한이 없어서 샘플 위치로만 표시합니다.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }, [])

  const displayedPois = useMemo(() => nearby.slice(0, 3), [nearby])

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto max-w-md px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
              <span className="text-lg font-bold text-white">G</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">가자</h1>
              <p className="text-xs text-muted-foreground">BikeOasis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="코스나 장소를 검색해보세요" className="h-12 rounded-full bg-card pl-10 shadow-sm" />
        </div>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">추천 코스</h2>
            {featuredFallback && <span className="text-xs text-muted-foreground">실코스 없음 · 샘플 표시</span>}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} variant="featured" />
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">내 주변 시설</h2>
          <MapView
            className="mb-4 h-64"
            pois={nearby}
            showCurrentLocation
            currentLocation={currentLocation}
            center={currentLocation}
          />
          <div className="mb-3 rounded-2xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{locationMessage}</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {displayedPois.length ? displayedPois.map((poi) => (
              <Card key={poi.id} className="flex-shrink-0">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{poi.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {'distance' in poi && poi.distance ? `${poi.distance}m` : '공공화장실'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="w-full">
                <CardContent className="flex flex-col items-center justify-center gap-2 p-5 text-center">
                  <Navigation className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">표시할 주변 시설이 아직 없습니다.</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    다시 불러오기
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold text-foreground">근처 코스</h2>
          <div className="space-y-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} variant="compact" />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
