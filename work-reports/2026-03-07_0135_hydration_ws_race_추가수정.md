# 작업 일지 / 결과 보고서

- 작성일시: 2026-03-07 01:35:00 (KST)
- 작업명: hydration mismatch(시간/타임존) 및 WebSocket send race 추가 수정
- 브랜치: master
- 범위(커밋): e67ed7e..(next)

## 1. 이번 작업의 목표

- Recoverable hydration mismatch를 유발할 수 있는 **시간/타임존 의존 렌더**를 줄인다.
- `WebSocket.send`가 `CONNECTING` 상태에서 호출되며 발생하는 `InvalidStateError`를 방지한다.

## 2. 완료된 작업(Deliverables)

- Web:
  - `frontend/app/course/[id]/page.tsx`
    - 모임 생성 폼의 기본 시작시간(`defaultStartAt`)을 SSR 렌더 시점에서 계산하지 않고, mount 후(`useEffect`)에만 계산하도록 변경
    - 목적: WSL(서버) timezone과 브라우저 timezone 차이로 인한 hydration 불일치 방지
  - `frontend/lib/stomp.ts`
    - `WebSocket.send(...)` 호출부에 try/catch + readyState 확인을 추가해 CONNECTING 상태 race에서도 예외가 터지지 않도록 보강

## 3. 변경된 API / 정책(있으면)

- 없음

## 4. 검증(Verification)

- 실행한 커맨드:
  - `cd frontend && npm run check`
- 결과:
  - frontend lint/typecheck/build 통과

## 5. 마일스톤 진척도(설계/14 기준)

- 기준 문서: `설계/14_개발계획_마일스톤_체크리스트.md`
- 산출 방식: Done=1, Partial=0.5, Todo=0
- 이번 보고 시점 진척도: 87.5%

## 6. 리스크/이슈/메모

- hydration mismatch는 특정 화면에서만 발생할 수 있으므로, 실제 사용자 브라우저에서 경고가 사라졌는지 확인이 필요하다.
- STOMP 연결 자체 실패(401/403)는 별개의 이슈이며, 이 수정은 CONNECTING 상태에서 cleanup/send가 겹쳐 터지는 런타임 에러를 방지한다.

## 7. 다음 작업(Next)

- 사용자 브라우저에서 `/course/[id]` 및 `/meetups/[id]/chat` 진입 시 Recoverable hydration 경고/InvalidStateError 재발 여부 확인
- 남아있다면 `toLocaleString/toLocaleTimeString` 등 timezone 의존 렌더도 같은 방식으로 정리
