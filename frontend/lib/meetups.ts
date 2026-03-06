import { apiFetch } from '@/lib/api'

export type CourseMeetup = {
  meetupId: number
  courseId: number
  title: string
  status: string
  startAt: string
  meetingPointLat: number | null
  meetingPointLon: number | null
  capacity: number
  participantCount: number
  joined: boolean
  host: boolean
}

export type MeetupChatMessage = {
  messageId: string
  meetupId: number
  authorDisplayName: string
  body: string
  sentAt: string
}

export type CreateCourseMeetupRequest = {
  title: string
  startAt: string
  meetingPointLat?: number
  meetingPointLon?: number
  capacity?: number
}

export type CreateCourseMeetupResponse = {
  meetupId: number
}

export async function listCourseMeetups(courseId: number, token?: string | null) {
  return apiFetch<CourseMeetup[]>(`/api/v1/courses/${courseId}/meetups`, {
    method: 'GET',
    token,
  })
}

export async function createCourseMeetup(courseId: number, request: CreateCourseMeetupRequest, token: string) {
  return apiFetch<CreateCourseMeetupResponse>(`/api/v1/courses/${courseId}/meetups`, {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  })
}

export async function getMeetup(meetupId: number, token?: string | null) {
  return apiFetch<CourseMeetup>(`/api/v1/meetups/${meetupId}`, {
    method: 'GET',
    token,
  })
}

export async function joinMeetup(meetupId: number, token: string) {
  return apiFetch<string>(`/api/v1/meetups/${meetupId}/join`, {
    method: 'POST',
    token,
  })
}

export async function leaveMeetup(meetupId: number, token: string) {
  return apiFetch<string>(`/api/v1/meetups/${meetupId}/leave`, {
    method: 'POST',
    token,
  })
}
