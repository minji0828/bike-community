# Predeploy Checklist

## Frontend (Next.js)

```bash
cd frontend
npm ci
npm run check
PORT=3001 npm run start
```

Smoke checks:

- `curl -sS http://localhost:3001/api/health`
- `curl -I -sS http://localhost:3001/`

필수 env:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_KAKAO_CLIENT_ID`
- `NEXT_PUBLIC_KAKAO_REDIRECT_URI`
- `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`

## Backend (Spring Boot)

```bash
cd backend
./gradlew test
GRADLE_USER_HOME=/tmp/gradle-home ./gradlew --no-daemon --project-cache-dir /tmp/gradle-project-cache -Dorg.gradle.vfs.watch=false clean build
set -a && source .env && set +a
SERVER_PORT=8081 GRADLE_USER_HOME=/tmp/gradle-home ./gradlew --project-cache-dir /tmp/gradle-project-cache -Dorg.gradle.vfs.watch=false bootRun
```

Smoke checks:

- `curl -sS http://localhost:8081/api/v1/health`
- `curl -sS http://localhost:8081/api/v1/courses/featured`

필수 env:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`
- `KAKAO_REST_API_KEY`
- `KAKAO_ALLOWED_REDIRECT_URIS`
- `COURSE_GPX_STORAGE_MODE` + S3 관련 값(운영)

## Deploy assets / CI

- `frontend/Dockerfile` 기준으로 Next standalone 이미지를 빌드한다.
- `.github/workflows/ci-frontend.yml` 는 `frontend/` 기준 `npm run check` 를 수행한다.
- `.github/workflows/deploy-prod.yml` 는 `frontend/` 소스를 EC2로 업로드하고 `deploy/scripts/deploy_frontend.sh` 로 배포한다.
- `deploy/docker-compose.prod.yml` 는 `frontend-web + nginx + backend-blue/green` 구성을 사용한다.

## Release hygiene

- 작업 후 `git status` 가 릴리즈 범위 기준으로 설명 가능해야 한다.
- `.env` / `.env.local` / 런타임 산출물은 커밋하지 않는다.
- 공개 배포 전 남은 보안 과제:
  - JWT HttpOnly 쿠키 전환
  - 익명 생성 API rate limit
  - GPX 파서 streaming/추가 제한 검토
```
