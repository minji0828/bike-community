# 작업 일지 / 결과 보고서

- 작성일시: 2026-03-05 08:58 (KST)
- 작업명: MVP3 모임 REST(정원 동시성) + 라이딩->코스(from-riding) + GPS 추적/기록 설계 고정
- 브랜치: master
- 범위(커밋): 804c4a2..6ecd082

## 1. 이번 작업의 목표

- MVP3 착수: 코스 모임 REST API를 먼저 구현하고, join 동시성(정원/중복 참가)을 DB 락 + unique로 안전하게 처리한다.
- 라이딩 기록을 코스로 전환하는 서버 API를 만들고, 모바일이 이 API를 사용하도록 정리한다.
- "내 경로"를 위한 GPS 추적/기록 정책을 문서(SSOT)로 고정한다.

## 2. 완료된 작업(Deliverables)

- Backend (MVP3 Meetups):
  - 코스 모임 생성/목록/상세/join/leave REST 구현
  - 동시성: join 시 모임 row lock 기반으로 정원 체크 + 참가자 unique 제약 기반 중복 방지
  - Security: 모임 생성/join/leave는 인증 필요

- Backend (M4 from-riding):
  - `POST /api/v1/courses/from-riding` 추가(라이딩 기반 코스 생성)

- Mobile:
  - RideScreen에서 "코스로 저장" 플로우를 `from-riding` API 호출로 전환

- Docs(SSOT):
  - `설계/22_MVP3_모임_채팅_설계.md` 추가(모임 REST + 동시성 체크리스트)
  - `설계/23_라이딩_GPS_추적_기록_설계.md` 추가(GPS 샘플링/노이즈/업로드 정책)
  - 관련 문서(`설계/11_API_명세.md`, `설계/06_유저플로우.md`, `설계/04_정책정의서.md` 등) 갱신
  - `설계/00_START_HERE.md`에 "작업 끝나면 커밋/푸시" 운영 규칙 반영

## 3. 변경된 API / 정책(있으면)

- Meetup:
  - `POST /api/v1/courses/{courseId}/meetups`
  - `GET /api/v1/courses/{courseId}/meetups?status=open|all`
  - `GET /api/v1/meetups/{meetupId}`
  - `POST /api/v1/meetups/{meetupId}/join`
  - `POST /api/v1/meetups/{meetupId}/leave`
- Course:
  - `POST /api/v1/courses/from-riding`

## 4. 검증(Verification)

- 당시 실행 로그는 커밋에 남지 않아 확인 불가
- 사후(현재) 기준으로는 다음이 통과함:
  - Backend: `backend/./gradlew.bat test`, `backend/./gradlew.bat clean build`
  - Mobile: `frontend/mobile/npx tsc --noEmit`

## 5. 마일스톤 진척도(설계/14 기준)

- 기준 문서: `설계/14_개발계획_마일스톤_체크리스트.md`
- 산출 방식: Done=1, Partial=0.5, Todo=0

현황(해당 시점 기준, 사후 정리):

- M0 서버 베이스라인: Done
- M1 Course Catalog: Done
- M2 Featured 운영: Done
- M3 RN 최소 기능: Done
- M4 UGC 코스 생성(from-riding) + GPS 문서: Done
- M5 Backoffice 최소 API: Todo
- M6 인증 + 코스 댓글(MVP2): Todo
- M7 코스 모임 + 임시 채팅(MVP3): Partial
  - 모임 REST + 정원 동시성: Done
  - 채팅(WebSocket/STOMP): Todo

진척도(%):

- Done 5개 = 5
- Partial 1개 = 0.5
- 5.5 / 8 = 68.75%  -> 69%

## 6. 리스크/이슈/메모

- 모임 동시성은 DB 락 + unique 기반이라, 모바일 재시도/중복 요청이 들어와도 서버가 멱등적으로 처리할 수 있도록 예외 처리 정책을 계속 점검해야 함
- MVP3 채팅(WebSocket)은 Non-Goal로 남겨둔 상태(REST+폴링으로 먼저 학습/검증)

## 7. 다음 작업(Next)

- MVP2 인증/댓글(M6) 구현으로 write 액션의 최소 권한 모델 확정
- 모바일: 모임 리스트/상세/join/leave UI 연결
