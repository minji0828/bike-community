# BikeOasis

자전거 산책/탐방에서 출발해 **여행형 라이딩 코스 + 모임 + 실시간 채팅**까지 확장 중인 프로젝트입니다.

## 현재 기준

- Backend-first: Spring Boot 3.5 + PostgreSQL/PostGIS
- Frontend: Next.js(App Router) 웹 클라이언트
- 로그인: Kakao OAuth/OIDC
- 핵심 경험: 코스 탐색 → 모임 참가 → 단체채팅 → 라이딩 기록 → 코스화

## 빠른 시작

가장 먼저 아래 두 문서를 보세요.

1. 전체 로컬 실행: `docs/로컬_개발_실행가이드.md`
2. 설계/기획 기준: `설계/README.md`

## 문서 체계

- `docs/README.md`
  - 실행/배포/운영/품질 런북
- `설계/README.md`
  - 제품/도메인/정책/API/로드맵 설계 문서
- `work-reports/README.md`
  - 작업 보고 규칙

## 로컬 품질 게이트

```bash
cd backend && ./gradlew test
cd frontend && npm run check
```

## 현재 우선순위

1. 로그인/채팅/코스 기본 흐름 안정화
2. 문서와 코드의 단일 진실원천 정리
3. Phase 1 확장 기능(Trip Collection + Highlights) 준비
