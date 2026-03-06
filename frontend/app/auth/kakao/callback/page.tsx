'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/components/auth/auth-provider'

function KakaoCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { completeKakaoLogin } = useAuth()
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const syncErrorMessage = error
    ? errorDescription || '카카오 로그인에 실패했습니다.'
    : !code || !state
      ? '카카오 로그인 응답이 올바르지 않습니다.'
      : null
  const [asyncErrorMessage, setAsyncErrorMessage] = useState<string | null>(null)
  const status: 'loading' | 'error' = syncErrorMessage || asyncErrorMessage ? 'error' : 'loading'
  const message = syncErrorMessage || asyncErrorMessage || '카카오 로그인 정보를 확인하고 있어요...'

  useEffect(() => {
    let isMounted = true

    if (syncErrorMessage || !code || !state) {
      return
    }

    completeKakaoLogin({ code, state })
      .then(() => {
        if (!isMounted) {
          return
        }
        router.replace('/profile?login=success')
      })
      .catch((loginError) => {
        if (!isMounted) {
          return
        }
        setAsyncErrorMessage(loginError instanceof Error ? loginError.message : '로그인 처리에 실패했습니다.')
      })

    return () => {
      isMounted = false
    }
  }, [code, completeKakaoLogin, router, state, syncErrorMessage])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          {status === 'loading' ? (
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-lg font-bold text-rose-600">
              !
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">카카오 로그인</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
          {status === 'error' && (
            <Link href="/profile">
              <Button>프로필로 돌아가기</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">카카오 로그인</h1>
                <p className="mt-2 text-sm text-muted-foreground">로그인 정보를 불러오는 중이에요...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  )
}
