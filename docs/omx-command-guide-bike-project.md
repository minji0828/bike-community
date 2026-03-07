# OMX 명령어 가이드 (Bike-project 맞춤형)

이 문서는 이 저장소에서 자주 쓰는 **OMX(oh-my-codex) 명령어**를 정리한 실전 가이드다.
특히 이 프로젝트의 주력 스택인 **Spring Boot / JPA / Security / PostgreSQL + PostGIS** 기준으로,
어떤 명령어를 언제 쓰면 좋은지 빠르게 판단할 수 있게 정리했다.

---

## 0. 표기부터 바로잡기

OMX에는 **두 종류의 호출 방식**이 있다.

- **스킬(workflow skill)**: 기본 표기는 **`$이름`** 이다. 예) `$ralph`, `$plan`, `$autopilot`
- **프롬프트(agent prompt)**: **`/prompts:이름`** 이다. 예) `/prompts:architect`, `/prompts:executor`

추가로:
- **`/skills`**: 사용 가능한 스킬 목록 보기
- **주의:** `$name`, `/prompts:name` 에서 `name` 은 실제 명령어가 아니라 **자리표시자**다.
- 일부 오래된 문서/예시에는 `/ralph`, `/plan` 같은 **레거시 슬래시 표기**가 남아 있을 수 있다.
- 하지만 로컬 OMX 설정(`~/.codex/config.toml`)의 `invocation_conventions` 기준으로는 **스킬은 `$name`**, **프롬프트는 `/prompts:name`** 이 현재 표기다.

그래서 이 문서에서는 **스킬 표기를 전부 `$...`로 통일**한다.

> 2026-03-06 재검증: 디스크에서 **일반 스킬 40개**(`~/.agents/skills`), **시스템 스킬 2개**(`~/.codex/skills/.system`), **프롬프트 32개**(`~/.codex/prompts`)를 직접 확인했다. 이 문서에 적힌 명령어 중 실제 파일이 없는 항목은 제거한 상태다.

---

## 1. 먼저 핵심만

- **`$plan`**: 구현 전에 계획부터 세운다.
- **`$ralph`**: 목표가 명확할 때 끝까지 구현/수정/검증을 밀어붙인다.
- **`$autopilot`**: 아이디어 단계부터 설계, 구현, QA, 검증까지 풀오토로 진행한다.
- **`$ultrawork`**: 서로 독립적인 작업을 병렬로 빠르게 처리한다.
- **`$ultraqa`**: 테스트/빌드/린트/타입체크를 반복 실행하며 문제를 고친다.
- **`$analyze`**: 원인 분석, 구조 분석, 영향도 분석에 쓴다.
- **`$deepsearch`**: 코드베이스에서 특정 개념/흐름/사용처를 깊게 찾는다.

> 참고: `explorer`는 주로 **코드 탐색용 에이전트 역할**로 쓰이며, 핵심 스킬 묶음과는 성격이 조금 다르다.

---

## 2. 명령어 선택 빠른 기준

| 상황 | 추천 명령어 |
|---|---|
| 요구사항/범위/구조부터 잡아야 함 | `$plan` |
| 작업은 명확하고 끝까지 구현해야 함 | `$ralph` |
| 아이디어만 있고 나머지는 알아서 해주길 원함 | `$autopilot` |
| 독립 작업 여러 개를 동시에 처리하고 싶음 | `$ultrawork` |
| 테스트나 빌드를 자동 반복 수습하고 싶음 | `$ultraqa` |
| 왜 이런 문제가 나는지 먼저 알고 싶음 | `$analyze` |
| 어디서 어떻게 쓰이는지 추적하고 싶음 | `$deepsearch` |
| 최근 변경사항 품질 점검 | `$code-review` |
| 인증/인가/API 보안 점검 | `$security-review` |
| 현재 OMX 작업 중단/정리 | `$cancel` |
| 이번 세션의 OMX 동작 흐름 확인 | `$trace` |

