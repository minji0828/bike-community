# API 명세(초안)

- 문서 ID: API-SPEC
- 버전: v0.3
- 작성일: 2026-03-05
- 상태: 초안

목적:

- 앱/서버 개발을 "명세 기반"으로 시작할 수 있게 한다.
- 현재 구현된 API + 신규(Course) API의 목표 형태를 문서로 고정한다.

참조:

- `설계/03_기능_비기능_요구사항명세서.md`
- `설계/10_데이터모델_스키마.md`

## 0. 공통 규칙

- Base URL: `/api/v1`
- Content-Type: `application/json`
- 좌표 순서(내부/DB/JTS): (lon, lat)

### 0.1 좌표 표현(내부 vs API)

- 내부(PostGIS/JTS/WKT): `ST_MakePoint(lon, lat)` / `Coordinate(lon, lat)`
- API(JSON): 명시적 필드를 사용한다.
  - 예: `{ "lat": 37.1, "lon": 127.1 }`
  - 이때도 내부 변환은 항상 (lon,lat)로 한다.

### 0.2 응답 포맷

권장 표준: `ApiResponse<T>`

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

메모:

- 현재 코드베이스에는 `ApiResponse`가 존재하나 일부 엔드포인트는 raw 타입으로 응답한다.
- 개발 시작 전, API 응답 포맷을 통일하는 것을 권장한다.

### 0.3 에러 포맷

```json
{
  "code": 400,
  "message": "유효하지 않은 요청입니다",
  "data": null
}

```

### 0.4 헤더(인증/식별)

MVP는 인증을 단순화할 수 있지만, 민감 데이터(위치/경로)는 안전장치를 염두에 둔다.

- (MVP2+ 권장) `Authorization: Bearer <token>`
- (MVP 권장) 익명 식별이 필요하면 `X-Device-UUID: <uuid>`

메모:

- MVP2(카카오 로그인 + 댓글) 인증/토큰/엔드포인트는 아래 문서에서 확정한다.
  - `설계/21_인증_카카오_OIDC.md`
  - `설계/19_MVP2_커뮤니티_API_명세.md`

## 1. POI API

### 1.1 화장실 데이터 동기화(전체)

- POST `/api/v1/pois/sync/full`

Response

```json
{ "code": 200, "message": "success", "data": "화장실 데이터 전체 새로고침 완료" }
```

### 1.2 화장실 데이터 동기화(증분)

- POST `/api/v1/pois/sync/incremental`

### 1.3 화장실 데이터 동기화(자동)

- POST `/api/v1/pois/sync/toilets`

### 1.4 내 주변 화장실 조회

- GET `/api/v1/pois/nearby?lat={lat}&lon={lon}&radius={m}`

Response data: `ToiletResponseDto[]`

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "name": "OO공중화장실",
      "address": "서울 ...",
      "lat": 37.0,
      "lon": 127.0,
      "openingHours": "09:00~18:00"
    }
  ]
}
```

### 1.5 경로 주변 화장실 조회

- POST `/api/v1/pois/along-route?radius={m}`

Request body: `PointDto[]`

```json
[
  { "lat": 37.1, "lon": 127.1 },
  { "lat": 37.2, "lon": 127.2 }
]
```

## 2. Riding API

### 2.1 라이딩 저장

- POST `/api/v1/ridings`

추적/샘플링/다운샘플링 정책:

- `설계/23_라이딩_GPS_추적_기록_설계.md`

Request: `RidingCreateRequest`

```json
{
  "deviceUuid": "device-uuid",
  "userId": 1,
  "title": "아침 라이딩",
  "totalDistance": 12000.3,
  "totalTime": 3600,
  "avgSpeed": 20.2,
  "path": [
    { "lat": 37.1, "lon": 127.1 },
    { "lat": 37.2, "lon": 127.2 }
  ]
}
```

Response (권장)

```json
{ "code": 200, "message": "success", "data": { "ridingId": 123 } }
```

현재 구현 메모:

- 현재 서버 구현은 `ridingId`(Long) 숫자를 그대로 반환한다(plain number/text).
- 추후 `ApiResponse`로 통일하는 것을 권장한다.

## 3. Location API

> 현재 구현된 엔드포인트를 유지하되, 인증이 도입되면 userId는 토큰에서 추출하는 형태로 변경하는 것을 권장.

- GET `/api/v1/locations/{userId}/current`
- POST `/api/v1/locations/{userId}`
- GET `/api/v1/locations/{userId}/history?page=&size=`
- GET `/api/v1/locations/{userId}/period?startTime=&endTime=`
- GET `/api/v1/locations/{userId}/recent?limit=`
- GET `/api/v1/locations/nearby?latitude=&longitude=&radius=`
  - 메모: 현재 구현은 관리자/디버그 성격이며 파라미터 이름이 `latitude/longitude`를 사용한다.
- GET `/api/v1/locations/{userId}/distance?limit=`
- DELETE `/api/v1/locations/{userId}/old-history?daysToKeep=`

## 4. Course API(신규, MVP 핵심)

### 4.1 코스 생성(라이딩 기반)

- POST `/api/v1/courses/from-riding`

Request

```json
{
  "ridingId": 123,
  "title": "한강 산책",
  "visibility": "private",
  "tags": ["river", "beginner"],
  "notes": "초보자 추천"
}
```

Response

```json
{ "code": 200, "message": "success", "data": { "courseId": 10 } }
```

개발 목데이터 예시:

- `설계/자료/동부5고개.gpx`

### 4.2 코스 생성(경로 업로드)

- POST `/api/v1/courses`

Request (MVP 버전)

```json
{
  "title": "세종 호수공원",
  "visibility": "unlisted",
  "sourceType": "ugc",
  "path": [
    { "lat": 37.1, "lon": 127.1 },
    { "lat": 37.2, "lon": 127.2 }
  ],
  "tags": ["park"],
  "warnings": [
    { "type": "busyCrossing", "severity": 2, "note": "교차로 주의" }
  ]
}
```

### 4.2-b GPX 코스 생성

- POST `/api/v1/courses/gpx`

Request

```json
{
  "title": "동부5고개",
  "visibility": "public",
  "sourceType": "curated",
  "gpxXml": "<?xml version=\"1.0\" ...>...</gpx>"
}
```

Response

```json
{ "code": 200, "message": "success", "data": { "courseId": 10 } }
```

### 4.3 코스 상세 조회

- GET `/api/v1/courses/{courseId}`

Response data (초안)

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 10,
    "title": "한강 산책",
    "visibility": "unlisted",
    "sourceType": "curated",
    "verifiedStatus": "curated",
    "distanceKm": 12.3,
    "estimatedDurationMin": 60,
    "loop": true,
    "amenitiesSummary": { "toiletCount": 8, "cafeCount": 0 },
    "tags": ["river", "beginner"],
    "warnings": [
      { "type": "busyCrossing", "severity": 2, "note": "교차로 주의" }
    ],
    "path": [
      { "lat": 37.1, "lon": 127.1 },
      { "lat": 37.2, "lon": 127.2 }
    ]
  }
}
```

