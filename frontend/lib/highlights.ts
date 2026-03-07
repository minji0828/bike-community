import { apiFetch } from '@/lib/api'

export type CourseHighlight = {
  highlightId: number
  courseId: number
  type: string
  title: string | null
  note: string | null
  visibility: string
  lat: number | null
  lon: number | null
  authorUserId: number
  mine: boolean
  createdAt: string
}

export type CreateCourseHighlightRequest = {
  type: 'viewpoint' | 'restroom' | 'water' | 'cafe' | 'danger' | 'photo' | 'note'
  title?: string
  note?: string
  lat: number
  lon: number
  visibility?: 'public' | 'private'
}

export async function listCourseHighlights(courseId: number, token?: string | null) {
  return apiFetch<CourseHighlight[]>(`/api/v1/courses/${courseId}/highlights`, {
    method: 'GET',
    token,
  })
}

export async function createCourseHighlight(courseId: number, request: CreateCourseHighlightRequest, token: string) {
  return apiFetch<string>(`/api/v1/courses/${courseId}/highlights`, {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  })
}