---

## 3. 핵심 명령어 상세

### 3.1 `$omx-setup`
**용도:** OMX 초기 설정 / 재설정 / 업데이트

**언제 쓰나**
- 처음 설치했을 때
- 글로벌/로컬 설정을 나누고 싶을 때
- OMX 설정이 꼬였다고 느껴질 때

**예시**
```text
$omx-setup
$omx-setup --local
$omx-setup --global
$omx-setup --force
```

---

### 3.2 `$plan`
**용도:** 구현 전에 계획 수립

**세부 기능**
- 요구사항 정리
- 구현 단계 분해
- acceptance criteria 정리
- 리스크와 검증 방법 정리
- 애매한 요청이면 인터뷰형으로 범위 확정

**잘 맞는 상황**
- API 설계를 먼저 정해야 할 때
- DTO/응답 형식/권한 모델을 정리해야 할 때
- 프론트 영향도를 먼저 점검해야 할 때

**예시**
```text
$plan 자전거 코스 즐겨찾기 API 추가
$plan 관리자용 공지 CRUD 설계
$plan POI 응답 DTO에 운영시간 정보 추가
```

---

### 3.3 `$ralph`
**용도:** 끝까지 구현/수정/검증

**세부 기능**
- 구현 수행
- 실패 시 재시도
- 테스트/빌드/검증 수행
- 필요 시 병렬 작업 포함
- 완료될 때까지 지속

**잘 맞는 상황**
- 버그 하나를 확실히 고쳐야 할 때
- 기능 요구사항은 명확하고, 결과물과 검증이 중요할 때
- 부분완료 말고 전체 완료가 필요할 때

**예시**
```text
$ralph 로그인 실패 시 500 나는 버그 끝까지 고쳐
$ralph 회원가입 API validation 넣고 테스트까지 해
$ralph Swagger 문서와 실제 응답 스펙 불일치 수정
```

---

### 3.4 `$autopilot`
**용도:** 아이디어에서 동작하는 결과물까지 풀오토

**세부 기능**
1. 아이디어 확장
2. 기술 설계
3. 구현 계획 수립
4. 구현
5. QA 반복
6. 코드/보안/구조 검증

**잘 맞는 상황**
- “기능 하나 통째로 만들어줘” 같은 요청
- 기획부터 QA까지 손을 덜 대고 맡기고 싶을 때
- 비교적 큰 작업 단위

**예시**
```text
$autopilot 자전거 코스 즐겨찾기 기능 만들어줘
$autopilot 관리자 대시보드용 신고 처리 기능 만들어줘
$autopilot JWT 기반 인증/인가 체계 전반 구축
```

---

### 3.5 `$ultrawork`
**용도:** 병렬 실행 엔진

**세부 기능**
- 작업을 여러 개로 나눔
- 동시에 여러 에이전트에 던짐
- 빠르게 결과를 모음

**주의점**
- Ralph처럼 “완료 보증 루프”는 약하다.
- 즉, **속도 특화**에 가깝다.

**예시**
```text
$ultrawork auth 관련 TODO들 병렬 처리
$ultrawork API 문서 정리, 테스트 보강, 에러 응답 점검 병렬 진행
```

---

### 3.6 `$ultraqa`
**용도:** QA 자동 반복

**세부 기능**
- 테스트/빌드/린트/타입체크 실행
- 실패하면 원인 진단
- 수정 후 다시 실행
- 반복하며 성공 상태로 수렴

**예시**
```text
$ultraqa --tests
$ultraqa --build
$ultraqa --lint
$ultraqa --typecheck
```

---

### 3.7 `$analyze`
**용도:** 깊은 분석

**세부 기능**
- 버그 원인 분석
- 아키텍처/흐름 분석
- 성능/의존성/영향도 분석
- 수정 전에 “왜 그런지” 이해하는 데 유리

