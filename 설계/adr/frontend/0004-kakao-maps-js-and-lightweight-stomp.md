# FE-ADR-0004: 지도는 Kakao Maps JS, 실시간 채팅은 경량 STOMP 클라이언트

- Status: Accepted
- Date: 2026-03-10

## Context

- 현재 프론트 기능에서 지도는 브라우저 렌더링과 현재 위치 표시가 핵심이고, 실시간은 모임 채팅이 유일하다.
- 무거운 지도 추상화나 실시간 라이브러리를 미리 도입하면 구현 난이도와 운영 부담이 커진다.
- 카카오 지도와 브라우저 Geolocation API는 현재 웹 프론트 시나리오에 잘 맞는다.

## Decision

- 지도 렌더링은 `MapView` 컴포넌트가 Kakao Maps JS SDK를 브라우저에서 lazy-load 하는 방식으로 통일한다.
- 지도/위치/채팅이 있는 화면은 클라이언트 컴포넌트로 구현한다.
- 라이딩 기록과 L2 가이드는 브라우저 Geolocation API와 클라이언트 계산을 기본으로 한다.
- 실시간 채팅은 native `WebSocket` 위에 얇은 `SimpleStompClient` 래퍼를 둔 현재 구조를 유지한다.
- WebSocket/STOMP 사용 범위는 모임 채팅 페이지로 한정한다.

## Rationale

- Kakao Maps JS SDK는 현재 웹 타깃과 지역 서비스 맥락에 맞다.
- `MapView` 하나만 SDK 로딩 책임을 가지면 중복 로딩과 브라우저 전용 코드 확산을 막을 수 있다.
- 경량 STOMP 래퍼는 채팅 요구사항을 충족하면서도 의존성을 최소화한다.

## Consequences

- 장점:
  - 지도와 실시간 기능의 진입점이 명확하다.
  - 신규 기능이 생겨도 SDK 로딩 위치와 WebSocket 사용 범위를 쉽게 통제할 수 있다.
  - 클라이언트 브라우저 API와 화면 상태를 한 곳에서 다루기 쉽다.
- 단점:
  - 지도와 채팅 페이지는 서버 컴포넌트로 처리할 수 없다.
  - 채팅 재연결, heartbeat, offline queue 같은 고급 기능은 추가 구현이 필요하다.
- 구현 시 주의점:
  - 다른 컴포넌트에서 카카오 지도 script를 직접 삽입하지 않는다.
  - 실시간이 필요해 보여도 먼저 REST 재조회로 충분한지 검토한다.
  - 채팅 외 WebSocket 기능이 필요하면 새 ADR을 만든다.

## Revisit When

- 지도 SDK를 바꿔야 할 유지보수/약관 이슈가 생길 때
- 채팅 외 실시간 기능이 다수 생겨 공통 실시간 레이어가 필요해질 때

## References

- `frontend/components/map-view.tsx`
- `frontend/components/chat/meetup-chat.tsx`
- `frontend/lib/stomp.ts`
- `frontend/app/course/[id]/guide/page.tsx`
- `설계/12_아키텍처_런타임플로우.md`
