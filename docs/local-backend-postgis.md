# Local Backend + PostGIS 실행 가이드

## 1) PostGIS 컨테이너 실행
```bash
cd backend
docker compose -f docker-compose.local.yml up -d
```

## 2) Spring Boot 실행
```bash
cd backend
SPRING_PROFILES_ACTIVE=docker ./gradlew bootRun
```

- `application-docker.yml`에서 로컬 기본값으로 아래를 사용합니다.
  - DB URL: `jdbc:postgresql://localhost:5432/bikeoasis`
  - USER: `postgres`
  - PASSWORD: `postgres`

## 3) 비밀번호 오류가 계속 날 때 (중요)
이미 생성된 Docker volume에는 이전 비밀번호가 남아있어 환경변수를 바꿔도 반영되지 않습니다.

```bash
cd backend
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d
```

그 다음 다시:
```bash
SPRING_PROFILES_ACTIVE=docker ./gradlew bootRun
```

## 4) 확인 명령어
```bash
docker compose -f backend/docker-compose.local.yml ps
docker compose -f backend/docker-compose.local.yml logs -f postgres
```
