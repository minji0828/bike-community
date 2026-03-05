# MVP1 롤백 런북

## 1) 백엔드 롤백
현재 active 확인:
```bash
cat deploy/runtime/active_backend
```

반대 색상으로 전환:
```bash
# active가 blue면 green으로, green이면 blue로 변경
cat > deploy/nginx/conf.d/active-backend.conf <<'EOF'
proxy_pass http://backend-blue:8080;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
EOF

docker compose -f deploy/docker-compose.prod.yml exec -T nginx nginx -s reload
echo blue > deploy/runtime/active_backend
```

## 2) 프론트 롤백
이전 release 디렉토리로 심링크 재지정:
```bash
ls -1 deploy/runtime/frontend/releases
ln -sfn deploy/runtime/frontend/releases/<이전버전> deploy/runtime/frontend/current
docker compose -f deploy/docker-compose.prod.yml exec -T nginx nginx -s reload
```

## 3) 확인 항목
- `/api/v1/health` 정상
- 웹 홈 접근 정상
- 코스 상세/댓글 API 정상
