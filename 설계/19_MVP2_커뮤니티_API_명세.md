# MVP2 커뮤니티 API 명세(초안)

- 문서 ID: MVP2-API
- 버전: v0.1
- 작성일: 2026-03-04
- 상태: 초안

목적:

- MVP2 커뮤니티(모임/내 활동)의 API 계약을 고정한다.
- 로그인 없이 `deviceUuid` 기반으로 소유권/제한을 최소한으로 적용한다.

관련 문서:

- 요구사항: `설계/17_MVP2_요구사항정의서.md`
- 스키마: `설계/18_MVP2_커뮤니티_데이터모델_스키마.md`
- 공통 응답 포맷: `설계/11_API_명세.md`

---

## 0. 공통 규칙

- Base URL: `/api/v1`
- Response: `ApiResponse{ code(int), message, data }`

### 0.1 헤더(비로그인 식별)

write 요청 필수:

- `X-Device-UUID: <uuid>`

선택:

- `Idempotency-Key: <uuid>` (모임 참여/join 같은 재시도 민감 요청에서 권장)

---

## 1. Meetup API (MVP2 Must)

### 1.1 코스 모임 생성

- POST `/api/v1/courses/{courseId}/meetups`

Request

```json
{
  "title": "토요일 오전 한강",
  "startAt": "2026-03-07T09:00:00+09:00",
  "maxParticipants": 8,
  "meetingPoint": { "lat": 37.52, "lon": 126.94 }
}
```

Response

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "meetupId": 101,
    "joinCode": "a1b2c3d4e5f6"
  }
}
```

### 1.2 코스 모임 리스트 조회

- GET `/api/v1/courses/{courseId}/meetups?status=open`

Response data (예시)

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "meetupId": 101,
      "title": "토요일 오전 한강",
      "startAt": "2026-03-07T09:00:00+09:00",
      "status": "open",
      "maxParticipants": 8,
      "participantCount": 3
    }
  ]
}
```

### 1.3 모임 상세 조회

- GET `/api/v1/meetups/{meetupId}`

### 1.4 모임 참여(joinCode)

- POST `/api/v1/meetups/join`

Request

```json
{ "joinCode": "a1b2c3d4e5f6", "nickname": "익명라이더" }
```

Response

```json
{ "code": 200, "message": "success", "data": { "meetupId": 101, "status": "joined" } }
```

오류(예시)

- 409: 정원 마감
- 404: joinCode 없음

### 1.5 모임 탈퇴

- POST `/api/v1/meetups/{meetupId}/leave`

---

## 2. My API (MVP2 Must)

### 2.1 내 코스 목록

- GET `/api/v1/me/courses`

### 2.2 내 라이딩 목록

- GET `/api/v1/me/ridings`

### 2.3 내가 만든/참여한 모임(선택)

- GET `/api/v1/me/meetups`

---

## 3. Rate Limit(초안)

- 모임 생성: deviceUuid 기준 5/day
- 모임 참여: deviceUuid 기준 30/day
- 모임 탈퇴: deviceUuid 기준 30/day

---

## 4. 멱등성 정책(초안)

- 참여(join)는 멱등해야 한다.
  - 같은 deviceUuid가 같은 meetup에 이미 참여 중이면 200으로 "이미 참여"를 반환한다.
- `Idempotency-Key`를 쓰면 네트워크 재시도/중복 탭에 더 안전하다.
