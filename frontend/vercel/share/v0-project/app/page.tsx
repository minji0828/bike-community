import { Search, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { BottomNav } from '@/components/bottom-nav'
import { CourseCard } from '@/components/course-card'
import { MapView } from '@/components/map-view'
import { sampleCourses, nearbyPOIs } from '@/lib/sample-data'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
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
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="코스나 장소를 검색해보세요"
            className="h-12 rounded-full bg-card pl-10 shadow-sm"
          />
        </div>

        {/* Featured Courses */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            추천 코스
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {sampleCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                variant="featured"
              />
            ))}
          </div>
        </section>

        {/* Nearby POI Map */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">
            내 주변 시설
          </h2>
          <MapView
            className="mb-4 h-40"
            pois={nearbyPOIs}
            showCurrentLocation
          />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {nearbyPOIs.slice(0, 3).map((poi) => (
              <Card key={poi.id} className="flex-shrink-0">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {poi.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {poi.distance}m
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Nearby Courses */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-foreground">
            근처 코스
          </h2>
          <div className="space-y-3">
            {sampleCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                variant="compact"
              />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
