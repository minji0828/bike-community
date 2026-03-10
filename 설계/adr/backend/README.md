# 백엔드 ADR 인덱스

- 범위: Spring Boot, DB/PostGIS, 인증, API transport, 백엔드 저장 전략
- 번호 정책: 백엔드 폴더 안에서 독립적으로 증가
- 템플릿: `설계/adr/backend/_template.md`

## ADR 목록

| ID | 상태 | 제목 | 한 줄 요약 |
|---|---|---|---|
| 0001 | Accepted | Spring Boot 기반 모듈러 모놀리스 + Postgres/PostGIS | 현재 저장소의 백엔드는 단일 배포 단위의 도메인 패키지 구조로 유지한다 |
| 0002 | Accepted | 공간 연산 경계와 좌표 정책 | 공간 저장과 검색은 서버/PostGIS가 담당하고 내부 좌표 순서는 lon,lat로 고정한다 |
| 0003 | Accepted | Kakao OIDC + 서비스 JWT 인증 모델 | 소셜 로그인은 카카오 OIDC를 쓰되, API 보호는 우리 서비스 JWT로 분리한다 |
| 0004 | Accepted | 코어 transport는 HTTP JSON, 실시간은 모임 채팅에 한정 | 일반 도메인 흐름은 REST JSON, WebSocket/STOMP는 모임 채팅에만 사용한다 |
| 0005 | Accepted | 쓰기 API 인증과 서버 소유권 확정 | 사용자 생성 write는 인증 필수로 두고 소유권은 JWT 기준으로만 확정한다 |
