# Backend 로컬 개발 실행 가이드

> 저장소 전체 기준 실행 문서는 `docs/local-dev-runbook.md` 입니다.  
> 이 문서는 **백엔드 전용 보조 메모**만 담습니다.

로컬에서 **PostgreSQL/PostGIS(Docker)** + **Spring Boot(Gradle)** 를 바로 띄우는 절차입니다.

## 0) 사전 준비

- Docker Desktop (Windows) 또는 Docker Engine (WSL/Linux)
- Java 17

## 1) 로컬 DB(PostGIS) 실행

`backend/` 폴더에서:

```bash
docker compose -f docker-compose.local.yml up -d
docker ps
```

- 컨테이너 이름: `bikeoasis-postgres-local`
- 포트: `15432` (호스트) → `5432` (컨테이너)
- DB: `bikeoasis`
- USER/PW: `postgres / postgres`

## 2) 로컬 프로필 설정 파일 준비(시크릿 커밋 방지)

이 레포는 `backend/src/main/resources/application-local.yml` 을 `.gitignore` 로 제외합니다.

아래 예시 파일을 복사해 **로컬에서만** 사용하세요.

```bash
cp backend/src/main/resources/application-local.example.yml backend/src/main/resources/application-local.yml
```

포인트:

- `spring.datasource.url=jdbc:postgresql://localhost:15432/bikeoasis`
- `spring.datasource.password=postgres` (docker-compose.local.yml 기본과 일치)
- `app.jwt.secret` 는 로컬 개발용(32바이트 이상)
- WebSocket origin을 제한하려면 `APP_WEBSOCKET_ALLOWED_ORIGIN_PATTERNS=http://localhost:3000`

## 3) 백엔드 실행

### (WSL / macOS / Linux)

```bash
cd backend
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
```

### (Windows PowerShell)

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE="local"
.\gradlew.bat bootRun
```

## 4) 헬스체크 / Swagger

- Health: `GET http://localhost:8080/actuator/health`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`

## 5) 종료

```bash
# Spring은 Ctrl+C
cd backend
docker compose -f docker-compose.local.yml down
```
