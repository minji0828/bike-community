'use client'

import Link from 'next/link'
import { Clock, Route, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Course } from '@/lib/sample-data'

interface CourseCardProps {
  course: Course
  variant?: 'default' | 'featured' | 'compact'
}

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

export function CourseCard({ course, variant = 'default' }: CourseCardProps) {
  if (variant === 'featured') {
    return (
      <Link href={`/course/${course.id}`}>
        <Card className="group relative h-48 w-72 flex-shrink-0 overflow-hidden border-0 shadow-lg transition-transform hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <CardContent className="relative flex h-full flex-col justify-end p-4">
            <Badge
              className={cn(
                'mb-2 w-fit',
                difficultyColors[course.difficulty]
              )}
            >
              {difficultyLabels[course.difficulty]}
            </Badge>
            <h3 className="text-lg font-bold text-white">{course.name}</h3>
            <p className="mt-1 line-clamp-1 text-sm text-white/80">
              {course.description}
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm text-white/90">
              <span className="flex items-center gap-1">
                <Route className="h-4 w-4" />
                {course.distance}km
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {course.estimatedTime}분
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                화장실 {course.toiletCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link href={`/course/${course.id}`}>
        <Card className="group transition-colors hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400">
              <Route className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="font-semibold text-foreground">{course.name}</h3>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span>{course.distance}km</span>
                <span>{course.estimatedTime}분</span>
                <span>화장실 {course.toiletCount}</span>
              </div>
            </div>
            <Badge
              className={cn(difficultyColors[course.difficulty])}
            >
              {difficultyLabels[course.difficulty]}
            </Badge>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/course/${course.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="relative h-32 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400">
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <Badge
            className={cn(
              'absolute right-3 top-3',
              difficultyColors[course.difficulty]
            )}
          >
            {difficultyLabels[course.difficulty]}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground">{course.name}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {course.description}
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Route className="h-4 w-4" />
              {course.distance}km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {course.estimatedTime}분
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {course.toiletCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
