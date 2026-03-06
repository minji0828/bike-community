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

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}) {
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

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      signal: controller.signal,
    })
  } catch (error) {
    globalThis.clearTimeout(timeoutId)

    if (controller.signal.aborted) {
      throw new ApiError('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.', 408)
    }

    throw new ApiError('서버에 연결하지 못했습니다. 백엔드가 실행 중인지 확인해주세요.', 0)
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
