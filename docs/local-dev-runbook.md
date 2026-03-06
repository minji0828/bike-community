# 로컬 개발 실행 런북 (Windows/WSL + Web Frontend)

## 1) PostGIS 실행

```bash
docker compose -f deploy/docker-compose.local-db.yml up -d
```

- 기본 접속 정보
  - host: `localhost`
  - port: `15432`
  - db: `bikeoasis`
  - user/password: `postgres` / `postgres`

---

## 2) 백엔드 실행

> `APP_JWT_SECRET`가 없으면 애플리케이션이 기동하지 않습니다.

### WSL/bash

```bash
cd backend
GRADLE_USER_HOME=/tmp/gradle-home \
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:15432/bikeoasis \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=postgres \
APP_JWT_SECRET=local-dev-jwt-secret-local-dev-jwt-secret \
./gradlew --no-daemon --project-cache-dir /tmp/gradle-project-cache -Dorg.gradle.vfs.watch=false bootRun
```

### Windows PowerShell

```powershell
cd backend
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:15432/bikeoasis"
$env:SPRING_DATASOURCE_USERNAME="postgres"
$env:SPRING_DATASOURCE_PASSWORD="postgres"
$env:APP_JWT_SECRET="local-dev-jwt-secret-local-dev-jwt-secret"
.\gradlew.bat bootRun
```

기동 확인:

- `http://localhost:8080/swagger-ui/index.html`
- `http://localhost:8080/v3/api-docs`

---

## 3) 웹 프론트 실행 (Next.js)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

- 기본 접속 주소
  - `http://localhost:3000`
- `.env.local` 필수 확인값
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`
  - `NEXT_PUBLIC_KAKAO_CLIENT_ID=<카카오 REST API Key>`
  - `NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback`
  - `NEXT_PUBLIC_KAKAO_MAP_JS_KEY=<카카오 JavaScript Key>`
- 백엔드 env도 함께 필요
  - `KAKAO_REST_API_KEY`
  - `KAKAO_CLIENT_SECRET`(사용 시)
  - `KAKAO_ALLOWED_REDIRECT_URIS=http://localhost:3000/auth/kakao/callback`

배포 전 로컬 품질 체크:

```bash
cd frontend
npm run check
```

- 현재 로컬/CI 품질 게이트는 `eslint + tsc + next build --webpack` 기준으로 검증합니다.

프론트 헬스체크:

- `http://localhost:3000/api/health`

---

## 4) 자주 나는 오류

- `password authentication failed for user "postgres"`
  - 백엔드 URL/포트/비밀번호를 15432/postgres로 맞췄는지 확인
- `APP_JWT_SECRET 설정이 필요합니다`
  - `APP_JWT_SECRET` 환경변수를 설정하고 재실행
- `/v3/api-docs` 500
  - 백엔드 의존성 갱신 후 재기동 (`springdoc` 버전 호환 문제였던 경우)
- 카카오 로그인 후 `허용되지 않은 redirectUri입니다.`
  - 백엔드의 `KAKAO_ALLOWED_REDIRECT_URIS`와 프론트 `.env.local`의 redirect URI가 정확히 일치하는지 확인
- 카카오 지도가 계속 빈 화면 / SDK 로드 실패
  - `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`에 JavaScript 키를 넣었는지 확인
  - 카카오 콘솔 웹 도메인에 `http://localhost:3000` 이 등록됐는지 확인
- 채팅방 연결 실패 / 403
  - 해당 사용자가 먼저 코스모임에 참가했는지 확인
