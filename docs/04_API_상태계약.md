# 04_API_상태계약

- 작성일: 2026-03-10
- 상태: 활성 SSOT

## 1. 공통 규칙

- 모든 API는 JSON을 사용한다.
- 시간은 ISO 8601 문자열을 사용한다.
- 인증은 `Authorization: Bearer <service-jwt>`를 사용한다.
- 현재 공통 응답 포맷은 `code/message/data` envelope다.
- 현재 문자열 `errorCode` 계약은 없다. 구현 시 임의로 추가하지 않는다.
- API DTO 좌표는 `{ "lat": ..., "lon": ... }`를 사용한다.
- 내부 JTS/PostGIS 좌표 순서는 항상 `(lon, lat)`다.
- 라이딩/코스 생성/공유 발급의 소유권은 요청 바디가 아니라 JWT `sub`에서 결정한다.

## 2. 공통 응답 포맷

### 성공

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 실패

```json
{
  "code": 400,
  "message": "title은 필수입니다.",
  "data": null
}
```

메모:

- 프론트는 `frontend/lib/api.ts` 기준으로 이 envelope를 파싱한다.
- `success/data/error` 구조로 바꾸는 것은 별도 계약 변경이다.

## 3. 인증 상태

### AuthStatus

- `checking`
- `authenticated`
- `anonymous`
- `error`

### 인증 API

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/v1/auth/kakao` | 없음 | 카카오 authorization code(PKCE) 교환 후 서비스 JWT 발급 |
| GET | `/api/v1/auth/me` | 필요 | 현재 로그인 사용자 조회 |
| GET | `/api/auth/me` | same-origin route | 프론트가 사용하는 auth proxy |

## 4. 현재 MVP1 핵심 API

| 유스케이스 | Method | Path | 인증 | 핵심 입력 | 핵심 출력 |
|---|---|---|---|---|---|
| 홈 featured 코스 조회 | GET | `/api/v1/courses/featured` | 선택 | `region?` | 코스 카드 목록 |
| 홈 주변 화장실 조회 | GET | `/api/v1/pois/nearby` | 선택 | `lat`, `lon`, `radius?` | 화장실 목록 |
| 코스 상세 조회 | GET | `/api/v1/courses/{courseId}` | 선택 | `courseId` | 코스 메타, warnings, path |
| 경로 주변 화장실 조회 | POST | `/api/v1/pois/along-route?radius=` | 선택 | `PointDto[]` | 화장실 목록 |
| 라이딩 저장 | POST | `/api/v1/ridings` | 필요 | `deviceUuid`, `path[]` | `ridingId` |
| 라이딩 기반 코스 생성 | POST | `/api/v1/courses/from-riding` | 필요 | `ridingId`, `title`, `visibility`, `tags?` | `courseId` |
| 코스 공유 링크 발급 | POST | `/api/v1/courses/{courseId}/share` | 필요 | `courseId` | `shareId` |
| 공유 코스 조회 | GET | `/api/v1/courses/public/{shareId}` | 없음 | `shareId` | 공개/링크공유 코스 상세 |

## 5. MVP1 핵심 상태값

### CourseVisibility

- `public`
- `unlisted`
- `private`

### CourseSourceType

- `curated`
- `ugc`
- `import`

### CourseVerifiedStatus

- `unverified`
- `community`
- `curated`

### Guide UI State

- `loading`
- `ready`
- `playing`
- `paused`
- `off_route`
- `finished`

### Ride UI State

- `idle`
- `recording`
- `paused`
- `saving`
- `saved`
- `error`

## 6. 대표 요청/응답

### POST `/api/v1/auth/kakao`

Request:

```json
{
  "code": "authorization-code",
  "codeVerifier": "pkce-verifier",
  "redirectUri": "http://localhost:3000/auth/kakao/callback",
  "nonce": "random-nonce"
}
```

Response:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accessToken": "jwt",
    "expiresInSec": 3600
  }
}
```

### POST `/api/v1/ridings`

Request:

```json
{
  "deviceUuid": "device-uuid",
  "title": "아침 라이딩",
  "totalDistance": 12.3,
  "totalTime": 3600,
  "avgSpeed": 20.2,
  "path": [
    { "lat": 37.1, "lon": 127.1 },
    { "lat": 37.2, "lon": 127.2 }
  ]
}
```

