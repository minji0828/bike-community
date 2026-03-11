# 인증 설계: 카카오 소셜 로그인(OAuth2 + OIDC)

- 문서 ID: AUTH-KAKAO-OIDC
- 버전: v1.0
- 작성일: 2026-03-11
- 상태: 활성

목적:

- 모바일 1차 클라이언트와 현재 저장소 웹 구현체가 같은 카카오 로그인 계약을 공유하도록 한다.
- 서버는 카카오 code 교환과 `id_token` 검증을 담당하고, 클라이언트는 PKCE 시작과 state/nonce 관리를 담당한다.

관련 문서:

- `docs/04_API_상태계약.md`
- `설계/35_모바일_클라이언트_개발_가이드.md`
- `설계/29_프론트엔드_개발_가이드.md`
- `설계/adr/frontend/0002-kakao-auth-via-next-routes-and-backend-jwt.md`

---

## 0. 기본 결정

- 제품의 1차 클라이언트는 모바일 앱이다.
- 현재 저장소 웹 앱도 같은 백엔드 인증 API를 사용한다.
- 인증 방식은 Authorization Code + PKCE를 기본으로 한다.
- 서버가 카카오 `id_token`을 검증하고, 서비스용 JWT를 발급한다.
- 일반 API 호출에는 카카오 access token이 아니라 서비스 JWT만 사용한다.

---

## 1. 왜 OIDC인가

- OAuth2만으로도 인가 코드를 교환할 수 있지만, OIDC의 `id_token`은 로그인 관점의 표준 claim과 JWKS 검증 체계를 제공한다.
- `sub`를 서비스 내 provider 식별자로 고정할 수 있다.
- 닉네임 같은 프로필 값도 최소한으로 가져올 수 있다.

---

## 2. 권장 플로우

### 2.1 모바일 기준 플로우

1. 모바일 앱이 `code_verifier`, `code_challenge`, `state`, `nonce`를 생성한다.
2. 카카오 authorize로 이동한다.
3. 앱 딥링크/리다이렉트로 `code`를 수신한다.
4. 앱이 백엔드 `POST /api/v1/auth/kakao`로 `code`, `codeVerifier`, `redirectUri`, `nonce`를 전달한다.
5. 백엔드가 카카오 token endpoint와 통신해 토큰을 교환한다.
6. 백엔드가 `id_token`을 검증한다.
7. 백엔드가 서비스 JWT를 발급한다.
8. 앱은 secure storage에 서비스 JWT를 저장하고 `/api/v1/auth/me`로 재검증한다.

### 2.2 현재 저장소 웹 기준 플로우

1. 웹 앱이 same-origin route에서 PKCE/state/nonce를 준비한다.
2. 브라우저가 카카오 authorize로 이동한다.
3. callback route가 `code`와 `state`를 수신한다.
4. 웹 앱이 백엔드 `POST /api/v1/auth/kakao`를 호출한다.
5. 이후 흐름은 모바일과 동일하다.

---

## 3. 서버 책임

### 3.1 `id_token` 검증

- Signature: Kakao JWKS로 검증
- Issuer: `https://kauth.kakao.com`
- Audience: 카카오 client id
- Expiration: `exp` 검증
- Nonce: 클라이언트가 보냈다면 일치 검증

### 3.2 redirectUri 검증

- 허용된 redirectUri 목록과 비교한다.
- 목록에 없는 redirectUri는 즉시 실패시킨다.

### 3.3 사용자 업서트

- `provider=KAKAO`, `providerSub=sub` 조합으로 사용자를 찾는다.
- 없으면 신규 사용자를 만든다.
- 닉네임이 비어 있으면 기본값으로 대체한다.

---

## 4. 서비스 토큰 정책

- 서비스 JWT에는 최소 `sub(userId)`를 담는다.
- 프론트 초기 렌더 편의를 위해 `username`을 claim으로 담을 수 있다.
- 모바일은 secure storage, 웹은 현재 구현체의 auth 저장소 유틸을 사용한다.
- 일반 API는 `Authorization: Bearer <service-jwt>`로 호출한다.

### 4.1 인증 정책 코드

| 정책코드 | 항목 | 정책 정의 |
|---|---|---|
| AUTH-P-001 | 인증 방식 | 카카오 로그인은 Authorization Code + PKCE를 기본으로 한다. |
| AUTH-P-002 | 서버 검증 | 백엔드는 `id_token`의 signature, iss, aud, exp, nonce를 검증한다. |
| AUTH-P-003 | redirectUri 허용 목록 | 허용된 redirectUri만 code 교환을 수행한다. |
| AUTH-P-004 | 서비스 토큰 | 일반 API 호출에는 서비스 JWT만 사용한다. |
| AUTH-P-005 | 저장소 | 모바일은 secure storage, 웹은 auth 저장소 유틸을 사용한다. |

---

## 5. API 계약

### 5.1 POST `/api/v1/auth/kakao`

Request:

```json
{
  "code": "authorization-code",
  "codeVerifier": "pkce-verifier",
  "redirectUri": "bikeoasis://auth/kakao/callback",
  "nonce": "random-nonce"
}
```

Response:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accessToken": "service-jwt",
    "expiresInSec": 3600
  }
}
```

### 5.2 GET `/api/v1/auth/me`

- 서비스 JWT가 유효한지와 현재 사용자 정보를 재검증한다.

---

## 6. 보안/운영 메모

- `state`는 필수다.
- 모바일 앱에 client secret을 넣지 않는다.
- 토큰/로그에는 원문 Kakao token을 남기지 않는다.
- auth 교환 엔드포인트에는 rate limit을 적용한다.

근거:

- Kakao Login REST API: https://developers.kakao.com/docs/latest/en/kakaologin/rest-api
- OIDC discovery: https://kauth.kakao.com/.well-known/openid-configuration
