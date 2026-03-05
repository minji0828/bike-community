# GitHub Actions 사용법 (MVP1 배포 기준)

## 워크플로 구성
- `ci-backend.yml`: backend 테스트
- `ci-frontend.yml`: frontend 타입체크/웹빌드
- `deploy-prod.yml`: EC2 배포(수동 실행 전용)

## deploy-prod 실행 순서
1. GitHub 저장소 → Actions → `Deploy Production (EC2)` 선택
2. `Run workflow` 클릭
3. 입력값 선택
   - `deploy_backend=true/false`
   - `deploy_frontend=true/false`
4. production 환경 승인(설정된 경우)
5. 실행 로그 확인
   - 파일 업로드(SCP)
   - 백엔드 블루/그린 전환
   - 프론트 정적파일 교체

## 실패 시 1차 점검
- GitHub Secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_APP_DIR`
- 서버: `deploy/env/.env.prod` 존재 여부
- 헬스체크: `/api/v1/health` 응답 여부
- 프론트 빌드: Node 20 기준 성공 여부
