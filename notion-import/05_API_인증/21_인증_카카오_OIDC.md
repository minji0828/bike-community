# 21_인증_카카오_OIDC

- 원본(SSOT): `설계/21_인증_카카오_OIDC.md`
- Notion 용도: 탐색/공유용(원본 변경 우선)

---

# 인증 설계: 카카오 소셜 로그인(OAuth2 + OIDC)

- 문서 ID: AUTH-KAKAO-OIDC
- 버전: v0.1
- 작성일: 2026-03-04
- 상태: 초안(MVP2)

목적:

- MVP2에서 "댓글 작성" 같은 write 기능을 위해 최소 인증을 도입한다.
- 사용성(유저 편의)을 최우선으로 카카오 소셜 로그인만 지원한다.

관련 문서:

- MVP2 스코프: `설계/17_MVP2_요구사항정의서.md`
- 커뮤니티 API: `설계/19_MVP2_커뮤니티_API_명세.md`
- 기술 레지스트리: `설계/15_기술스택_레지스트리.md`

---

## 0. 왜 OIDC인가

- OAuth2만으로도 가능하지만, OIDC의 `id_token(JWT)`는 "로그인" 관점에서 표준화된 사용자 식별(sub)과 검증 방법(JWKS)을 제공한다.
- 클라이언트(RN) 입장에서는 카카오 계정으로 원클릭 로그인 UX를 만들 수 있다.

---

## 1. 권장 플로우(React Native)

### 1.1 Authorization Code + PKCE

원칙:

- RN은 public client이므로 client_secret을 앱에 넣지 않는다.
- PKCE(S256)로 code 탈취 리스크를 줄인다.

흐름(요약):

1) RN: `code_verifier`/`code_challenge` 생성
2) RN: 카카오 authorize로 이동(state 포함)
3) RN: redirect/deeplink로 authorization `code` 수신
4) RN -> 서버: `code`(+ `code_verifier` + redirectUri) 전달
5) 서버 -> 카카오: token endpoint로 code 교환
6) 서버: `id_token` 검증(iss/aud/signature/exp)
7) 서버: 서비스용 access token 발급(JWT 권장)

---

## 2. 서버 책임(검증)

### 2.1 id_token 검증 체크

- Signature: Kakao JWKS로 검증
- Issuer(iss): `https://kauth.kakao.com`
- Audience(aud): 카카오 REST API Key(client_id)
- Expiration(exp): 만료 확인
- Nonce: 사용했다면 일치 확인(선택)
  - 메모: RN이 nonce를 사용한다면, 서버로 nonce를 함께 전달해 id_token의 `nonce`와 대조한다.

근거(공식):

- Kakao Login REST API: https://developers.kakao.com/docs/latest/en/kakaologin/rest-api
- OIDC discovery: https://kauth.kakao.com/.well-known/openid-configuration

---

## 3. 서비스 토큰(우리 API 보호)

MVP2 권장:

- 서버가 JWT(access token)를 발급
- RN은 `Authorization: Bearer <token>`으로 write API 호출

대안:

- 세션 쿠키: 모바일에서는 관리가 번거롭고 CORS/세션 만료 UX가 어려울 수 있음

---

## 4. 사용자 모델 매핑(초안)

현재 User 엔티티가 email/password 기반이므로, 소셜 로그인 최소 확장을 권장한다.

권장 필드(초안):

- provider (enum: kakao)
- provider_sub (unique) = OIDC `sub`
- email (nullable)
- username/displayName (nullable)

정책:

- 최초 로그인 시 user를 upsert
- email이 없거나 비공개면 null 허용

익명 표시(댓글):

- 로그인은 "권한/스팸 방지" 목적이며, 댓글 작성자 정보는 공개하지 않는다.
- 댓글 UI/API는 작성자를 항상 `익명`으로 표시한다.

---

## 5. API 초안(Auth)

### 5.1 카카오 로그인 교환

- POST `/api/v1/auth/kakao`

Request

```json
{
  "code": "...",
  "codeVerifier": "...",
  "redirectUri": "...",
  "nonce": "..."
}
```

Response

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accessToken": "...",
    "expiresInSec": 3600
  }
}
```

---

## 6. 보안/운영 메모

- state 필수(CSRF)
- 토큰은 RN secure storage에 저장(AsyncStorage 금지)
- 레이트리밋: auth 교환/댓글 작성에 적용

Spring 참고:

- Spring Security OAuth2 Login: https://docs.spring.io/spring-security/reference/servlet/oauth2/login/index.html
- Spring Security OIDC: https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html#oauth2login-oidc
- Spring Resource Server JWT: https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html
