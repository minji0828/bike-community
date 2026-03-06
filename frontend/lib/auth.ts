const ACCESS_TOKEN_KEY = 'bikeoasis.access_token'
const KAKAO_LOGIN_SESSION_KEY = 'bikeoasis.kakao.login_session'

type KakaoLoginSession = {
  state: string
  nonce: string
  codeVerifier: string
  redirectUri: string
}

export type AuthUser = {
  userId: string
  expiresAt?: number
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.')
  if (!payload) {
    throw new Error('잘못된 토큰 형식입니다.')
  }

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const decoded = atob(padded)
  return JSON.parse(decoded) as Record<string, unknown>
}

export function getStoredAccessToken() {
  if (!isBrowser()) {
    return null
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setStoredAccessToken(token: string) {
  if (!isBrowser()) {
    return
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearStoredAccessToken() {
  if (!isBrowser()) {
    return
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function getAuthUserFromToken(token: string | null): AuthUser | null {
  if (!token) {
    return null
  }

  try {
    const payload = decodeJwtPayload(token)
    const sub = payload.sub
    if (typeof sub !== 'string' || !sub.trim()) {
      return null
    }

    const exp = typeof payload.exp === 'number' ? payload.exp : undefined
    return {
      userId: sub,
      expiresAt: exp,
    }
  } catch {
    return null
  }
}

export function isTokenExpired(token: string | null) {
  const user = getAuthUserFromToken(token)
  if (!user?.expiresAt) {
    return false
  }

  return user.expiresAt * 1000 <= Date.now()
}

export function saveKakaoLoginSession(session: KakaoLoginSession) {
  if (!isBrowser()) {
    return
  }
  window.sessionStorage.setItem(KAKAO_LOGIN_SESSION_KEY, JSON.stringify(session))
}

export function getKakaoLoginSession(): KakaoLoginSession | null {
  if (!isBrowser()) {
    return null
  }

  const raw = window.sessionStorage.getItem(KAKAO_LOGIN_SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as KakaoLoginSession
  } catch {
    return null
  }
}

export function clearKakaoLoginSession() {
  if (!isBrowser()) {
    return
  }
  window.sessionStorage.removeItem(KAKAO_LOGIN_SESSION_KEY)
}

export function getKakaoRedirectUri() {
  if (process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
  }

  if (!isBrowser()) {
    return ''
  }

  return `${window.location.origin}/auth/kakao/callback`
}
