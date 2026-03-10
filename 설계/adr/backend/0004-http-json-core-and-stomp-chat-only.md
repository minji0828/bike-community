# BE-ADR-0004: 코어 transport는 HTTP JSON, 실시간은 모임 채팅에 한정

- Status: Accepted
- Date: 2026-03-10

## Context

- 대부분의 핵심 도메인 플로우는 CRUD, 조회, 저장, 재계산 중심이다.
- 실시간 통신이 필요한 현재 기능은 모임 임시 채팅이 사실상 유일하다.
- 모든 기능에 WebSocket/SSE를 도입하면 운영 복잡도와 장애 표면이 커진다.

## Decision

- 코스, 라이딩, POI, 컬렉션, 하이라이트, 댓글, 인증 등 일반 도메인 흐름은 `/api/v1` HTTP JSON API로 유지한다.
- WebSocket/STOMP는 `/ws-stomp` 경로의 모임 채팅과 채팅 히스토리 전달에만 사용한다.
- 새 기능은 기본적으로 HTTP JSON을 먼저 선택하고, 실시간이 필수일 때만 새 ADR로 확장한다.
- 서버 푸시가 필요해 보여도 우선 폴링/재조회로 충분한지 먼저 검토한다.

## Rationale

- 현재 제품 단계에서는 단순성이 더 중요하다.
- HTTP JSON은 프론트와 백엔드 모두 디버깅, 테스트, 문서화가 쉽다.
- 실시간 통신 범위를 채팅으로 한정하면 인증, 권한, 연결 복구 범위를 통제하기 쉽다.

## Consequences

- 장점:
  - API 설계와 테스트가 단순해진다.
  - 대부분의 기능이 Swagger/OpenAPI와 일반 통합 테스트 범위에 들어온다.
  - 운영 시 WebSocket 문제와 일반 API 문제를 분리하기 쉽다.
- 단점:
  - 실시간성이 약한 일부 UX는 재조회 기반으로 구현해야 한다.
  - 채팅 외 기능에서 즉시성 요구가 생기면 별도 확장 설계가 필요하다.
- 구현 시 주의점:
  - WebSocket/STOMP를 새 기능에 재사용하려면 먼저 권한 모델과 실패 복구를 ADR로 고정한다.
  - REST 응답과 STOMP payload는 서로 다른 transport라고 보고 문서와 DTO를 분리한다.

## Revisit When

- Live share, 실시간 위치 공유, 운영 대시보드 push가 핵심 기능이 될 때
- 폴링 비용이나 UX 한계가 명확해질 때

## References

- `설계/11_API_명세.md`
- `설계/19_MVP2_커뮤니티_API_명세.md`
- `설계/20_MVP2_동시성_통신_락설계.md`
- `설계/22_MVP3_모임_채팅_설계.md`
