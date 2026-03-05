# OMX 사용 설명서 (oh-my-codex)

이 문서는 이 저장소에서 **OMX(oh-my-codex)** 를 사용할 때 필요한 핵심 사용법을 정리한 가이드입니다.

---

## 1) 기본 개념

- OMX는 Codex CLI(에이전틱 코딩 도우미)에 **자동 오케스트레이션/모드/스킬**을 추가하는 레이어입니다.
- 대부분은 “자연어로 요청”만 해도 자동으로 동작하지만, 필요하면 **슬래시 명령어**로 모드를 명시할 수 있습니다.

---

## 2) 슬래시 명령어(스킬) 목록

> 아래 명령들은 `/이름` 형태로 호출합니다.
>
> **검증 기준:** 이 목록은 현재 개발 환경에서 실제로 존재하는 스킬 디렉토리(`/home/user/.agents/skills`) 기준으로 확인했습니다. (확인일: 2026-03-05)

### 설정
- `/omx-setup` : OMX 초기 설정(로컬/글로벌 CLAUDE.md 구성)

### 실행/오케스트레이션
- `/autopilot` : 아이디어 → 구현 → 검증까지 자동 실행 흐름
- `/ralph` : 완료될 때까지 반복/집요하게 수행(강한 실행 모드)
- `/ralph-init` : ralph 실행을 위한 PRD/초기 컨텍스트 구성 보조
- `/ultrawork` : 병렬 처리 극대화
- `/ultrapilot` : 병렬 autopilot
- `/pipeline` : 단계형 워크플로(리뷰 → 수정 → 검증 등 체인)
- `/team`, `/swarm` : 멀티 에이전트 협업 실행
- `/worker` : team 모드에서의 워커 프로토콜
- `/psm`, `/project-session-manager` : 격리된 세션/워크트리 기반 작업 환경 운영

### 계획/리뷰/분석
- `/plan` : 계획 수립(인터뷰/정리 중심)
- `/ralplan` : 반복적/합의형 계획 수립
- `/analyze` : 문제/코드 심층 분석
- `/deepinit` : 코드베이스 초기/심층 인덱싱(AGENTS.md 계층 문서화 등)
- `/deepsearch` : 코드베이스 정밀 탐색
- `/research` : 병렬 리서치/조사
- `/code-review` : 코드 리뷰
- `/security-review` : 보안 관점 리뷰
- `/review` : plan 리뷰(alias)
- `/ultraqa` : 테스트/검증 반복 사이클
- `/trace` : 실행/에이전트 흐름 트레이스 확인
- `/learn-about-omx` : OMX 사용 패턴 분석/추천
- `/ecomode` : 토큰/비용 절약 모드(루틴 작업에 유리)

### 개발 보조
- `/build-fix` : 빌드/에러 최소 변경으로 해결
- `/doctor` : OMX 설치/환경 진단
- `/git-master` : Git 작업(커밋/리베이스/히스토리) 지원
- `/frontend-ui-ux` : UI/UX 관점 작업
- `/tdd` : TDD(테스트 우선) 강제 흐름
- `/writer-memory` : 작가용 메모리/관계/장면 관리(개발과 무관하면 보통 사용 안 함)

### 유틸/알림
- `/hud` : OMX HUD 표시/설정
- `/note` : 노트 저장(컨텍스트 보존용)
- `/skill` : 스킬 관리
- `/learner` : 현재 대화에서 “학습된 스킬” 추출
- `/cancel` : 진행 중인 모드/작업 중단
- `/configure-discord`, `/configure-telegram` : 알림 연동 설정
- `/release` : 릴리즈 워크플로

---

## 3) “키워드”로 모드 유도(슬래시 없이도 가능)

요청 문장에 아래 키워드를 섞으면 해당 모드로 유도됩니다.

- `ralph`
- `ralplan`
- `ulw` (ultrawork)
- `plan`

예)
- `ralph: 전체 테스트 실패 원인 찾고 고쳐줘`
- `plan: POI API 확장 설계 먼저 잡아줘`

---

## 4) CLAUDE.md(MD) 세팅: 로컬 vs 글로벌

OMX는 보통 **CLAUDE.md** 를 통해 동작 규칙/가이드(툴 사용 규칙, 프로젝트 규칙 등)를 구성합니다.

### 로컬(프로젝트 전용)
- 경로: `<repo>/.claude/CLAUDE.md`
- 장점: 프로젝트별 규칙을 안전하게 분리 가능

### 글로벌(전체 프로젝트 공통)
- 경로: `~/.claude/CLAUDE.md`
- 장점: 모든 프로젝트에서 동일한 기본 규칙 사용

### 설정 방법
- 기본: `/omx-setup`
- 로컬 강제: `/omx-setup --local`
- 글로벌 강제: `/omx-setup --global`

추가 설정은 보통 아래 파일에서 관리됩니다.
- `~/.claude/.omx-config.json`

> 참고: 일부 문서/버전에서 설치 명령이 `/omc-setup` 처럼 표기되는 경우가 있는데, 이 환경에 설치된 스킬 이름은 **`omx-setup`** 입니다(즉 `/omx-setup`).

---

## 5) 에이전트별 프롬프트(`/prompts:...`) 사용/등록

OMX의 “에이전트 프롬프트”는 보통 아래 경로의 `.md` 파일로 등록돼 있습니다.

- `~/.codex/prompts/`
  - 예: `architect.md`, `executor.md`, `explore.md` …

### 사용 방법
- `/prompts:architect`
- `/prompts:executor`
- `/prompts:explore`

> 규칙: **파일명(확장자 제외)** 이 곧 `/prompts:<이름>` 이 됩니다.

### 새 프롬프트 등록(추가) 방법
1. `~/.codex/prompts/` 아래에 `my-agent.md` 파일을 생성
2. 이후 `/prompts:my-agent` 로 호출 가능

---

## 6) 이 저장소에서 자주 쓰는 Gradle 명령(참고)

- 테스트: `./gradlew test`
- 빌드: `./gradlew clean build`
- 실행: `./gradlew bootRun`
