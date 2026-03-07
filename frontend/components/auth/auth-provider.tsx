'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, appRouteFetch, ApiError } from '@/lib/api'
import {
  AuthUser,
  clearKakaoLoginSession,
  clearStoredAccessToken,
  getAuthUserFromToken,
  getKakaoLoginSession,
  getKakaoRedirectUri,
  getStoredAuthState,
  saveKakaoLoginSession,
  setStoredAccessToken,
} from '@/lib/auth'
import { buildKakaoAuthorizeUrl, generatePkcePair, generateRandomString } from '@/lib/pkce'

type AuthMeResponse = {
  userId: number
  username: string
  provider?: string | null
}

type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'error'

type AuthContextValue = {
  status: AuthStatus
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  authError: string | null
  startKakaoLogin: () => Promise<void>
  completeKakaoLogin: (params: { code: string; state: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const syncAuth = async () => {
      const stored = getStoredAuthState()
      if (!stored.token || stored.isExpired || !stored.user) {
        clearStoredAccessToken()
        setToken(null)
        setUser(null)
        setAuthError(null)
        setStatus('anonymous')
        setIsLoading(false)
        return
      }

      setToken(stored.token)
      setStoredAccessToken(stored.token)
      setUser(stored.user)
      setAuthError(null)
      setStatus('checking')

      try {
        const profile = await appRouteFetch<AuthMeResponse>('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${stored.token}`,
          },
          cache: 'no-store',
        })

        setUser({
          userId: String(profile.userId),
          username: profile.username,
          provider: profile.provider ?? undefined,
          expiresAt: stored.user.expiresAt,
        })
        setStatus('authenticated')
      } catch (error) {
        clearStoredAccessToken()
        setToken(null)
        setUser(null)
        setStatus('error')
        if (error instanceof ApiError && error.status === 401) {
          setAuthError('저장된 로그인 정보가 만료되었어요. 다시 로그인해주세요.')
        } else {
          setAuthError('로그인 상태를 확인하지 못했습니다. 다시 로그인해주세요.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    syncAuth().catch(() => {
      clearStoredAccessToken()
      setToken(null)
      setUser(null)
      setStatus('error')
      setAuthError('로그인 상태를 확인하지 못했습니다. 다시 로그인해주세요.')
      setIsLoading(false)
    })
  }, [])

  const startKakaoLogin = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
    if (!clientId) {
      throw new Error('NEXT_PUBLIC_KAKAO_CLIENT_ID 설정이 필요합니다.')
    }

    const redirectUri = getKakaoRedirectUri()
    if (!redirectUri) {
      throw new Error('카카오 redirect URI를 확인해주세요.')
    }

    const { verifier, challenge } = await generatePkcePair()
    const state = generateRandomString(24)
    const nonce = generateRandomString(24)

    saveKakaoLoginSession({
      state,
      nonce,
      codeVerifier: verifier,
      redirectUri,
    })

    window.location.href = buildKakaoAuthorizeUrl({
      clientId,
      redirectUri,
      codeChallenge: challenge,
      state,
      nonce,
    })
  }, [])

  const completeKakaoLogin = useCallback(async ({ code, state }: { code: string; state: string }) => {
    const session = getKakaoLoginSession()

    if (!session) {
      throw new Error('로그인 세션 정보가 없습니다. 다시 시도해주세요.')
    }

    if (session.state !== state) {
      clearKakaoLoginSession()
      throw new Error('로그인 state 검증에 실패했습니다.')
    }

    const response = await apiFetch<{ accessToken: string; expiresInSec: number }>('/api/v1/auth/kakao', {
      method: 'POST',
      body: JSON.stringify({
        code,
        codeVerifier: session.codeVerifier,
        redirectUri: session.redirectUri,
        nonce: session.nonce,
      }),
    })

    const nextUser = getAuthUserFromToken(response.accessToken)
    setStoredAccessToken(response.accessToken)
    setToken(response.accessToken)
    setUser(nextUser)
    setStatus(nextUser ? 'authenticated' : 'anonymous')
    setAuthError(null)
    clearKakaoLoginSession()
  }, [])

  const logout = useCallback(() => {
    clearStoredAccessToken()
    clearKakaoLoginSession()
    setToken(null)
    setUser(null)
    setAuthError(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(
    () => ({
      status,
      token,
      user,
      isLoading,
      isAuthenticated: status === 'authenticated' && Boolean(token && user),
      authError,
      startKakaoLogin,
      completeKakaoLogin,
      logout,
    }),
    [authError, completeKakaoLogin, isLoading, logout, startKakaoLogin, status, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.')
  }

  return context
}
