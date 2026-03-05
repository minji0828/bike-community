# GitHub Secrets 설정 가이드 (MVP1)

`deploy-prod.yml` 사용을 위해 아래 Secrets를 GitHub 저장소에 설정합니다.

## 필수
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY` (PEM private key)
- `EC2_APP_DIR` (예: `/opt/bike-project`)

## 서버 측 파일(별도)
아래 값은 GitHub Secret이 아니라 서버의 `deploy/env/.env.prod`에 저장:
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_JWT_SECRET`
- `KAKAO_REST_API_KEY`
- `KAKAO_CLIENT_SECRET`
- `KAKAO_ALLOWED_REDIRECT_URIS`
- `ADMIN_API_KEY`
- `SEOUL_API_KEY`

## 권장 보안
- SSH 키는 배포 전용 키 사용
- EC2 사용자 권한 최소화
- Security Group에서 SSH 허용 IP 제한
