# Phase 1 실행 계획 - Trip Collection + Highlights

- 상태: Draft
- 작성일: 2026-03-07
- 목표: 여행형 라이딩 도메인에서 코스 단건 소비를 넘어, **여러 코스를 하나의 여행 계획으로 묶고 현장성 정보를 축적**하는 첫 확장 기능을 구현한다.

## 1. 왜 이 기능이 먼저인가

현재 서비스는:

- 코스 보기
- 모임 만들기/참가
- 단체채팅
- 라이딩 기록 → 코스화

까지는 되지만, 실제 여행형 사용성은 아직 약하다.

가장 먼저 필요한 것은:

1. 여러 코스를 일정 단위로 묶는 기능
2. 현장에서 바로 도움이 되는 포인트/메모 정보

이다.

## 2. Scope

### 2-1. Trip Collection

- 사용자는 여러 코스를 한 컬렉션(예: 1박 2일 강원 라이딩)으로 묶을 수 있다.
- 컬렉션에 제목, 설명, 지역, 일정 메모를 남길 수 있다.
- 컬렉션은 `private / unlisted / public` 공개 범위를 가진다.

### 2-2. Highlights

- 사용자는 코스 위 특정 포인트에 하이라이트를 남길 수 있다.
- 예시:
  - 전망 포인트
  - 보급/화장실
  - 위험 구간
  - 사진 스팟
- 신고/숨김 정책이 필요하다.

## 3. 기능 분해

### Backend

1. Collection 도메인
   - entity / repository / service / controller / dto
2. Collection에 course 연결
3. Highlight 도메인
   - 좌표 기반 point + type + note + visibility
4. 권한 정책
   - 컬렉션 소유자 편집
   - 하이라이트 작성자/관리자 제어

### Frontend

1. 컬렉션 목록/상세 UI
2. 코스 상세에서 “컬렉션에 담기”
3. 코스 지도 위 하이라이트 마커 렌더
4. 하이라이트 작성 시트/폼

### Docs/Policy

1. API 명세 확장
2. 정책 문서 확장
3. E2E 시나리오 추가

## 4. 정책 초안

### Collection 공개 범위

- `private`: 작성자만 조회
- `unlisted`: 링크 아는 사람 조회
- `public`: 검색/공개 노출 가능

### Highlight 타입

- `viewpoint`
- `restroom`
- `water`
- `cafe`
- `danger`
- `photo`
- `note`

### Highlight 운영 정책

- 본문 길이 제한
- 좌표 필수
- 신고 누적 시 숨김 검토

## 5. 개발 순서

1. 문서/정책/API 초안 확정
2. backend Collection CRUD
3. backend Highlight CRUD
4. frontend Collection 최소 UI
5. frontend 지도 위 Highlight 렌더
6. E2E/회귀 테스트

## 6. 완료 기준

- 로그인 사용자가 컬렉션 생성 가능
- 코스를 컬렉션에 추가 가능
- 코스 상세에서 하이라이트 조회 가능
- 하이라이트 1건 이상 작성 가능
- 정책/문서/API/E2E 문서가 동기화됨
