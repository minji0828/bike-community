# API 명세

- 문서 ID: API-SPEC
- 버전: v0.4
- 작성일: 2026-03-11
- 상태: 활성(MVP1 핵심 + 확장 일부 포함)

목적:

- 모바일 앱, 현재 저장소 웹 앱, 백엔드가 함께 참고하는 상세 API 명세를 제공한다.
- `docs/04_API_상태계약.md`가 MVP1 얇은 실행 계약이라면, 이 문서는 그보다 상세한 L1 명세다.

참조:

- `설계/03_기능_비기능_요구사항명세서.md`
- `설계/10_데이터모델_스키마.md`
- `docs/04_API_상태계약.md`

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

현재 기준:

- 보호 API는 `Authorization: Bearer <service-jwt>`를 사용한다.
- `deviceUuid`는 요청 바디 필드로 유지하되 권한 판단 값으로 사용하지 않는다.

메모:

- 카카오 로그인/토큰 정책은 `설계/21_인증_카카오_OIDC.md`에서 확정한다.

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

- 서버는 `ApiResponse` 래핑 형태를 기본으로 반환한다.
- 소유권은 `Authorization: Bearer <service-jwt>`의 `sub`에서 결정하며 `userId`는 요청 바디로 받지 않는다.

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

## 3.5 Auth API

### 3.5.1 카카오 로그인 교환

- POST `/api/v1/auth/kakao`

Request

```json
{
  "code": "...",
  "codeVerifier": "...",
  "redirectUri": "http://localhost:3000/auth/kakao/callback",
  "nonce": "..."
}
```

Response

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accessToken": "...",
    "expiresInSec": 3600
  }
}
```

### 3.5.2 현재 로그인 사용자 조회

- GET `/api/v1/auth/me`

Header

```http
Authorization: Bearer <service-access-token>
```

Response

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": 1,
    "username": "카카오 닉네임",
    "provider": "KAKAO"
  }
}
```

## 4. Course API(신규, MVP 핵심)

### 4.1 코스 생성(라이딩 기반)

- POST `/api/v1/courses/from-riding`
- Header: `Authorization: Bearer <service-access-token>`

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

서버 저장 정책(내부):

- 로컬/개발 기본: DB(`gpx_data`) 저장
- 운영 기본: S3 본문 저장 + DB(`gpx_object_key`) 참조
- API 계약(Response shape)은 동일하게 유지한다.

### 4.8 여행 컬렉션 생성/조회

- POST `/api/v1/collections`
- GET `/api/v1/collections?mine={boolean}`
- GET `/api/v1/collections/{collectionId}`
- POST `/api/v1/collections/{collectionId}/items`

용도:

- 여러 코스를 주말 투어/여행 계획 단위로 묶어 저장한다.
- `mine=true`는 로그인 사용자 소유 컬렉션만 조회한다.
- `mine=false`(기본값)는 공개(`public`) 컬렉션만 조회한다.

Request (`POST /api/v1/collections`)

```json
{
  "title": "주말 남한강 투어",
  "description": "토요일 오전 코스만 묶어둔 여행 컬렉션",
  "region": "남한강",
  "tripNotes": "보급 포인트와 숙소 후보 정리",
  "visibility": "private"
}
```

Response

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "collectionId": 1
  }
}
```

Request (`POST /api/v1/collections/{collectionId}/items`)

```json
{
  "courseId": 10,
  "positionIndex": 0
}
```

Response (`GET /api/v1/collections/{collectionId}`)

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "collectionId": 1,
    "ownerUserId": 1,
    "title": "주말 남한강 투어",
    "description": "토요일 오전 코스만 묶어둔 여행 컬렉션",
    "region": "남한강",
    "tripNotes": "보급 포인트와 숙소 후보 정리",
    "visibility": "private",
    "itemCount": 1,
    "items": [
      {
        "itemId": 1,
        "courseId": 10,
        "courseTitle": "동부5고개",
        "distanceKm": 68.9,
        "estimatedDurationMin": 276,
        "positionIndex": 0
      }
    ],
    "createdAt": "2026-03-07T19:43:35",
    "updatedAt": "2026-03-07T19:43:48",
    "mine": true
  }
}
```

정책:

- 생성/코스 추가는 Bearer JWT 필요
- private 컬렉션 상세는 소유자만 접근 가능
- 현재 Phase 1에서는 공동 편집자 없이 소유자 1인 모델로 시작한다

### 4.9 코스 하이라이트 생성/조회

- GET `/api/v1/courses/{courseId}/highlights`
- POST `/api/v1/courses/{courseId}/highlights`

용도:

- 코스 위에 전망, 보급, 위험, 사진 포인트 같은 현장 메모를 남긴다.

Request (`POST /api/v1/courses/{courseId}/highlights`)

```json
{
  "type": "viewpoint",
  "title": "강 전망",
  "note": "휴식하기 좋음",
  "lat": 37.5665,
  "lon": 126.978,
  "visibility": "public"
}
```

Response

```json
{
  "code": 200,
  "message": "success",
  "data": "1"
}
```

Response (`GET /api/v1/courses/{courseId}/highlights`)

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "highlightId": 1,
      "courseId": 10,
      "type": "viewpoint",
      "title": "강 전망",
      "note": "휴식하기 좋음",
      "visibility": "public",
      "lat": 37.5665,
      "lon": 126.978,
      "authorUserId": 1,
      "mine": false,
      "createdAt": "2026-03-07T19:43:48"
    }
  ]
}
```

정책:

- 조회는 공개 하이라이트 + 본인 private 하이라이트를 함께 반환한다.
- 작성은 Bearer JWT 필요
- 현재 Phase 1에서는 신고/숨김/운영 moderation은 후속 단계로 둔다.

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

## 7. 운영/배포 체크용 Health API

- GET `/api/v1/health`

Response

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "UP",
    "timestamp": "2026-03-05T15:20:00+09:00"
  }
}
```
