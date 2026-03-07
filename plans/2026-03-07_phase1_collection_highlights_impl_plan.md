# 2026-03-07 Phase 1 Collection + Highlights 구현 계획

## 목표

- Phase 1 첫 vertical slice로 Collection + Highlights를 실제 동작 수준까지 구현한다.
- backend-first로 신규 데이터 모델/API를 만들고, 프론트엔 최소 UI만 연결한다.

## 범위

### Backend
- Collection CRUD(최소: 생성, 내 목록, 상세)
- Collection에 course 추가
- Course Highlight 조회/생성
- 공개 범위/권한 최소 정책 반영

### Frontend
- 코스 상세에서 Highlight 목록 조회/작성
- 코스 상세에서 컬렉션 생성/담기
- 컬렉션 상세 페이지 1개

## 비범위

- Highlight 수정/삭제
- 신고/숨김 운영 플로우 전체
- 컬렉션 공유 링크 별도 발급
- 지도용 커스텀 Highlight 마커 고도화

## 정책 초안

### Collection
- `private`: 작성자만 조회
- `unlisted`: 링크를 아는 사람 조회
- `public`: 누구나 조회
- 생성/편집/코스 추가는 소유자만 가능

### Highlight
- 타입: `viewpoint`, `restroom`, `water`, `cafe`, `danger`, `photo`, `note`
- `public`: 누구나 조회 가능
- `private`: 작성자만 조회 가능
- 생성은 로그인 사용자만 가능

## 작업 순서

1. 설계/정책/API 문서 갱신
2. backend entity/repository/service/controller/dto 구현
3. backend 테스트
4. frontend API client + course detail UI + collection detail UI 구현
5. frontend check
6. E2E 관점 문서/보고서 정리

## 검증 기준

- 로그인 사용자가 collection 생성 가능
- 코스를 collection에 추가 가능
- 코스 상세에서 highlight 조회 가능
- 로그인 사용자가 highlight 작성 가능
- `./gradlew test` / `npm run check` 통과

## 리스크

- 신규 엔티티가 많아져 서비스/컨트롤러/응답 DTO가 한 번에 늘어난다.
- 코스 상세 페이지에 기능이 몰려 있어 UI는 최소 추가만 허용한다.
