import { apiFetch } from '@/lib/api'

export type RidingPointPayload = {
  lat: number
  lon: number
}

export type CreateRidingRequest = {
  deviceUuid: string
  title: string
  totalDistance: number
  totalTime: number
  avgSpeed: number
  path: RidingPointPayload[]
}

export type CreateCourseFromRidingRequest = {
  ridingId: number
  title: string
  visibility?: string
  sourceType?: string
  description?: string
  tags?: string[]
}

export async function createRiding(request: CreateRidingRequest, token?: string | null) {
  return apiFetch<{ ridingId: number }>('/api/v1/ridings', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  })
}

export async function createCourseFromRiding(request: CreateCourseFromRidingRequest, token?: string | null) {
  return apiFetch<{ courseId: number }>('/api/v1/courses/from-riding', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  })
}
