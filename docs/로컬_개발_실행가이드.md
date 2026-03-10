# 로컬 개발 실행 런북 (새 PC 기준)

이 문서는 **다른 PC에서도 동일하게 작업을 재현**하기 위한 현재 기준 문서입니다.

## 0) 사전 준비

- Git
- Java 17
- Node.js 22 권장
- npm
- Docker Desktop 또는 Docker Engine
- Kakao Developers 앱 설정

권장 포트:

- backend: `8080`
- frontend: `3000`
- local PostGIS: `15432`

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

## 2) 백엔드 환경변수 준비

필수 env:

- `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:15432/bikeoasis`
- `SPRING_DATASOURCE_USERNAME=postgres`
- `SPRING_DATASOURCE_PASSWORD=postgres`
- `APP_JWT_SECRET=<32자 이상 로컬 시크릿>`
- `KAKAO_REST_API_KEY=<카카오 REST API 키>`
- `KAKAO_ALLOWED_REDIRECT_URIS=http://localhost:3000/auth/kakao/callback`

선택 env:

- `KAKAO_CLIENT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS=http://localhost:3000`
- `APP_WEBSOCKET_ALLOWED_ORIGIN_PATTERNS=http://localhost:3000`

## 3) 백엔드 실행

> `APP_JWT_SECRET`가 없으면 애플리케이션이 기동하지 않습니다.

### WSL/bash

```bash
cd backend
GRADLE_USER_HOME=/tmp/gradle-home \
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:15432/bikeoasis \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=postgres \
APP_JWT_SECRET=local-dev-jwt-secret-local-dev-jwt-secret \
KAKAO_ALLOWED_REDIRECT_URIS=http://localhost:3000/auth/kakao/callback \
APP_WEBSOCKET_ALLOWED_ORIGIN_PATTERNS=http://localhost:3000 \
./gradlew --no-daemon --project-cache-dir /tmp/gradle-project-cache -Dorg.gradle.vfs.watch=false bootRun
```

### Windows PowerShell

```powershell
cd backend
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:15432/bikeoasis"
$env:SPRING_DATASOURCE_USERNAME="postgres"
$env:SPRING_DATASOURCE_PASSWORD="postgres"
$env:APP_JWT_SECRET="local-dev-jwt-secret-local-dev-jwt-secret"
$env:KAKAO_ALLOWED_REDIRECT_URIS="http://localhost:3000/auth/kakao/callback"
$env:APP_WEBSOCKET_ALLOWED_ORIGIN_PATTERNS="http://localhost:3000"
.\gradlew.bat bootRun
```

기동 확인:

- `http://localhost:8080/swagger-ui/index.html`
- `http://localhost:8080/v3/api-docs`
- `http://localhost:8080/api/v1/health`

---

## 4) 프론트 환경변수 준비

`frontend/.env.local` 기준:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_KAKAO_CLIENT_ID=<카카오 REST API Key>
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback
NEXT_PUBLIC_KAKAO_MAP_JS_KEY=<카카오 JavaScript Key>
```

> Next.js는 `.env`, `.env.local` 모두 읽지만, 로컬 전용 값은 **`.env.local` 사용을 권장**합니다.

## 5) 웹 프론트 실행 (Next.js)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

- 기본 접속 주소
  - `http://localhost:3000`
- 캐시가 꼬였을 때는 아래를 권장합니다.

```bash
cd frontend
npm run dev:clean
```

배포 전 로컬 품질 체크:

```bash
cd frontend
npm run check
```

- 현재 로컬/CI 품질 게이트는 `eslint + tsc + next build --webpack` 기준으로 검증합니다.

프론트 헬스체크:

- `http://localhost:3000/api/health`

---

## 6) 수동 E2E 기준

1. `http://localhost:3000/profile` 접속
2. 카카오 로그인 성공
3. `/profile`에서 닉네임/로그아웃 노출 확인
4. 코스 상세에서 모임 생성/참가
5. `/meetups/{id}/chat` 진입
6. 채팅 연결/메시지 송수신 확인

## 7) 자주 나는 오류

- `password authentication failed for user "postgres"`
  - 백엔드 URL/포트/비밀번호를 15432/postgres로 맞췄는지 확인
- `APP_JWT_SECRET 설정이 필요합니다`
  - `APP_JWT_SECRET` 환경변수를 설정하고 재실행
- `/v3/api-docs` 500
  - 백엔드 의존성 갱신 후 재기동 (`springdoc` 버전 호환 문제였던 경우)
- 카카오 로그인 후 `허용되지 않은 redirectUri입니다.`
  - 백엔드의 `KAKAO_ALLOWED_REDIRECT_URIS`와 프론트 `.env.local`의 redirect URI가 정확히 일치하는지 확인
- 카카오 로그인 화면에서 `앱 관리자 설정 오류 (KOE004)`
  - 카카오 개발자 콘솔에서 해당 앱의 **카카오 로그인 활성화**를 켰는지 확인
  - 플랫폼(Web) 도메인에 `http://localhost:3000` 이 등록됐는지 확인
  - Redirect URI에 `http://localhost:3000/auth/kakao/callback` 이 등록됐는지 확인
- 카카오 지도가 계속 빈 화면 / SDK 로드 실패
  - `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`에 JavaScript 키를 넣었는지 확인
  - 카카오 콘솔 웹 도메인에 `http://localhost:3000` 이 등록됐는지 확인
- 채팅방 연결 실패 / 403
  - 해당 사용자가 먼저 코스모임에 참가했는지 확인
- 채팅이 계속 이상하게 동작
  - `frontend/.next` 캐시 제거 후 `npm run dev:clean`
  - backend의 `APP_WEBSOCKET_ALLOWED_ORIGIN_PATTERNS`에 `http://localhost:3000` 포함 여부 확인
