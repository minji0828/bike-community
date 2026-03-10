# FE-ADR-0002: Kakao 로그인 오케스트레이션은 Next route + backend JWT로 구성

- Status: Accepted
- Date: 2026-03-10

## Context

- 카카오 로그인은 브라우저 리다이렉트와 PKCE state/nonce 검증이 필요하다.
- 프론트는 사용자 인터랙션과 리다이렉트를 다루고, 백엔드는 공급자 검증과 내부 토큰 발급을 맡는 편이 자연스럽다.
- 로그인 이후 프론트는 페이지 이동과 새로고침에도 인증 상태를 복원해야 한다.

## Decision

- 로그인 시작은 `/auth/kakao/start` Next route에서 수행한다.
- callback은 `/auth/kakao/callback`에서 받고, 실제 토큰 교환은 `/auth/kakao/finalize` route가 백엔드 `/api/v1/auth/kakao`와 통신해 마무리한다.
- 프론트가 보관하는 토큰은 Kakao access token이 아니라 백엔드가 발급한 서비스 JWT다.
- 서비스 JWT는 브라우저 cookie + localStorage에 저장하고, 부팅 시 `AuthProvider`가 이를 재검증한다.
- 현재 로그인 사용자 확인은 same-origin app route `/api/auth/me`를 통해 백엔드 `/api/v1/auth/me`를 프록시한다.

## Rationale

- 브라우저 리다이렉트와 PKCE는 Next route가 다루기 쉽다.
- 인증 공급자 토큰을 프론트 일반 API 호출에 직접 쓰지 않으면 경계가 명확하다.
- `AuthProvider` 하나로 인증 상태를 읽으면 페이지별 인증 로직이 흩어지지 않는다.

## Consequences

- 장점:
  - 로그인 플로우와 일반 API 토큰 사용 모델이 분리된다.
  - 새로고침과 클라이언트 라우팅 이후에도 인증 상태를 복원할 수 있다.
  - auth 관련 오류 메시지를 웹 라우팅 기준으로 통제할 수 있다.
- 단점:
  - 토큰을 JS가 읽을 수 있으므로 XSS에 민감하다.
  - cookie/localStorage/sessionStorage를 함께 다루므로 전용 유틸 경계를 지켜야 한다.
- 구현 시 주의점:
  - 토큰 저장/삭제는 `lib/auth.ts`와 auth route 외부에서 직접 다루지 않는다.
  - auth 관련 새 API는 먼저 `AuthProvider`와 route handler 경계를 검토한다.

## Revisit When

- httpOnly 세션 쿠키 기반 BFF 모델로 전환할 때
- refresh token, silent re-auth, 다중 공급자 로그인 정책이 필요해질 때

## References

- `frontend/components/auth/auth-provider.tsx`
- `frontend/lib/auth.ts`
- `frontend/app/auth/kakao/start/route.ts`
- `frontend/app/auth/kakao/finalize/route.ts`
- `frontend/app/api/auth/me/route.ts`