메모:

- 로그인 사용자의 소유자는 access token에서 추출하며, 클라이언트는 `userId`를 보내지 않는다.

Response:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "ridingId": 123
  }
}
```

### POST `/api/v1/courses/from-riding`

Request:

```json
{
  "ridingId": 123,
  "title": "한강 산책",
  "visibility": "private",
  "tags": ["river", "beginner"],
  "notes": "초보자 추천"
}
```

Response:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "courseId": 10
  }
}
```

## 7. 에러 처리 기준

- 현재 기준은 HTTP status + `ApiResponse.code` + `message`다.
- 구현 시 문서에 없는 새 에러 필드를 추가하지 않는다.
- 먼저 처리해야 하는 대표 상태:
  - `400`: 입력값 오류, path 부족, visibility/sourceType 오류
  - `401`: 로그인 필요, 토큰 만료
  - `403`: 관리자 키 필요, 권한 없음, 타인 소유 riding/course 접근
  - `404`: riding / course / share target 없음
  - `409`: 동시성 충돌 또는 잠금 충돌
  - `500`: 서버 내부 오류

## 8. 프론트 상태 처리 기준

### 홈

- featured 조회 실패 시 샘플 fallback은 허용하되 표시를 남긴다.
- 위치 권한 거부 시 코스 조회는 계속 가능해야 한다.

### 코스 상세

- 코스 상세 실패와 highlights/meetups 부가 섹션 실패를 분리한다.
- 부가 섹션 실패가 코스 상세 전체를 막으면 안 된다.

### 따라가기

- 실시간 위치가 없어도 코스 정보는 먼저 렌더링한다.
- 오프루트는 치명 오류가 아니라 안내 상태다.

### 인증

- 저장된 토큰은 `/api/auth/me`로 재검증 후 확정한다.
- 재검증 실패 시 즉시 anonymous 또는 error 상태로 전환한다.

## 9. MVP1 계측 이벤트 계약

메모:

- 이벤트 이름은 프론트와 백엔드가 공통으로 보는 계약이다.
- 수집 도구는 나중에 바꿀 수 있지만, 이벤트 이름과 최소 속성은 문서 없이 임의 변경하지 않는다.
- `shareId` 같은 민감 식별자는 외부 분석 도구에 raw 값으로 보내지 않고 해시 또는 내부 로그 전용으로 다룬다.

| Event | 발생 위치 | 발생 조건 | 최소 속성 |
|---|---|---|---|
| `home_viewed` | frontend `/` | 홈 진입 완료 | `sessionId`, `isAuthenticated` |
| `featured_course_clicked` | frontend `/` | featured 카드 클릭 | `courseId`, `position` |
| `course_detail_viewed` | frontend `/course/[id]` | 상세 API 성공 후 상세 렌더링 | `courseId`, `entry` |
| `guide_started` | frontend `/course/[id]/guide` | 사용자가 가이드를 시작 상태로 전환 | `courseId`, `entry` |
| `guide_off_route_detected` | frontend `/course/[id]/guide` | `playing -> off_route` 전환 | `courseId`, `distanceFromPathMeters` |
| `riding_save_requested` | frontend `/ride` | 저장 버튼 클릭 | `pointCount`, `hasToken` |
| `riding_save_succeeded` | backend `POST /api/v1/ridings` | 라이딩 저장 성공 | `ridingId`, `userId` |
| `course_created_from_riding` | backend `POST /api/v1/courses/from-riding` | 코스 생성 성공 | `courseId`, `ridingId`, `visibility` |
| `course_share_issued` | backend `POST /api/v1/courses/{courseId}/share` | 공유 링크 발급 성공 | `courseId`, `visibility` |
| `shared_course_opened` | frontend `/share/[shareId]` | 공유 코스 조회 성공 | `shareType`, `entry` |

## 10. 변경 규칙

- 새 API를 MVP1 핵심 경로에 넣으면 이 문서를 먼저 수정한다.
- 상태값 이름을 바꾸면 프론트와 백엔드 코드를 함께 바꾸기 전에 이 문서를 먼저 수정한다.
- 기술 선택 변경은 이 문서가 아니라 ADR에서 먼저 결정한다.
