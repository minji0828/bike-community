# Repository Audit / 문서·아키텍처 정리 메모

- 작성일: 2026-03-07
- 목적: 현재 문서 구조와 코드 구조를 점검하고, 무엇이 기준 문서인지 명확히 한다.

## 1. 문서 체계 판단

### 유지해야 하는 축

1. `README.md`
   - 저장소 입구
2. `docs/README.md`
   - 실행/배포/운영/검증 문서 인덱스
3. `설계/README.md`
   - 기획/정책/API/로드맵 문서 인덱스
4. `work-reports/README.md`
   - 작업 보고 규칙

### 중복처럼 보이지만 당장 삭제하지 않은 문서

- `backend/LOCAL_DEV.md`
  - `docs/local-dev-runbook.md`와 일부 겹치지만, 백엔드 전용 로컬 메모로 유지
- 전략 비교 문서들
  - 현재는 제품 방향 전환의 결정 기록 역할이 있으므로 유지

### 이번 정리 원칙

- 문서를 지우기보다 **역할을 분류**한다.
- “현재 기준 문서”와 “의사결정 이력”을 분리해 읽는 순서를 줄인다.

## 2. 코드 구조 판단

### Backend

장점:

- 도메인별 controller/service/repository/entity/dto 구분이 명확하다.
- Spring Security, OIDC, WebSocket 채팅까지 이미 기능 축이 분리되어 있다.

보강 포인트:

1. 인증 사용자 추출 로직 중복
2. WebSocket origin 허용 범위가 설정값이 아닌 `*`
3. 컨트롤러/보안 경계 테스트가 서비스 테스트 대비 약함

### Frontend

장점:

- Next.js App Router 구조로 페이지 단위 책임이 나뉘어 있다.
- 카카오 로그인, 모임, 채팅, 코스 페이지가 기능별로 분리되어 있다.

보강 포인트:

1. auth bootstrap 로직이 provider 한 군데에 집중돼 있지만 상태 모델이 단순 boolean 중심
2. backend-direct fetch와 same-origin app route fetch 책임이 혼재
3. 다른 PC에서 dev 캐시/재실행 문제를 줄이는 runbook/script가 필요

## 3. 이번 정리에서 바로 반영할 내용

1. 루트 README 추가
2. 문서 인덱스 정비
3. 다른 PC에서도 재현 가능한 실행 절차 보강
4. Backend 인증 사용자 resolver 공통화
5. Frontend auth bootstrap / same-origin API 계층 정리

## 4. 이번 정리에서 보류한 내용

- `CourseService` 대분리
- STOMP hook/state machine 대수술
- 설계 문서 삭제/이름 대규모 변경

이 항목들은 영향 범위가 커서, Phase 1 기능 개발 전후 별도 작업으로 분리하는 것이 안전하다.
