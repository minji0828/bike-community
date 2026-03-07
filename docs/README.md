# Docs Index

이 폴더는 **실행/배포/운영/검증** 문서를 모아두는 곳입니다.  
제품 요구사항/정책/API 설계는 `설계/`가 단일 진실원천(SSOT)입니다.

## 1. 지금 바로 봐야 하는 문서

- `docs/local-dev-runbook.md`
  - 새 PC 포함 로컬 실행/환경변수/품질 게이트 기준
- `docs/e2e-mvp1-checklist.md`
  - 로그인/코스/모임/채팅 수동 E2E 체크리스트
- `docs/repository-audit-2026-03-07.md`
  - 현재 문서 체계 판단, 아키텍처 리뷰, 정리 원칙

## 2. 배포/운영 Runbook

- `docs/deploy-mvp1.md`: 배포 런북
- `docs/predeploy-checklist.md`: 배포 전 체크리스트
- `docs/rollback-mvp1.md`: 롤백 런북
- `docs/cicd-secrets.md`: GitHub Secrets 설정 가이드
- `docs/github-actions-usage.md`: GitHub Actions 실행/점검 가이드
- `docs/monitoring-phase2.md`: Prometheus/Loki/Grafana 2단계 도입 가이드

## 3. 로컬 개발 / 인프라 보조 문서

- `docs/local-backend-postgis.md`: PostGIS 단독 실행 가이드
- `backend/LOCAL_DEV.md`: 백엔드 전용 보조 실행 메모

## 4. 전략 / 의사결정 문서

- `docs/mvp1_strategy_options.md`: MVP1 전략 옵션 비교
- `docs/travel-domain-strategy-2026-03-06.md`: 여행 도메인 확장 전략 비교
- `docs/travel-cycling-product-benchmark-2026-03-07.md`: 러닝/라이딩 서비스 벤치마크

## 5. 정리 원칙

- 중복 문서는 바로 삭제하지 않고, 우선 **상위 인덱스에서 역할을 명확히 구분**합니다.
- 실행 기준은 `docs/local-dev-runbook.md`, 설계 기준은 `설계/README.md`로 수렴합니다.
- 향후 문서를 추가할 때는 먼저 이 인덱스에 역할을 등록합니다.
