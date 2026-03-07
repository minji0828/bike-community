import { apiFetch } from '@/lib/api'

export type CourseCollectionSummary = {
  collectionId: number
  title: string
  region: string | null
  visibility: string
  itemCount: number
  updatedAt: string
}

export type CourseCollectionItem = {
  itemId: number
  courseId: number
  courseTitle: string
  distanceKm: number | null
  estimatedDurationMin: number | null
  positionIndex: number
}

export type CourseCollectionDetail = {
  collectionId: number
  ownerUserId: number
  title: string
  description: string | null
  region: string | null
  tripNotes: string | null
  visibility: string
  itemCount: number
  items: CourseCollectionItem[]
  createdAt: string
  updatedAt: string
  mine: boolean
}

export type CreateCourseCollectionRequest = {
  title: string
  description?: string
  region?: string
  tripNotes?: string
  visibility?: 'private' | 'unlisted' | 'public'
}

export async function listMyCollections(token: string) {
  return apiFetch<CourseCollectionSummary[]>('/api/v1/collections?mine=true', {
    method: 'GET',
    token,
  })
}

export async function createCourseCollection(request: CreateCourseCollectionRequest, token: string) {
  return apiFetch<{ collectionId: number }>('/api/v1/collections', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  })
}

export async function addCourseToCollection(
  collectionId: number,
  request: { courseId: number; positionIndex?: number },
  token: string
) {
  return apiFetch<string>(`/api/v1/collections/${collectionId}/items`, {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  })
}

export async function getCollectionDetail(collectionId: number, token?: string | null) {
  return apiFetch<CourseCollectionDetail>(`/api/v1/collections/${collectionId}`, {
    method: 'GET',
    token,
  })
}
