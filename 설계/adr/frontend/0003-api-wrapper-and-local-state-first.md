# FE-ADR-0003: API 연동과 클라이언트 상태는 얇은 래퍼 + 로컬 상태를 기본으로 한다

- Status: Accepted
- Date: 2026-03-10

## Context

- 현재 프론트 기능은 페이지 단위 오케스트레이션과 도메인별 API 함수 조합으로 충분히 관리 가능하다.
- 별도 전역 상태관리 도구를 도입하면 학습 비용과 일관성 문제가 생긴다.
- 백엔드 응답 포맷은 `ApiResponse<T>` envelope을 기본으로 사용한다.

## Decision

- 백엔드 HTTP 호출은 `frontend/lib/api.ts`의 `apiFetch` 또는 `appRouteFetch`를 통해서만 수행한다.
- 도메인별 API 함수는 `frontend/lib/*.ts`에 둔다.
- 공유 전역 상태는 현재 `AuthProvider`만 허용한다.
- 그 외 화면 상태, 로딩 상태, 에러 상태, 폼 상태는 페이지 또는 기능 컴포넌트의 로컬 상태로 관리한다.
- 새 전역 상태관리 라이브러리(Redux, Zustand, TanStack Query 등)는 새 ADR 없이 도입하지 않는다.
- 프론트 내부 지도 좌표 모델은 `{ lat, lng }`, API DTO 경계는 `{ lat, lon }`를 유지한다.

## Rationale

- 현재 기능 수와 데이터 흐름은 얇은 fetch 래퍼와 로컬 상태로 충분하다.
- 공통 에러 처리, 타임아웃, envelope 파싱을 한 곳으로 모으면 구현 일관성이 높아진다.
- 좌표 이름을 내부와 외부에서 구분하면 지도 렌더링과 API 계약 모두 읽기 쉬워진다.

## Consequences

- 장점:
  - fetch 규칙과 에러 형식이 통일된다.
  - 상태 흐름이 페이지 단위로 읽혀서 신규 구현이 단순하다.
  - 불필요한 추상화와 캐시 레이어를 피할 수 있다.
- 단점:
  - 페이지가 커지면 오케스트레이션 로직이 길어질 수 있다.
  - 고급 캐시/동기화가 필요한 시점에는 구조 재검토가 필요하다.
- 구현 시 주의점:
  - 페이지에서 raw `fetch`를 직접 쓰지 않는다. 단, Next route handler는 예외다.
  - 새 API 응답이 생기면 `lib/<domain>.ts`에서 타입과 adapter를 먼저 만든다.
  - `sample-data` fallback은 임시 UX 보완일 뿐 기본 패턴으로 복제하지 않는다.

## Revisit When

- 같은 데이터가 여러 페이지에서 강하게 공유되기 시작할 때
- 오프라인 캐시, optimistic update, background revalidation이 광범위하게 필요해질 때

## References

- `frontend/lib/api.ts`
- `frontend/lib/courses.ts`
- `frontend/lib/collections.ts`
- `frontend/lib/highlights.ts`
- `frontend/lib/ridings.ts`
- `frontend/components/auth/auth-provider.tsx`