**예시**
```text
$analyze nearby 검색 결과가 부정확한 원인 분석해줘
$analyze 현재 JWT 인증 흐름 분석해줘
$analyze GlobalExceptionHandler와 도메인 예외 처리 구조 분석해줘
```

---

### 3.8 `$deepsearch`
**용도:** 코드베이스 정밀 탐색

**세부 기능**
- 키워드/개념/심볼 검색
- import/export 따라가기
- 사용 위치, 주요 구현, 관련 파일 추적

**예시**
```text
$deepsearch GlobalExceptionHandler 사용 위치 전부 찾아줘
$deepsearch 토큰 인증이 어디서 어떻게 쓰이는지 찾아줘
$deepsearch POI 생성 로직이 어디서 시작해서 어디까지 가는지 찾아줘
```

---

### 3.9 `$code-review`
**용도:** 종합 코드 리뷰

**세부 기능**
- 코드 품질
- 성능
- 유지보수성
- 베스트 프랙티스
- 심각도 기반 피드백

**예시**
```text
$code-review 최근 백엔드 변경사항 리뷰해줘
$code-review DTO 변경이 모바일 앱에 미칠 영향 중심으로 리뷰해줘
```

---

### 3.10 `$security-review`
**용도:** 보안 관점 리뷰

**세부 기능**
- OWASP Top 10 관점 점검
- 인증/인가 취약점 점검
- 하드코딩된 시크릿 탐지
- 입력 검증/인젝션 가능성 점검
- 취약 의존성 확인

**예시**
```text
$security-review auth 관련 코드 점검해줘
$security-review 새 관리자 API 권한 처리 점검해줘
```

---

### 3.11 `$cancel`
**용도:** 현재 돌고 있는 OMX 작업 정리/중단

**세부 기능**
- 활성 모드 감지
- state 정리
- 필요 시 강제 정리

**예시**
```text
$cancel
$cancel --force
$cancel --all
```

---

### 3.12 `$trace`
**용도:** OMX 동작 흐름 추적

**세부 기능**
- 어떤 스킬/모드가 발동했는지 보기
- 에이전트 흐름과 병목 확인
- 이번 세션에서 어떤 작업이 진행됐는지 확인

**예시**
```text
$trace
```

---

## 4. 핵심 4개 차이점

| 명령어 | 주목적 | 구현 | 검증 강도 | 병렬성 | 추천 상황 |
|---|---|---:|---:|---:|---|
| `$plan` | 계획 수립 | 보통 X | 낮음 | 낮음 | 범위/설계 먼저 |
| `$ralph` | 끝까지 실행 | O | 높음 | 중~높음 | 명확한 작업 완수 |
| `$autopilot` | 처음부터 끝까지 자동 | O | 매우 높음 | 높음 | 아이디어→완성 |
| `$ultrawork` | 병렬 처리 | O | 중간 | 매우 높음 | 독립 작업 다수 |

### 빠른 해석
- **애매하면** `$plan`
- **명확하고 끝내야 하면** `$ralph`
- **아이디어만 있고 다 맡길 거면** `$autopilot`
- **작업 여러 개를 동시에 빨리 처리하려면** `$ultrawork`

---

## 5. 나머지 자주 보이는 명령어 요약

> 아래도 모두 **스킬은 `$...`**, 프롬프트는 **`/prompts:...`** 규칙을 따른다.

### 계획/분석 계열
- `$ralplan` : `$plan --consensus` 성격의 합의형 계획 수립
- `$review` : 기존 계획 검토
- `$research` : 조사 주제를 병렬 단계로 나눠 리서치
- `$build-fix` : 빌드/타입/에러를 최소 수정으로 수습
- `$tdd` : 테스트 우선 흐름

