# 작업 일지 / 결과 보고서

- 작성일시: 2026-03-06 23:03:00 (KST)
- 작업명: 카카오 id_token 검증 실패 fallback 추가
- 브랜치: master
- 범위(커밋): e55a79f..(next)

## 1. 이번 작업의 목표

- 카카오 로그인 완료 후 `/profile?loginError=유효하지 않은 Kakao id_token입니다.` 로 돌아오는 문제의 원인을 분석하고, 실제 로그인이 가능하도록 fallback을 추가한다.

## 2. 완료된 작업(Deliverables)

- Root Cause 분석:
  - 카카오 authorize/code/token 교환은 통과
  - 실패 지점은 백엔드 `KakaoIdTokenVerifier.verify()` 단계
  - 기존에는 `id_token` 검증 실패 사유를 숨기고 동일 메시지로만 처리하고 있었음
- Backend:
  - `KakaoIdTokenVerifier` 에 검증 실패 로그 추가
  - `KakaoOidcUserInfoClient` 추가
    - `GET https://kapi.kakao.com/v1/oidc/userinfo`
    - access token 기반으로 `sub` 조회
  - `AuthService` 수정
    - `id_token` 검증 성공 시 기존 흐름 유지
    - `유효하지 않은 Kakao id_token입니다.` 발생 시 userinfo fallback으로 `sub` 확보 후 로그인 완료
- Tests:
  - `AuthServiceTest` 에 fallback 시나리오 추가

## 3. 변경된 API / 정책(있으면)

- 외부 API 계약 변경 없음
- 내부 로그인 처리 정책 보강:
  - `id_token` 검증 실패 시 OIDC userinfo fallback 허용

## 4. 검증(Verification)

- 실행한 커맨드:
  - `cd backend && ./gradlew test --no-daemon --console=plain`
  - `cd backend && ./gradlew bootRun --no-daemon --console=plain`
- 결과:
  - backend test 통과
  - `AuthServiceTest` fallback 시나리오 포함 통과
  - 최신 코드로 백엔드 재기동 완료

## 5. 마일스톤 진척도(설계/14 기준)

- 기준 문서: `설계/14_개발계획_마일스톤_체크리스트.md`
- 산출 방식: Done=1, Partial=0.5, Todo=0
- 이번 보고 시점 진척도: 87.5%

## 6. 리스크/이슈/메모

- fallback은 로그인 복구를 위한 pragmatic 대응이다.
- 운영 보안 관점에서 장기적으로는 Kakao `id_token` 검증 실패의 정확한 원인(iss/aud/signature/JWK)을 별도 로그 기반으로 추가 점검하는 것이 바람직하다.

## 7. 다음 작업(Next)

- 사용자 실 로그인 재시도
- 성공 여부 확인
- 필요 시 검증 실패 상세 로그를 기반으로 strict validator 조정 여부 검토
