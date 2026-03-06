import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type SearchParams = Promise<{
  code?: string
  state?: string
  error?: string
  error_description?: string
}>

function ErrorFallback({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-lg font-bold text-rose-600">
            !
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">카카오 로그인</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
          <Link href="/profile">
            <Button>프로필로 돌아가기</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function KakaoCallbackPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const code = params.code
  const state = params.state
  const error = params.error
  const errorDescription = params.error_description

  if (error) {
    return <ErrorFallback message={errorDescription || '카카오 로그인에 실패했습니다.'} />
  }

  if (!code || !state) {
    return <ErrorFallback message="카카오 로그인 응답이 올바르지 않습니다." />
  }

  redirect(`/auth/kakao/finalize?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
}
