'use client'

import { useState } from 'react'
import { Search, MapPin, List, Map } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { CourseCard } from '@/components/course-card'
import { MapView } from '@/components/map-view'
import { sampleCourses, nearbyPOIs } from '@/lib/sample-data'

const poiTypeLabels = {
  toilet: '화장실',
  water: '음수대',
  rest: '쉼터',
  cafe: '카페',
}

export default function ExplorePage() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  const filters = [
    { id: 'toilet', label: '화장실' },
    { id: 'cafe', label: '카페' },
    { id: 'rest', label: '쉼터' },
    { id: 'water', label: '음수대' },
  ]

  const filteredPOIs = selectedFilter ? nearbyPOIs.filter((poi) => poi.type === selectedFilter) : nearbyPOIs

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="장소나 코스 검색"
              className="h-10 rounded-full bg-muted pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {filters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant={selectedFilter === filter.id ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap rounded-full px-3 py-1"
                  onClick={() => setSelectedFilter(selectedFilter === filter.id ? null : filter.id)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
            <div className="flex rounded-full border border-border p-1">
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 w-7 rounded-full p-0"
                onClick={() => setViewMode('map')}
              >
                <Map className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 w-7 rounded-full p-0"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1">
        {viewMode === 'map' ? (
          <div className="relative h-[calc(100vh-200px)]">
            <MapView className="h-full rounded-none" pois={filteredPOIs} showCurrentLocation />
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {filteredPOIs.map((poi) => (
                  <Card key={poi.id} className="flex-shrink-0 shadow-lg">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{poi.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {poiTypeLabels[poi.type]} · {poi.distance}m
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <h2 className="mb-4 font-semibold text-foreground">주변 시설</h2>
            <div className="mb-6 space-y-2">
              {filteredPOIs.map((poi) => (
                <Card key={poi.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{poi.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {poiTypeLabels[poi.type]} · {poi.distance}m
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full">
                      안내
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="mb-4 font-semibold text-foreground">근처 코스</h2>
            <div className="space-y-3">
              {sampleCourses.map((course) => (
                <CourseCard key={course.id} course={course} variant="compact" />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
