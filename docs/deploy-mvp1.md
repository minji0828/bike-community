# MVP1 배포 런북 (EC2 + RDS + Nginx + Blue/Green Lite)

## 1. 사전 준비
- EC2(Ubuntu) 1대, RDS(PostgreSQL) 1개
- 도메인 + DNS A 레코드(EC2 공인 IP)
- EC2 설치
  - Docker, Docker Compose v2
  - Git, curl

## 2. 서버 파일 구조(권장)
```bash
/opt/bike-project
  ├─ backend
  ├─ deploy
  └─ frontend/mobile/dist-web
```

## 3. 환경변수 파일 준비
```bash
cd /opt/bike-project
cp deploy/env/.env.prod.example deploy/env/.env.prod
# 실제 값 채우기
```

필수:
- `SPRING_DATASOURCE_*`
- `APP_JWT_SECRET`
- `KAKAO_*`
- `ADMIN_API_KEY`
- `SEOUL_API_KEY`

## 4. 초기 기동
```bash
cd /opt/bike-project
chmod +x deploy/scripts/*.sh
docker compose -f deploy/docker-compose.prod.yml up -d nginx backend-blue
echo blue > deploy/runtime/active_backend
```

## 5. 백엔드 배포(Blue/Green)
```bash
cd /opt/bike-project
deploy/scripts/deploy_backend.sh
```

동작:
1) 비활성 색상 컨테이너 빌드/기동  
2) `/api/v1/health` 체크  
3) Nginx upstream 전환  
4) reload

## 6. 프론트 웹 배포
```bash
cd /opt/bike-project
tar -czf /tmp/frontend-dist.tar.gz -C frontend/mobile dist-web
deploy/scripts/deploy_frontend.sh /tmp/frontend-dist.tar.gz
```

## 7. HTTPS 적용
1) certbot으로 인증서 발급 (호스트에서 수행)
2) `deploy/runtime/certs`에 인증서 경로 마운트 확인
3) SSL conf 적용
```bash
cd /opt/bike-project
deploy/scripts/enable_https.sh your.domain.com
```

## 8. 배포 확인
- `curl http://<domain>/api/v1/health`
- 웹 접속: `https://<domain>/`
- 코스/댓글/모임 API smoke 확인