### 실행/오케스트레이션 계열
- `$pipeline` : 분석 → 구현 → 리뷰 같은 단계형 워크플로
- `$team` : tmux 기반 멀티 에이전트 팀 실행
- `$swarm` : 협업형 다중 에이전트 실행
- `$ultrapilot` : autopilot의 병렬 강화판
- `$ecomode` : 토큰/비용 절약형 실행 전략
- `$ralph-init` : Ralph 실행 전 PRD/작업 정의 세팅

### 운영/설정/보조 계열
- `$help` : OMX 사용법 안내
- `$hud` : OMX HUD 표시/설정
- `$doctor` : OMX 설치/환경 문제 진단
- `$learn-about-omx` : 내 OMX 사용 패턴 분석
- `$note` : 노트 저장
- `$skill` : 로컬 스킬 관리
- `$skill-installer` : 외부/큐레이션 스킬 설치
- `$skill-creator` : 새 스킬 제작/개선
- `$configure-discord`, `$configure-telegram` : 알림 연동
- `$git-master` : Git 작업 보조
- `$project-session-manager`, `$psm` : 작업 세션/워크트리 관리
- `$deepinit` : 코드베이스 초기 심층 문서화
- `$release` : 릴리즈 워크플로
- `$worker` : team/swarm 환경의 워커 프로토콜
- `$learner` : 현재 작업 흐름을 재사용 스킬로 추출
- `$writer-memory` : 글쓰기/스토리용 메모리 관리

> 위 항목들 중 일부는 고급/운영자용이거나 실험적 성격이 강해서, 일반적인 백엔드 작업에서는 핵심 명령어들에 비해 사용 빈도가 낮다.

---

## 6. Bike-project에서 특히 잘 맞는 사용 패턴

### 6.1 새 API/기능 추가
추천 흐름:
```text
$plan -> $ralph -> $ultraqa --tests
```

예시:
```text
$plan 자전거 코스 즐겨찾기 API 추가
$ralph 자전거 코스 즐겨찾기 API 구현하고 테스트까지 해
$ultraqa --tests
```

---

### 6.2 인증/인가 수정
추천 흐름:
```text
$plan -> $ralph -> $security-review
```

예시:
```text
$plan JWT 인증 흐름에 refresh token 추가
$ralph 로그인 API 실패 처리 개선하고 인증 예외 응답도 정리
$security-review auth 관련 변경사항 전부 점검해줘
```

---

### 6.3 PostGIS / 위치 기반 기능
추천 흐름:
```text
$analyze -> $ralph -> $code-review
```

예시:
```text
$analyze nearby 검색 결과가 부정확한 원인 분석해줘
$ralph 반경 기반 POI 검색 정확도 개선하고 관련 테스트 추가해
$code-review 위치 계산 로직 변경사항 리뷰해줘
```

> 이 프로젝트에서는 spatial 처리에서 `(lon, lat)` 순서, 반경 계산, 쿼리 정확도, DTO 변환 실수가 자주 핵심 포인트가 된다.

---

### 6.4 예외 처리 / 에러 응답 정리
추천 흐름:
```text
$deepsearch -> $analyze -> $ralph
```

예시:
```text
$deepsearch BusinessException이 어디서 어떻게 쓰이는지 찾아줘
$analyze GlobalExceptionHandler와 도메인 예외 처리 구조 분석해줘
$ralph 예외 응답 형식을 ApiResponse 기준으로 통일해
```

---

### 6.5 DTO / API 스펙 변경
추천 흐름:
```text
$deepsearch -> $plan -> $ralph -> $code-review
```

예시:
```text
$deepsearch PoiResponse를 사용하는 컨트롤러와 서비스 전부 찾아줘
$plan POI 응답 DTO에 운영시간 정보 추가
$ralph Swagger 문서와 실제 POI 응답 스펙 불일치 수정
$code-review DTO 변경이 모바일 앱에 미칠 영향 중심으로 리뷰해줘
```

> API 요청/응답 shape, 인증 방식, 에러 코드, URL path가 바뀌면 프론트 영향도를 같이 확인하는 것이 좋다.