메모(비동기 파생치):

- `amenitiesSummary`는 비동기 계산(워커)로 나중에 채워질 수 있다.
- 아직 계산 전이면 `amenitiesSummary: null`을 반환해 UI가 "계산 중" 상태로 처리할 수 있게 한다.

### 4.4 기본 제공 코스(피처드) 리스트

- GET `/api/v1/courses/featured?region={region}`

Response: 코스 카드 리스트(요약)

### 4.5 코스 공유 링크 발급

- POST `/api/v1/courses/{courseId}/share`

Response

```json
{ "code": 200, "message": "success", "data": { "shareId": "abc123" } }
```

### 4.6 공유 코스 조회

- GET `/api/v1/courses/public/{shareId}`

정책:

- public/unlisted만 접근 가능
- public/unlisted 코스는 프라이버시를 위해 path가 클리핑되어 반환될 수 있다(정책 문서 참조).

### 4.7 코스 GPX 조회

- GET `/api/v1/courses/{courseId}/gpx`
- GET `/api/v1/courses/public/{shareId}/gpx`

Response:

- Content-Type: `application/gpx+xml`
- Body: GPX XML 원문

## 5. Meetup API(MVP3 착수)

- 상세 설계: `설계/22_MVP3_모임_채팅_설계.md`

엔드포인트(고정):

- POST `/api/v1/courses/{courseId}/meetups`
- GET `/api/v1/courses/{courseId}/meetups?status=open`
- GET `/api/v1/meetups/{meetupId}`
- POST `/api/v1/meetups/{meetupId}/join`
- POST `/api/v1/meetups/{meetupId}/leave`

인증:

- 생성/join/leave는 Bearer JWT 필요
- list/detail은 공개 조회 가능

동시성:

- join은 정원(capacity) 조건을 row-level lock으로 보호한다.

### 5.1 Meetup 임시 채팅 API(WebSocket/STOMP)

- 상세 설계: `설계/22_MVP3_모임_채팅_설계.md`
- 연결 엔드포인트:
  - WebSocket: `ws://<host>/ws-stomp`
  - SockJS fallback: `http://<host>/ws-stomp`
- 앱 destination prefix: `/app`
- 구독 topic:
  - 실시간 메시지: `/topic/meetups/{meetupId}/chat`
  - 히스토리 응답(user queue): `/user/queue/meetups/{meetupId}/chat.history`
- 발행/요청:
  - 메시지 발행: `/app/meetups/{meetupId}/chat.send`
  - 히스토리 요청: `/app/meetups/{meetupId}/chat.history`

Request (chat.send)

```json
{ "body": "출발 5분 전이에요!" }
```

Broadcast payload (topic)

```json
{
  "messageId": "f5a1f0f9a7b14f29a3326ce7c8d6a356",
  "meetupId": 1001,
  "authorDisplayName": "익명",
  "body": "출발 5분 전이에요!",
  "sentAt": "2026-03-05T15:04:00+09:00"
}
```

채팅 정책:

- 모임 참가자만 publish/subscribe 가능
- 메시지 길이 최대 200자
- DB 비저장(in-memory 최근 N개 히스토리)

## 6. Admin/Backoffice API(초안)

> MVP는 UI 없이도 관리 가능한 수준의 API만 있어도 된다.

- Headers: `X-Admin-Key: <ADMIN_API_KEY>`
- GET `/api/v1/admin/tags`
- POST `/api/v1/admin/tags`
- PATCH `/api/v1/admin/tags/{tagId}`
- DELETE `/api/v1/admin/tags/{tagId}` (hard delete 대신 비활성화)
- GET `/api/v1/admin/courses/{courseId}/warnings`
- POST `/api/v1/admin/courses/{courseId}/warnings`
- DELETE `/api/v1/admin/warnings/{warningId}`
- POST `/api/v1/admin/courses/{courseId}/metadata/recalculate`
