# 2026-03-07 Repo Cleanup & Commenting Plan

## 목표

- stash 상태를 확인하고 반영 누락이 없는지 점검한다.
- 계획 문서 저장 위치를 `plans/`로 고정한다.
- 최근 작성한 인증/통신 핵심 코드에 주석과 Javadoc을 보강한다.
- 테스트 후 커밋/푸시한다.

## 범위

- `plans/` 폴더 신설 및 운영 규칙 문서화
- backend 인증 사용자 resolver / websocket 설정 주석 보강
- frontend auth bootstrap / api 계층 주석 보강

## 비범위

- 대규모 기능 추가
- 기존 dirty 파일 정리
- Phase 1 구현 착수

## 작업 순서

1. stash 유무 확인
2. `plans/` 문서 생성
3. backend 핵심 코드 Javadoc 보강
4. frontend 핵심 코드 주석 보강
5. backend test / frontend check
6. work report 작성 후 커밋/푸시

## 검증 기준

- `git stash list` 결과 확인
- `./gradlew test` 통과
- `npm run check` 통과

## 리스크

- 주석 보강 과정에서 import/format이 깨지지 않도록 최소 변경 유지
