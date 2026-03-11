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
  // RID-P-001, RID-P-002: 라이딩 저장은 보호 API이며 소유권은 서버가 토큰으로 확정한다.
  return apiFetch<{ ridingId: number }>('/api/v1/ridings', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  })
}

export async function createCourseFromRiding(request: CreateCourseFromRidingRequest, token?: string | null) {
  // CRS-P-010, CRS-P-011: 본인 라이딩으로만 코스를 생성하도록 서버 소유권 검증을 전제한다.
  return apiFetch<{ courseId: number }>('/api/v1/courses/from-riding', {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  })
}
