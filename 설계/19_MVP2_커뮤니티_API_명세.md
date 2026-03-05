# MVP2 커뮤니티 API 명세(초안)

- 문서 ID: MVP2-API
- 버전: v0.1
- 작성일: 2026-03-04
- 상태: 초안

목적:

- MVP2 커뮤니티(댓글)의 API 계약을 고정한다.
- 카카오 로그인 기반(userId)으로 작성/삭제/신고 권한을 최소한으로 적용한다.

관련 문서:

- 요구사항: `설계/17_MVP2_요구사항정의서.md`
- 스키마: `설계/18_MVP2_커뮤니티_데이터모델_스키마.md`
- 공통 응답 포맷: `설계/11_API_명세.md`

---

## 0. 공통 규칙

- Base URL: `/api/v1`
- Response: `ApiResponse{ code(int), message, data }`

### 0.1 헤더(인증)

write 요청 필수:

- `Authorization: Bearer <access_token>`

로그인 설계:

- `설계/21_인증_카카오_OIDC.md`

---

## 1. Course Comment API (MVP2 Must)

### 1.1 댓글 작성

- POST `/api/v1/courses/{courseId}/comments`

Request

```json
{ "body": "화장실 간격 괜찮고 초보도 무난했어요" }
```

Response

```json
{ "code": 200, "message": "success", "data": { "commentId": 501 } }
```

### 1.2 댓글 조회

- GET `/api/v1/courses/{courseId}/comments?cursor=&limit=`

Response data (예시)

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 501,
      "author": { "displayName": "익명" },
      "body": "화장실 간격 괜찮고 초보도 무난했어요",
      "createdAt": "2026-03-04T10:00:00+09:00",
      "isMine": false
    }
  ]
}
```

익명 표시 정책:

- 댓글 작성자는 화면/UI에서 항상 `익명`으로 표시한다.
- API는 작성자 userId/email/카카오 프로필 같은 식별 정보를 노출하지 않는다.
- 클라이언트에서 "삭제" 버튼 노출을 위해 `isMine`만 제공한다.

### 1.3 댓글 삭제

- DELETE `/api/v1/comments/{commentId}`

정책:

- 작성자만 삭제 가능
- 삭제는 soft delete(status=deleted) 권장

### 1.4 댓글 신고(선택)

- POST `/api/v1/comments/{commentId}/reports`

Request

```json
{ "reason": "spam", "note": "광고 링크" }
```

Response

```json
{ "code": 200, "message": "success", "data": { "reportId": 9001 } }
```

### 1.5 (운영) 댓글 숨김/숨김 해제

신고된 댓글을 운영이 숨김 처리할 수 있어야 한다.

- PATCH `/api/v1/admin/comments/{commentId}/hide`
- PATCH `/api/v1/admin/comments/{commentId}/unhide`

Headers

- `X-Admin-Key: <ADMIN_API_KEY>`

Response (예시)

```json
{ "code": 200, "message": "success", "data": "hidden" }
```

메모:

- `ADMIN_API_KEY`가 설정되지 않으면 운영 API는 비활성(404)로 간주한다.

---

## 2. Auth API (MVP2 Must)

상세는 `설계/21_인증_카카오_OIDC.md`에서 고정한다.

---

## 3. Rate Limit(초안)

- 댓글 작성: userId 기준 30/day
- 댓글 신고: userId 기준 50/day

---

## 4. 멱등성 메모(초안)

- 댓글 작성은 기본적으로 멱등을 강제하지 않는다.
- 스팸/도배는 rate limit과 신고/숨김으로 대응한다.
