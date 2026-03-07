export type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
}

export class ApiError extends Error {
  status: number
  code?: number

  constructor(message: string, status: number, code?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

type ApiFetchOptions = RequestInit & {
  token?: string | null
  timeoutMs?: number
}

type ApiRequestDefaults = {
  baseUrl?: string
  credentials?: RequestCredentials
}

/**
 * 공통 API 호출기.
 * - backend 직접 호출과 same-origin app route 호출을 같은 에러 포맷으로 다룬다.
 * - 타임아웃과 JSON envelope 파싱을 한 곳에 모은다.
 */
async function requestApi<T>(path: string, options: ApiFetchOptions = {}, defaults: ApiRequestDefaults = {}) {
  const { token, headers, timeoutMs = 15000, signal, ...rest } = options
  const requestHeaders = new Headers(headers)

  if (!requestHeaders.has('Content-Type') && rest.body) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json')
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort('timeout'), timeoutMs)

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason)
    } else {
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
    }
  }

  const requestUrl = path.startsWith('http://') || path.startsWith('https://') ? path : `${defaults.baseUrl ?? ''}${path}`

  let response: Response
  try {
    response = await fetch(requestUrl, {
      ...rest,
      credentials: rest.credentials ?? defaults.credentials,
      headers: requestHeaders,
      signal: controller.signal,
    })
  } catch {
    globalThis.clearTimeout(timeoutId)

    if (controller.signal.aborted) {
      throw new ApiError('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.', 408)
    }

    throw new ApiError('서버에 연결하지 못했습니다. 실행 중인지 확인해주세요.', 0)
  }
  globalThis.clearTimeout(timeoutId)

  let payload: ApiEnvelope<T> | null = null
  const text = await response.text()
  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>
    } catch {
      if (!response.ok) {
        throw new ApiError('서버 응답을 해석할 수 없습니다.', response.status)
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message || `요청에 실패했습니다. (${response.status})`,
      response.status,
      payload?.code
    )
  }

  if (!payload) {
    throw new ApiError('응답 데이터가 비어 있습니다.', response.status)
  }

  if (payload.code >= 400) {
    throw new ApiError(payload.message || '요청에 실패했습니다.', response.status, payload.code)
  }

  return payload.data
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
  return requestApi<T>(path, options, { baseUrl: API_BASE_URL })
}

/**
 * Next app route(`/api/...`)를 같은 출처 기준으로 호출할 때 사용한다.
 * 인증 쿠키/프록시 경유가 필요한 요청은 이 함수를 우선 사용한다.
 */
export async function appRouteFetch<T>(path: string, options: ApiFetchOptions = {}) {
  return requestApi<T>(path, options, { credentials: 'same-origin' })
}
