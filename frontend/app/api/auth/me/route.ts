import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const ACCESS_TOKEN_COOKIE_KEY = 'bikeoasis.access_token'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(ACCESS_TOKEN_COOKIE_KEY)?.value
  const headerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const accessToken = headerToken || cookieToken

  if (!accessToken) {
    return NextResponse.json(
      {
        code: 401,
        message: '인증 토큰이 없습니다.',
        data: null,
      },
      { status: 401 }
    )
  }

  const apiBaseUrl = (
    process.env.INTERNAL_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:8080'
  ).replace(/\/$/, '')

  try {
    const backendResponse = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    const text = await backendResponse.text()

    return new NextResponse(text, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('content-type') || 'application/json; charset=utf-8',
      },
    })
  } catch {
    return NextResponse.json(
      {
        code: 502,
        message: '백엔드 인증 상태를 확인하지 못했습니다.',
        data: null,
      },
      { status: 502 }
    )
  }
}
