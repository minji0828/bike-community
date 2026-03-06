import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const KAKAO_LOGIN_SESSION_COOKIE_KEY = 'bikeoasis.kakao.login_session'

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function generateRandomString(byteLength = 32) {
  return toBase64Url(randomBytes(byteLength))
}

function getRedirectUri(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
  }

  return new URL('/auth/kakao/callback', request.url).toString()
}

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID

  if (!clientId) {
    return NextResponse.redirect(new URL('/profile?loginError=config', request.url))
  }

  const redirectUri = getRedirectUri(request)
  const codeVerifier = generateRandomString(64)
  const codeChallenge = toBase64Url(createHash('sha256').update(codeVerifier).digest())
  const state = generateRandomString(24)
  const nonce = generateRandomString(24)

  const loginSession = JSON.stringify({
    state,
    nonce,
    codeVerifier,
    redirectUri,
  })

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce,
    scope: 'openid profile_nickname',
  })

  const response = NextResponse.redirect(`https://kauth.kakao.com/oauth/authorize?${params.toString()}`)
  const cookieStore = await cookies()
  cookieStore.set(KAKAO_LOGIN_SESSION_COOKIE_KEY, loginSession, {
    path: '/',
    maxAge: 60 * 10,
    sameSite: 'lax',
    httpOnly: false,
  })

  return response
}
