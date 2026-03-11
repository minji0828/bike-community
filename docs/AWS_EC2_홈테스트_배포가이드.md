# AWS EC2 홈테스트 배포 가이드

- 작성일: 2026-03-11
- 상태: 활성

목적:

- AWS 크레딧을 써서 가장 빠르게 외부 테스터가 집에서 테스트할 수 있는 배포 경로를 제공한다.
- 구조는 `Vercel 웹 + EC2(backend + PostGIS)`다.

---

## 1. 왜 이 구조인가

- App Runner + RDS는 더 정석적이지만 설정이 더 많다.
- 지금 목표는 "집에서 바로 열리는 테스트 URL"이므로 단순성이 더 중요하다.
- 웹은 Vercel이 HTTPS를 처리하고, 백엔드는 EC2에서 `8080`으로 띄운 뒤 Vercel이 `/backend/*`로 프록시한다.

장점:

- 백엔드에 별도 HTTPS 인증서가 없어도 된다.
- 브라우저 mixed content 문제를 피할 수 있다.
- DB도 같은 EC2에서 같이 올려 홈테스트 구성이 단순하다.

---

## 2. repo에 이미 준비된 것

- Vercel 프록시 지원
  - `frontend/next.config.mjs`
- server-side route가 내부 백엔드 URL을 따로 읽도록 수정
  - `frontend/app/api/auth/me/route.ts`
  - `frontend/app/auth/kakao/finalize/route.ts`
- EC2용 compose
  - `deploy/aws/docker-compose.home-test.yml`
- EC2용 env 예시
  - `deploy/aws/env.home-test.example`

---

## 3. EC2 권장 스펙

- Ubuntu 24.04 또는 Amazon Linux 2023
- `t3.small` 이상 권장
- 디스크 20GB 이상
- Public IPv4 필요

보안 그룹:

- `22` SSH 또는 SSM
- `8080` from `0.0.0.0/0` 테스트용 허용

메모:

- 테스트 끝나면 `8080`은 닫는 것이 좋다.

---

## 4. EC2에서 할 일

1. Docker / Docker Compose 설치
2. 저장소 clone
3. `deploy/aws/env.home-test.example`를 복사해서 실제 값 입력
4. 아래 명령 실행

```bash
cd BIke-project
docker compose -f deploy/aws/docker-compose.home-test.yml up -d --build
```

5. 확인

```bash
curl http://<EC2_PUBLIC_IP>:8080/api/v1/health
```

---

## 5. Vercel 환경변수

웹은 백엔드를 직접 치지 않고 Vercel 프록시를 사용한다.

- `NEXT_PUBLIC_API_BASE_URL=/backend`
- `INTERNAL_API_BASE_URL=http://<EC2_PUBLIC_IP>:8080`
- `BACKEND_PROXY_ORIGIN=http://<EC2_PUBLIC_IP>:8080`
- `NEXT_PUBLIC_KAKAO_CLIENT_ID=<kakao rest api key>`
- `NEXT_PUBLIC_KAKAO_REDIRECT_URI=https://<your-vercel-domain>/auth/kakao/callback`
- `NEXT_PUBLIC_KAKAO_MAP_JS_KEY=<kakao js key>`

---

## 6. Kakao Developers 설정

- 사이트 도메인: `https://<your-vercel-domain>`
- Redirect URI: `https://<your-vercel-domain>/auth/kakao/callback`

---

## 7. 최소 사용자 행동

1. EC2 1대 만든다.
2. EC2 public IP를 나에게 준다.
3. Kakao/Vercel 시크릿만 넣는다.

나머지는:

- Vercel env 값 정리
- 프록시 구조 확인
- 테스트 순서 정리
를 내가 계속 이어서 볼 수 있다.
