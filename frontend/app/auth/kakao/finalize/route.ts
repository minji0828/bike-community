import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const LOGIN_SESSION_COOKIE_KEY = 'bikeoasis.kakao.login_session'
const ACCESS_TOKEN_COOKIE_KEY = 'bikeoasis.access_token'

type LoginSession = {
  state: string
  nonce: string
  codeVerifier: string
  redirectUri: string
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T | null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(new URL('/profile?loginError=invalid_response', request.url))
  }

  const cookieStore = await cookies()
  const rawSession = cookieStore.get(LOGIN_SESSION_COOKIE_KEY)?.value

  if (!rawSession) {
    return NextResponse.redirect(new URL('/profile?loginError=missing_session', request.url))
  }

  let session: LoginSession
  try {
    session = JSON.parse(rawSession) as LoginSession
  } catch {
    const response = NextResponse.redirect(new URL('/profile?loginError=invalid_session', request.url))
    response.cookies.delete(LOGIN_SESSION_COOKIE_KEY)
    return response
  }

  if (session.state !== state) {
    const response = NextResponse.redirect(new URL('/profile?loginError=state_mismatch', request.url))
    response.cookies.delete(LOGIN_SESSION_COOKIE_KEY)
    return response
  }

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

  try {
    const backendResponse = await fetch(`${apiBaseUrl}/api/v1/auth/kakao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code,
        codeVerifier: session.codeVerifier,
        redirectUri: session.redirectUri,
        nonce: session.nonce,
      }),
      cache: 'no-store',
    })

    const payload = (await backendResponse.json()) as ApiEnvelope<{
      accessToken: string
      expiresInSec: number
    }>

    if (!backendResponse.ok || !payload?.data?.accessToken) {
      const response = NextResponse.redirect(
        new URL(`/profile?loginError=${encodeURIComponent(payload?.message || 'token_exchange_failed')}`, request.url)
      )
      response.cookies.delete(LOGIN_SESSION_COOKIE_KEY)
      return response
    }

    const response = NextResponse.redirect(new URL('/profile?login=success', request.url))
    response.cookies.set(ACCESS_TOKEN_COOKIE_KEY, payload.data.accessToken, {
      path: '/',
      maxAge: payload.data.expiresInSec,
      sameSite: 'lax',
      httpOnly: false,
    })
    response.cookies.delete(LOGIN_SESSION_COOKIE_KEY)
    return response
  } catch {
    const response = NextResponse.redirect(new URL('/profile?loginError=network', request.url))
    response.cookies.delete(LOGIN_SESSION_COOKIE_KEY)
    return response
  }
}
