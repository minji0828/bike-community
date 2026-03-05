# 작업 일지 / 결과 보고서

- 작성일시: 2026-03-05 18:06:45 (KST)
- 작업명: 백엔드 로컬 PostGIS Docker 구성 및 bootRun 프로필 안정화
- 브랜치: master
- 범위(커밋): fa83580..fc30b04

## 1. 이번 작업의 목표

- 로컬 실행 시 반복 발생한 PostgreSQL 비밀번호 인증 실패를 재현 가능하게 해결한다.
- Docker Compose(PostGIS) + Spring profile 조합으로 `bootRun` 가능한 표준 경로를 만든다.

## 2. 완료된 작업(Deliverables)

- Backend:
  - `backend/docker-compose.local.yml` 추가
    - PostGIS 컨테이너 표준 실행 정의(`bikeoasis`, `postgres/postgres`, 5432)
    - healthcheck 추가
  - `backend/docker/postgres/init/01-init-postgis.sql` 추가
    - `postgis`, `postgis_topology` extension 자동 생성
  - `backend/src/main/resources/application-docker.yml` 추가
    - docker 로컬 실행용 datasource 기본값
    - 로컬 부팅용 `app.jwt.secret` 기본값
    - `poi.fetch.onstartup=false`
  - `backend/src/main/resources/application-local.yml.example` 상단에 quick start 주석 추가
- Docs:
  - `docs/local-backend-postgis.md` 추가
    - 실행/검증 명령 + 비밀번호 문제(volume 재생성) 해결 절차 문서화
  - `docs/README.md`에 문서 링크 추가

## 3. 변경된 API / 정책(있으면)

- API 스펙/엔드포인트 변경 없음
- 로컬 실행 정책 추가:
  - `SPRING_PROFILES_ACTIVE=docker` 로 실행 시 Docker PostGIS 기본값을 사용

## 4. 검증(Verification)

- 실행한 커맨드:
  - `cd backend && docker compose -f docker-compose.local.yml config`
  - `cd backend && docker compose -f docker-compose.local.yml up -d`
  - `cd backend && docker compose -f docker-compose.local.yml exec -T postgres psql -U postgres -d bikeoasis -c "SELECT extname FROM pg_extension WHERE extname IN ('postgis','postgis_topology');"`
  - (WSL 파일락 이슈 우회 검증) `/tmp` 복사본에서 `./gradlew classes`
  - (WSL 파일락 이슈 우회 검증) `/tmp` 복사본에서 `SPRING_PROFILES_ACTIVE=docker ./gradlew bootRun`
  - `curl -sf http://localhost:8080/actuator/health`
  - `cd backend && docker compose -f docker-compose.local.yml down`
- 결과:
  - compose config/up/down: PASS
  - PostGIS extension 조회: PASS (`postgis`, `postgis_topology` 확인)
  - bootRun(docker profile): PASS (앱 started 로그 확인)
  - health endpoint: PASS (`{"status":"UP"}`)
  - 참고: 원본 작업경로(`/mnt/c/...`)는 `.gradle` lock 파일 I/O 문제로 gradle 실행이 불안정하여 `/tmp` 복사본에서 부팅 검증 수행

## 5. 마일스톤 진척도(설계/14 기준)

- 기준 문서: `설계/14_개발계획_마일스톤_체크리스트.md`
- 산출 방식: Done=1, Partial=0.5, Todo=0
- 이번 보고 시점 진척도: 87.5%

## 6. 리스크/이슈/메모

- Docker volume이 남아있는 상태에서는 이전 비밀번호가 유지되어 인증 실패가 재발할 수 있음 (`down -v` 필요).
- WSL에서 `/mnt/c` 경로의 `.gradle/*lock` 파일 I/O 오류가 관찰됨(로컬 환경 이슈로 추정).

## 7. 다음 작업(Next)

- 사용자 PC 기준(Windows PowerShell)으로 `SPRING_PROFILES_ACTIVE=docker` 실행 확인
- 프론트 앱 API base URL을 현재 백엔드 주소(로컬/터널)로 맞춰 실기기 요청 재검증
- 지도 미표시/로그인 강제 플로우 변경분과 함께 통합 스모크 테스트
