const ACCESS_TOKEN_KEY = 'bikeoasis.access_token'
const KAKAO_LOGIN_SESSION_KEY = 'bikeoasis.kakao.login_session'
const KAKAO_LOGIN_SESSION_COOKIE_KEY = 'bikeoasis.kakao.login_session'

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

function getCookie(name: string) {
  if (!isBrowser()) {
    return null
  }

  const cookies = window.document.cookie ? window.document.cookie.split('; ') : []
  const target = cookies.find((entry) => entry.startsWith(`${name}=`))
  if (!target) {
    return null
  }

  return decodeURIComponent(target.slice(name.length + 1))
}

function setCookie(name: string, value: string, maxAgeSeconds = 600) {
  if (!isBrowser()) {
    return
  }

  window.document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`
}

function clearCookie(name: string) {
  if (!isBrowser()) {
    return
  }

  window.document.cookie = `${name}=; path=/; max-age=0; samesite=lax`
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
  const serialized = JSON.stringify(session)
  window.sessionStorage.setItem(KAKAO_LOGIN_SESSION_KEY, serialized)
  setCookie(KAKAO_LOGIN_SESSION_COOKIE_KEY, serialized)
}

export function getKakaoLoginSession(): KakaoLoginSession | null {
  if (!isBrowser()) {
    return null
  }

  const raw = window.sessionStorage.getItem(KAKAO_LOGIN_SESSION_KEY)
  const cookieRaw = getCookie(KAKAO_LOGIN_SESSION_COOKIE_KEY)
  const serialized = raw || cookieRaw
  if (!serialized) {
    return null
  }

  try {
    return JSON.parse(serialized) as KakaoLoginSession
  } catch {
    return null
  }
}

export function clearKakaoLoginSession() {
  if (!isBrowser()) {
    return
  }
  window.sessionStorage.removeItem(KAKAO_LOGIN_SESSION_KEY)
  clearCookie(KAKAO_LOGIN_SESSION_COOKIE_KEY)
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
