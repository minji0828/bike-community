# BE-ADR-0003: Kakao OIDC + 서비스 JWT 인증 모델

- Status: Accepted
- Date: 2026-03-10

## Context

- MVP1까지는 읽기 중심 흐름이 많고, MVP2부터 댓글/신고/공유/모임/하이라이트 같은 write 기능 보호가 필요하다.
- 외부 소셜 로그인은 편의성이 높지만, 공급자 토큰을 그대로 내부 API 권한 모델로 쓰면 경계가 흐려진다.
- 현재 프론트는 Kakao 로그인 시작을 담당하고, 백엔드는 토큰 검증과 API 보호를 담당한다.

## Decision

- 사용자 로그인은 Kakao OIDC Authorization Code + PKCE 플로우를 사용한다.
- 프론트는 authorization code와 verifier/nonce를 전달하고, 백엔드가 Kakao 응답을 검증한다.
- 백엔드는 Kakao 토큰을 내부 API 권한 토큰으로 직접 사용하지 않고, 별도의 서비스 JWT를 발급한다.
- Spring Security Resource Server로 write API를 보호한다.
- 읽기 API는 기본 공개를 유지하되, 사용자 콘텐츠 write와 일부 개인 데이터 접근만 인증을 요구한다.

## Rationale

- 공급자 인증과 내부 권한 모델을 분리하면 향후 다른 로그인 공급자 추가나 권한 정책 변경이 쉬워진다.
- 서비스 JWT는 API 서버 입장에서 단순하고 일관된 인증 수단이다.
- 읽기 공개, 쓰기 보호 모델은 현재 제품 온보딩과 확장성을 동시에 만족시킨다.

## Consequences

- 장점:
  - 외부 공급자 토큰 세부사항이 도메인 API로 새지 않는다.
  - write API 보호 규칙을 Spring Security에서 일관되게 관리할 수 있다.
  - 향후 Apple/Google 같은 추가 공급자 확장이 쉬워진다.
- 단점:
  - 인증 단계가 두 번 생기므로 문서와 프론트 구현이 정확해야 한다.
  - JWT 키/만료/재로그인 정책을 운영해야 한다.
- 구현 시 주의점:
  - 백엔드는 서비스 JWT claims를 최소화하고 userId를 신뢰 원천으로 사용한다.
  - Kakao 토큰이나 id_token을 프론트의 일반 API 호출 토큰으로 쓰지 않는다.

## Revisit When

- 서비스 JWT 대신 BFF 세션 쿠키가 더 적합해질 때
- 다중 디바이스 세션 제어나 refresh token 정책이 필요해질 때

## References

- `backend/src/main/java/com/bikeoasis/global/config/SecurityConfig.java`
- `backend/src/main/java/com/bikeoasis/domain/auth/service/AppTokenService.java`
- `설계/17_MVP2_요구사항정의서.md`
- `설계/19_MVP2_커뮤니티_API_명세.md`
- `설계/21_인증_카카오_OIDC.md`
