# OMX 검증 명령어 목록
이 문서는 **현재 로컬 환경에 실제로 설치된 OMX 스킬과 프롬프트만** 정리한 검증용 목록이다.

## 검증 기준
- 검증일: 2026-03-06
- 일반 스킬 경로: `~/.agents/skills`
- 시스템 스킬 경로: `~/.codex/skills/.system`
- 프롬프트 경로: `~/.codex/prompts`
- 호출 규칙 확인 경로: `~/.codex/config.toml`

## 호출 규칙
- **스킬(workflow skill)**: `$이름`
- **프롬프트(agent prompt)**: `/prompts:이름`
- **스킬 목록 보기**: `/skills`
- **주의:** `$name`, `/prompts:name` 에서 `name` 은 실제 명령어가 아니라 자리표시자다.

## 일반 스킬 (40개)
- `$analyze`
- `$autopilot`
- `$build-fix`
- `$cancel`
- `$code-review`
- `$configure-discord`
- `$configure-telegram`
- `$deepinit`
- `$deepsearch`
- `$doctor`
- `$ecomode`
- `$frontend-ui-ux`
- `$git-master`
- `$help`
- `$hud`
- `$learn-about-omx`
- `$learner`
- `$note`
- `$omx-setup`
- `$pipeline`
- `$plan`
- `$project-session-manager`
- `$psm`
- `$ralph`
- `$ralph-init`
- `$ralplan`
- `$release`
- `$research`
- `$review`
- `$security-review`
- `$skill`
- `$swarm`
- `$tdd`
- `$team`
- `$trace`
- `$ultrapilot`
- `$ultraqa`
- `$ultrawork`
- `$worker`
- `$writer-memory`

## 시스템 스킬 (2개)
- `$skill-creator`
- `$skill-installer`

## 프롬프트 (32개)
- `/prompts:analyst`
- `/prompts:api-reviewer`
- `/prompts:architect`
- `/prompts:backend-spring-dev`
- `/prompts:build-fixer`
- `/prompts:code-reviewer`
- `/prompts:critic`
- `/prompts:debugger`
- `/prompts:deep-executor`
- `/prompts:dependency-expert`
- `/prompts:designer`
- `/prompts:executor`
- `/prompts:explore`
- `/prompts:frontend-expo-architect`
- `/prompts:git-master`
- `/prompts:information-architect`
- `/prompts:performance-reviewer`
- `/prompts:planner`
- `/prompts:product-analyst`
- `/prompts:product-manager`
- `/prompts:qa-tester`
- `/prompts:quality-reviewer`
- `/prompts:quality-strategist`
- `/prompts:researcher`
- `/prompts:scientist`
- `/prompts:security-reviewer`
- `/prompts:style-reviewer`
- `/prompts:test-engineer`
- `/prompts:ux-researcher`
- `/prompts:verifier`
- `/prompts:vision`
- `/prompts:writer`

## 자주 쓰는 것 빠르게 보기
- 스킬: `$plan`, `$ralph`, `$autopilot`, `$ultrawork`, `$ultraqa`, `$analyze`, `$deepsearch`, `$code-review`, `$security-review`, `$cancel`
- 프롬프트: `/prompts:architect`, `/prompts:executor`, `/prompts:planner`, `/prompts:explore`, `/prompts:debugger`, `/prompts:verifier`

## 비고
- 일부 오래된 예시/문서에는 `/ralph`, `/plan` 같은 슬래시 표기가 남아 있을 수 있다.
- 현재 로컬 설정 기준으로는 **스킬은 `$...`**, **프롬프트는 `/prompts:...`** 로 보는 것이 맞다.
