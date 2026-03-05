# 작업 일지 / 결과 보고서

- 작성일시: 2026-03-05 09:34:56 (KST)
- 작업명: MVP2 인증+익명 댓글 완성, 모바일 UI 연결, 레포 정리(커밋/푸시)
- 브랜치: master (origin/master)
- 범위(커밋): 6ecd082..7c3edbf

## 1. 이번 작업의 목표

- 더티 워크트리를 정리하고, 변경을 원자적 커밋으로 분리한 뒤 push까지 완료한다.
- MVP2(카카오 OIDC 로그인 + 익명 코스 댓글) 기능을 백엔드/모바일/문서까지 "동작 가능한 계약"으로 맞춘다.
- MVP3(코스 모임 REST + 정원 동시성) 구현의 안정성/성능 이슈(N+1)를 최소한으로 개선한다.

## 2. 완료된 작업(Deliverables)

- Repo hygiene:
  - 트래킹되던 Expo `*.log` 파일 제거 + ignore 규칙 추가
- Backend (MVP2 Auth/JWT):
  - App JWT 발급/검증 설정 + env 바인딩 추가
  - Kakao code(PKCE) -> token 교환 + id_token 검증 -> 서비스 JWT 발급
  - User에 provider/providerSub(카카오 sub) 매핑 필드 추가
- Backend (MVP2 Comments):
  - 코스 댓글 작성/조회/삭제(soft delete) + 신고 API
  - 운영용 댓글 숨김/해제(관리자 키) + 일일 레이트리밋
- Backend (MVP3 Meetups):
  - 모임 리스트에서 참가자 수/참가 여부 조회를 bulk로 바꿔 N+1 쿼리 위험 완화
- Mobile:
  - 공통 UI 프리미티브(`AppButton`, `AppCard`, `AppChip`, `ScreenContainer`) 추가
  - 설정 화면에서 카카오 code 교환 -> access token 저장
  - 코스 상세 화면에 댓글 UI(조회/작성/삭제/신고) 연결
  - access token 저장소를 AsyncStorage -> SecureStore로 변경(설계 문서 준수)
- Docs:
  - 프론트 문서에 Auth/Comments/API 매핑 및 디자인 토큰 문서 추가
  - 설계 문서(MVP2 인증/커뮤니티) 업데이트
  - 커뮤니티 개요 문서에서 meetup join endpoint 경로를 구현과 일치하도록 정리

## 3. 주요 커밋(요약)

- `8964318` chore: ignore Expo log artifacts
- `735832f` feat: add user auth provider fields
- `45d9fe1` feat: add app jwt config and env bindings
- `aaa496d` feat: add Kakao OIDC code exchange login
- `18dd66f` feat: add anonymous course comments and reports
- `b53a6a8` perf: reduce N+1 queries in meetup list
- `c911423` feat(mobile): add shared UI primitives
- `313cd62` feat(mobile): add auth token flow and comments UI
- `b36a897` docs(frontend): document auth, comments, and tokens
- `bd796ff` docs: update MVP2 auth and community specs
- `b91943d` fix(mobile): persist access token via SecureStore
- `7c3edbf` docs: align meetup join endpoint in community doc

## 4. 검증(Verification)

- Backend:
  - `backend/./gradlew.bat test` (PASS)
  - `backend/./gradlew.bat clean build` (PASS)
- Mobile:
  - `frontend/mobile/npx tsc --noEmit` (PASS)

## 5. 마일스톤 진척도(설계/14 기준)

- 기준 문서: `설계/14_개발계획_마일스톤_체크리스트.md`
- 산출 방식: Done=1, Partial=0.5, Todo=0

현황(보고 시점):

- M0 서버 베이스라인: Done (기존 구현)
- M1 Course Catalog: Done (기존 구현)
- M2 Featured 운영: Done (기존 구현)
- M3 RN 최소 기능: Done (기존 구현)
- M4 UGC 코스 생성(from-riding) + GPS 문서: Done (기존 구현)
- M5 Backoffice 최소 API: Todo
- M6 인증 + 코스 댓글(MVP2): Done (이번 작업으로 백/모바일/문서 정리 완료)
- M7 코스 모임 + 임시 채팅(MVP3): Partial
  - 모임 REST + 정원 동시성: Done
  - 채팅(WebSocket/STOMP): Todo

진척도(%):

- (Done 6개 * 1) + (Partial 1개 * 0.5) = 6.5
- 6.5 / 8 = 81.25%  -> 81%

## 6. 리스크/이슈/메모

- Mobile 의존성 경고: zustand가 내부적으로 사용하는 `use-sync-external-store`가 React 19 peer 범위를 완전히 따라오지 않아 npm 경고가 발생함(빌드/타입체크는 통과).
- Auth 토큰 UX: 현재는 Settings에서 수동 code 교환(UI) 방식이라 "원클릭 로그인" UX는 다음 단계에서 개선 필요.

## 7. 다음 작업(Next)

- M5 Backoffice 최소 API(태그/경고/메타데이터 재계산) 착수
- MVP3 모임 UI(모임 리스트/상세/join/leave) 모바일 화면 추가
- (후순위) M7 채팅(WebSocket/STOMP) 설계/구현 착수
