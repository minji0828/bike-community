# BE-ADR-0005: 쓰기 API는 인증 필수, 소유권은 서버가 JWT에서 확정한다

- Status: Accepted
- Date: 2026-03-10

## Context

- 라이딩 저장, 코스 생성, 라이딩 기반 코스 생성 같은 쓰기 API가 요청 바디의 `userId`, `ownerUserId`를 그대로 받아 저장하면 소유권 위조가 가능하다.
- 현재 MVP1은 읽기 경험을 최대한 열어두되, 사용자 생성 데이터의 무결성과 감사 가능성은 보장해야 한다.
- 프론트와 AI 구현자가 문서만 보고 작업할 때도 "누가 소유자인가"를 다시 묻지 않도록 신뢰 원천을 하나로 고정할 필요가 있다.

## Options Considered

- 옵션 A: 현재처럼 요청 바디의 `userId` 또는 `ownerUserId`를 신뢰한다.
  - 장점: 구현이 가장 단순하고 기존 DTO를 거의 유지할 수 있다.
  - 단점: 다른 사용자 ID를 넣어도 서버가 막지 못하므로 권한 모델이 사실상 무너진다.
  - 포기 이유: 소유권 위조와 데이터 오염 위험이 커서 운영 가능한 정책이 아니다.
- 옵션 B: 쓰기 API는 인증 필수로 두고, 사용자 식별은 JWT claims에서만 읽는다.
  - 장점: 소유권 위조를 서버 경계에서 차단할 수 있고 프론트 계약도 단순해진다.
  - 단점: 로그인 전 저장 같은 일부 UX는 별도 게스트 정책이 필요하다.
  - 채택 이유: 현재 MVP1에서 가장 명확하고 안전한 기본선이다.
- 옵션 C: 비로그인도 허용하되 `deviceUuid` 같은 익명 식별자를 별도 운영한다.
  - 장점: 온보딩은 좋고 비회원 저장도 가능하다.
  - 단점: 소유권 이전, 중복 기기, 데이터 병합 정책이 함께 필요하다.
  - 포기 이유: MVP1 범위를 벗어나는 정책 설계가 추가로 필요하다.

## Decision

- `POST /api/v1/ridings`, `POST /api/v1/courses`, `POST /api/v1/courses/from-riding`, `POST /api/v1/courses/gpx` 같은 사용자 생성 write API는 인증 필수로 둔다.
- 사용자 식별과 소유권은 요청 바디가 아니라 서비스 JWT의 `sub` claim에서만 확정한다.
- 요청 DTO에서는 소유권 필드를 받지 않으며, 들어오더라도 비즈니스 로직에 사용하지 않는다.
- 기존 리소스를 기반으로 생성하거나 수정할 때는 서버가 리소스 소유자와 요청자를 비교해 권한을 검증한다.
- 읽기 API는 현재 제품 탐색성을 위해 공개를 유지하되, write와 개인 데이터 접근은 인증 경계 안에 둔다.

## Rationale

- API 계약을 "읽기 공개, 쓰기 인증"으로 고정하면 프론트와 AI 구현 프롬프트가 단순해진다.
- 소유권 신뢰 원천을 JWT 하나로 제한하면 서비스 계층에서 일관된 권한 검증이 가능하다.
- 비로그인 저장 UX를 포기하는 트레이드오프가 있지만, 현재 단계에서는 보안과 데이터 무결성이 더 중요하다.

## Consequences

- 장점:
  - 소유권 위조와 임의 사용자 데이터 생성 위험을 크게 줄인다.
  - 프론트는 `userId`를 채우지 않아도 되어 폼과 DTO가 단순해진다.
  - 감사 로그와 운영 정책이 명확해진다.
- 단점:
  - 로그인 전 라이딩 저장 같은 경량 UX는 바로 제공할 수 없다.
  - 게스트 저장이나 디바이스 기반 임시 저장이 필요해지면 새 정책과 ADR이 필요하다.
- 구현 시 주의점:
  - 서비스 계층에서만 사용자 소유권을 확정하고, 컨트롤러/DTO에서 사용자 ID를 받는 패턴을 다시 추가하지 않는다.
  - 리소스 소유자 검증 실패는 `403 FORBIDDEN`으로 일관되게 응답한다.
  - 프론트 문서와 API 명세에서 `userId`, `ownerUserId` 입력 예시는 제거한다.

## Revisit When

- 비회원 저장 또는 디바이스 기반 임시 라이딩이 필요해질 때
- BFF 세션 쿠키 기반 인증으로 전환할 때
- 관리자 대리 생성 같은 운영 기능이 추가될 때

## References

- `docs/04_API_상태계약.md`
- `backend/src/main/java/com/bikeoasis/global/config/SecurityConfig.java`
- `backend/src/main/java/com/bikeoasis/domain/riding/service/RidingService.java`
- `backend/src/main/java/com/bikeoasis/domain/course/service/CourseService.java`
- `backend/src/test/java/com/bikeoasis/global/config/WriteApiSecurityTest.java`