---

### 6.6 테스트 보강
추천 흐름:
```text
$plan -> $ralph -> $ultraqa --tests
```

예시:
```text
$plan POI 서비스 테스트 보강 계획 세워줘
$ralph PoiController에 대한 WebMvcTest 추가해
$ralph repository spatial query 테스트 추가하고 깨지는 테스트까지 정리
$ultraqa --tests
```

---

## 7. 복붙용 실전 예문 20선

```text
$plan JWT 로그인 기능 추가
$plan 관리자용 공지 CRUD 설계
$ralplan 자전거 정비소 추천 기능 추가
$review 기존 구현 계획 검토해줘
$ralph 로그인 실패 시 500 나는 버그 끝까지 고쳐
$ralph 회원가입 API validation 제대로 넣고 테스트까지 해
$ralph POI nearby API 반경 필터 정확도 문제 해결
$ralph Swagger 문서랑 실제 응답 스펙 불일치 수정
$autopilot 자전거 코스 즐겨찾기 기능 만들어줘
$autopilot 공공데이터 기반 공기질 표시 기능 추가
$autopilot 관리자 대시보드용 신고 처리 기능 만들어줘
$autopilot JWT 기반 인증/인가 체계 전반 구축
$ultrawork auth 관련 TODO들 병렬 처리
$ultrawork API 문서 정리, 테스트 보강, 에러 응답 점검 병렬로 진행
$ultrawork controller별 validation 누락 여부 전부 점검
$ultraqa --tests
$ultraqa --build
$analyze 왜 nearby 검색 결과가 부정확한지 분석해줘
$deepsearch 토큰 인증이 어디서 어떻게 쓰이는지 찾아줘
$code-review 최근 변경사항 리뷰해줘
```

---

## 8. 초보자용 추천 사용 순서

1. **애매한 기능이면** `$plan`
2. **구현은** `$ralph`
3. **테스트가 깨지면** `$ultraqa --tests`
4. **품질 확인은** `$code-review`
5. **인증/보안 변경이면** `$security-review`
6. **도중에 멈추려면** `$cancel`
7. **무슨 일이 일어났는지 보고 싶으면** `$trace`

---

## 9. 이 프로젝트 기준 추천 TOP 10

```text
$plan 자전거 코스 즐겨찾기 API 추가
$ralph POI nearby 검색 정확도 개선하고 테스트까지 해
$analyze 현재 JWT 인증 흐름 분석해줘
$deepsearch GlobalExceptionHandler 사용 위치 전부 찾아줘
$ralph Swagger 문서와 실제 응답 스펙 맞춰
$ultraqa --tests
$code-review 최근 백엔드 변경사항 리뷰해줘
$security-review auth 관련 코드 점검해줘
$plan 공지사항 CRUD 만들고 프론트 영향도 정리
$ralph repository spatial query 테스트 추가
```

---

## 9.5 표기 규칙 한 번 더 정리

- **스킬 실행**: `$ralph`, `$plan`, `$autopilot`, `$ultraqa --tests`
- **프롬프트 실행**: `/prompts:architect`, `/prompts:executor`, `/prompts:planner`
- **스킬 목록 보기**: `/skills`
- **레거시 호환**: 일부 문서나 환경에서는 `/ralph`, `/plan` 같은 예전 슬래시 호출이 보일 수 있지만, 이 문서에서는 **현재 기본 표기인 `$skill`** 을 사용한다.

---

## 10. 마지막으로 기억할 것

- **구조부터 생각**: `$plan`
- **원인부터 찾기**: `$analyze`
- **흐름/사용처 찾기**: `$deepsearch`
- **끝까지 구현**: `$ralph`
- **테스트 수습**: `$ultraqa --tests`
- **품질 점검**: `$code-review`
- **보안 점검**: `$security-review`

이 정도만 익혀도, 이 저장소에서 OMX를 실전 투입하는 데는 충분하다.
