# GitHub Secrets 설정 가이드 (MVP1)

`deploy-prod.yml` 사용을 위해 아래 Secrets를 GitHub 저장소에 설정합니다.

배포 트리거 정책:
- `deploy-prod.yml`은 **수동 실행(`workflow_dispatch`) 전용**입니다.
- `environment: production` 보호 규칙(승인자 지정)을 켜두면, 승인 후에만 실제 배포가 진행됩니다.

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
- `COURSE_GPX_STORAGE_MODE` (`s3` 권장)
- `COURSE_GPX_S3_BUCKET`
- `COURSE_GPX_S3_PREFIX` (예: `courses/gpx`)
- `COURSE_GPX_S3_REGION` (예: `ap-northeast-2`)

권장:
- AWS 자격증명은 EC2 IAM Role 사용
  - Role 사용 시 `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`를 서버 파일에 두지 않는다.

## 권장 보안
- SSH 키는 배포 전용 키 사용
- EC2 사용자 권한 최소화
- Security Group에서 SSH 허용 IP 제한
