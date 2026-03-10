# FE-ADR-0001: 현재 1차 프론트엔드는 Next.js App Router 웹 앱

- Status: Accepted
- Date: 2026-03-10

## Context

- 설계 문서 일부는 RN/Expo를 전제로 작성되어 있지만, 현재 저장소의 실제 프론트엔드는 `frontend/` 하위 Next.js 앱이다.
- 인증, 지도 SDK, 채팅, 딥링크 정책은 플랫폼 전제가 다르면 구현 판단도 달라진다.
- 구현 시 되묻는 일을 줄이려면 "지금 당장 기준이 되는 프론트엔드"를 명확히 해야 한다.

## Decision

- 현재 저장소 기준 프론트엔드의 기준 구현체는 Next.js App Router 웹 앱으로 고정한다.
- `frontend/`가 프론트엔드 SSOT이며, RN/Expo 관련 기존 문서는 제품 방향 참고로만 사용한다.
- 모바일 앱을 다시 시작할 경우 기존 문서를 재활용하지 않고 별도 ADR과 구현 가이드를 만든다.

## Rationale

- 코드와 문서의 플랫폼 전제가 다르면 구현 품질보다 추측 비용이 커진다.
- Next.js App Router는 현재 라우팅, app route, 인증 프록시, 클라이언트 컴포넌트 사용 패턴과 맞는다.
- 웹 우선으로 기준을 고정해야 인증, 공유 링크, 위치 권한, SEO/배포 기준도 정리된다.

## Consequences

- 장점:
  - 현재 저장소에서 구현을 시작할 때 플랫폼 질문이 줄어든다.
  - 웹 라우팅, 브라우저 위치 API, Kakao Maps JS SDK를 자연스럽게 사용한다.
  - 배포 타깃과 운영 기준을 Vercel/웹 기준으로 정리할 수 있다.
- 단점:
  - 기존 RN 중심 문서는 현재 구현 계약으로는 바로 쓸 수 없다.
  - 모바일 재착수 시 별도 설계 트랙이 필요하다.

## Revisit When

- `frontend/mobile` 같은 실제 모바일 클라이언트가 다시 생길 때
- 웹과 모바일을 동등 1차 타깃으로 운영하게 될 때

## References

- `frontend/package.json`
- `설계/29_프론트엔드_개발_가이드.md`
- `설계/README.md`
