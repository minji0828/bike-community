# MVP1 배포 런북

- 작성일: 2026-03-11
- 상태: 활성

목적:

- 현재 저장소 기준 배포 가능한 산출물과, 아직 별도 배포 체계가 필요한 모바일 앱을 구분한다.

---

## 1. 현재 저장소에서 배포되는 것

- 백엔드: Spring Boot
- 웹 클라이언트: `frontend/` Next.js 앱
- 프록시: Nginx
- 배포 방식: Docker Compose

메모:

- 제품의 1차 클라이언트는 모바일 앱이지만, 현재 저장소에는 모바일 소스가 없으므로 이 런북은 backend + web 배포만 다룬다.
- 모바일 앱 배포는 추후 별도 릴리즈 문서로 분리한다.

## 2. 사전 준비

- EC2(Ubuntu) 1대
- RDS(PostgreSQL) 1개
- 도메인 + DNS A 레코드
- S3 버킷 1개(GPX 원문 저장 시)
- EC2 설치:
  - Docker
  - Docker Compose v2
  - Git, curl

## 3. 서버 파일 구조

```bash
/opt/bike-project
  ├─ backend
  ├─ frontend
  └─ deploy
```

## 4. 환경변수 파일

```bash
cd /opt/bike-project
cp deploy/env/.env.prod.example deploy/env/.env.prod
```

필수:

- `SPRING_DATASOURCE_*`
- `APP_JWT_SECRET`
- `KAKAO_*`
- `ADMIN_API_KEY`
- `SEOUL_API_KEY`
- `COURSE_GPX_STORAGE_MODE`

## 5. 초기 기동

```bash
cd /opt/bike-project
chmod +x deploy/scripts/*.sh
docker compose -f deploy/docker-compose.prod.yml up -d nginx backend-blue frontend-web
echo blue > deploy/runtime/active_backend
```

## 6. 백엔드 배포

```bash
cd /opt/bike-project
deploy/scripts/deploy_backend.sh
```

## 7. 웹 프론트 배포

```bash
cd /opt/bike-project
deploy/scripts/deploy_frontend.sh
```

동작:

1. `frontend/Dockerfile`로 Next.js 앱을 빌드한다.
2. `frontend-web` 컨테이너를 재기동한다.
3. Nginx 내부 health check로 `/api/health`를 확인한다.

## 8. HTTPS 적용

1. certbot으로 인증서 발급
2. `deploy/runtime/certs` 마운트 확인
3. SSL conf 적용

## 9. 배포 확인

- `curl http://<domain>/api/v1/health`
- 웹 접속: `https://<domain>/`
- 공유 코스 열람 확인
- 코스/라이딩 핵심 API smoke 확인

## 10. 모바일 배포 메모

- 모바일 앱은 별도 스토어 배포 또는 내부 배포 체계를 가져야 한다.
- 현재 repo에는 모바일 소스와 CI/CD가 없으므로, 모바일 착수 시 다음을 별도 정의한다.
  - 빌드 채널(dev/staging/prod)
  - 딥링크/redirectUri
  - secure storage / env 관리
  - 테스트플라이트 / 내부 테스트 트랙
