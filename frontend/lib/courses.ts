import { apiFetch } from '@/lib/api'
import type { Course } from '@/lib/sample-data'

export type FeaturedCourseResponse = {
  id: number
  title: string
  distanceKm: number | null
  estimatedDurationMin: number | null
  loop: boolean | null
  featuredRank: number | null
  tags: string[]
}

export type CourseDetailApiResponse = {
  id: number
  title: string
  visibility: string
  sourceType: string
  verifiedStatus: string
  distanceKm: number | null
  estimatedDurationMin: number | null
  loop: boolean | null
  amenitiesSummary: {
    toiletCount: number | null
    cafeCount: number | null
  } | null
  tags: string[]
  warnings: Array<{
    type: string
    severity: number
    lat: number | null
    lon: number | null
    radiusM: number | null
    note: string | null
    validUntil: string | null
  }>
  path: Array<{
    lat: number
    lon: number
  }>
}

export async function getFeaturedCourses() {
  return apiFetch<FeaturedCourseResponse[]>('/api/v1/courses/featured', {
    method: 'GET',
  })
}

export async function getCourseDetail(courseId: number) {
  return apiFetch<CourseDetailApiResponse>(`/api/v1/courses/${courseId}`, {
    method: 'GET',
  })
}

export function toCourseCardModel(course: FeaturedCourseResponse): Course {
  const distance = Number((course.distanceKm ?? 0).toFixed(1))
  return {
    id: String(course.id),
    name: course.title,
    description: course.tags.length ? course.tags.join(' · ') : '실제 코스 데이터',
    distance,
    estimatedTime: course.estimatedDurationMin ?? 0,
    difficulty: distance >= 45 ? 'hard' : distance >= 20 ? 'medium' : 'easy',
    toiletCount: 0,
    thumbnail: '',
    path: [],
    pois: [],
  }
}

export function toCourseDetailModel(course: CourseDetailApiResponse): Course {
  const distance = Number((course.distanceKm ?? 0).toFixed(1))

  return {
    id: String(course.id),
    name: course.title,
    description:
      course.tags.length > 0
        ? course.tags.join(' · ')
        : course.sourceType === 'RIDING'
          ? '내 라이딩 기록으로 생성한 코스'
          : '실제 코스 데이터',
    distance,
    estimatedTime: course.estimatedDurationMin ?? 0,
    difficulty: distance >= 45 ? 'hard' : distance >= 20 ? 'medium' : 'easy',
    toiletCount: course.amenitiesSummary?.toiletCount ?? 0,
    thumbnail: '',
    path: course.path.map((point) => ({
      lat: point.lat,
      lng: point.lon,
    })),
    pois: [],
  }
}
