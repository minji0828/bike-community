# 라이딩 GPS 추적/기록 설계(내 경로 기록)

- 문서 ID: RIDE-GPS-TRACKING
- 버전: v0.1
- 작성일: 2026-03-04
- 상태: 초안

목적:

- RN(모바일)에서 GPS 기반으로 "내 경로"를 안정적으로 추적/기록하고, 서버에 저장해 코스로 변환하는 흐름을 고정한다.
- 배터리/노이즈/성능(좌표 개수) 문제를 초기 단계에서 통제한다.

관련 문서:

- 유저 플로우: `설계/06_유저플로우.md`
- 아키텍처/런타임: `설계/12_아키텍처_런타임플로우.md`
- API: `설계/11_API_명세.md`
- 정책(프라이버시/권한): `설계/04_정책정의서.md`
- FR/NFR: `설계/03_기능_비기능_요구사항명세서.md`

---

## 0. 고정(Decision) 목록

MVP 기본값:

- Foreground 추적만 지원(백그라운드 기록은 vNext).
- 좌표 수집은 "시간 간격"과 "거리 간격"을 같이 사용한다.
  - 기본값: `timeInterval=2000ms`, `distanceInterval=5m`, 정확도는 Balanced(배터리/노이즈 균형)
- 좌표 필터링:
  - 연속 포인트 간 거리가 2m 미만이면 버린다(중복/노이즈 방지)
  - (선택) accuracy가 너무 나쁘면(예: > 40m) 버린다(추후 실측으로 조정)
- 업로드 전에 경로를 단순화/다운샘플링하여 최대 N 포인트로 제한한다.
  - 기본값: 250 포인트
- 서버 저장 포맷은 PostGIS `LineString(SRID=4326)`를 표준으로 한다.
- 코스 생성은 `ridingId` 기반으로 한다.
  - `POST /api/v1/courses/from-riding`

---

## 1. 사용자 경험(UX) 플로우

### 1.1 라이딩 기록

1) 라이딩 시작
2) 지도에서 내 위치/경로가 실시간으로 그려짐
3) 중지(종료)
4) 제출(서버 저장): `/api/v1/ridings`

라이딩 화면에서 최소로 보여줄 것:

- 경과 시간
- 누적 거리
- 상태(주행 중/정지)

### 1.2 라이딩 -> 코스 저장

라이딩 저장 후:

- "코스로 저장"을 눌러 `/api/v1/courses/from-riding` 호출
- 생성된 코스 상세로 이동

---

## 2. RN GPS 수집 정책(샘플링/노이즈)

### 2.1 권한

- MVP: `foreground` 위치 권한만 요구한다.
- 권한 거부 시:
  - 라이딩 기록 기능은 제한됨을 명확히 안내
  - 코스 상세/따라가기(레벨2)는 권한이 없으면 제한 모드로 동작(정책 문서 참조)

### 2.2 위치 수집(기본값)

권장 기본값(초안):

- accuracy: Balanced
- timeInterval: 2000ms
- distanceInterval: 5m

의도:

- 1초 단위/BestForNavigation은 배터리 소모가 크고 GPS 노이즈가 더 잘 드러날 수 있다.
- 2초/5m 조합은 라이트 라이딩부터 여행형 라이딩 초입까지 MVP에 충분한 해상도를 제공한다.

### 2.3 필터링(노이즈 제거)

좌표를 path에 추가하기 전 체크:

- 최소 이동 거리: 이전 포인트와 2m 미만이면 skip
- (선택) 정확도: accuracy가 너무 큰 경우 skip(초기 기준 40m, 실측으로 조정)
- (선택) 점프 방지: 짧은 시간에 비현실적인 속도(예: > 70km/h)로 이동한 것으로 보이면 skip

### 2.4 거리/시간 계산

- 거리: 수락된 포인트 간 haversine 합
- 시간: 시작 시각 ~ 종료 시각(초)
- 평균 속도: `distance/time * 3.6`

주의:

- GPS 노이즈는 거리/속도를 과대 추정할 수 있다.
- MVP에서는 "단순" 계산으로 시작하고, 오탐이 커지면 필터/스무딩을 강화한다.

### 2.5 업로드 전 다운샘플링

목표:

- 과도한 좌표 수(수천~수만)로 인해 앱 렌더링/업로드/DB 저장이 무거워지는 것을 방지

정책:

- 업로드 전 path를 최대 250 포인트로 축소
- MVP는 균등 샘플링으로 시작
- vNext: RDP(Ramer-Douglas-Peucker) 단순화로 품질 개선

---

## 3. API 계약(라이딩/코스)

### 3.1 라이딩 저장

- POST `/api/v1/ridings`

Request (예시)

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

Response

- 현재 구현: `ridingId` 숫자(Long)를 plain text/json number로 반환
- 권장 표준: `ApiResponse<{ridingId}>` (추후 통일)

### 3.2 코스 생성(라이딩 기반)

- POST `/api/v1/courses/from-riding`

Request (예시)

```json
{
  "ridingId": 123,
  "title": "한강 산책",
  "visibility": "public",
  "sourceType": "ugc",
  "tags": ["river"],
  "notes": "초보자 추천"
}
```

Response

```json
{ "code": 200, "message": "success", "data": { "courseId": 10 } }
```

---

## 4. 서버 저장(스키마/검증)

### 4.1 저장 포맷

- DB는 `ridings.path_data`(LineString, SRID 4326)로 저장한다.
- 좌표 순서 규칙: (lon, lat)

### 4.2 입력 검증(권장)

- path는 최소 2개 좌표 필요
- 좌표 범위 검증(위도 -90~90, 경도 -180~180)
- deviceUuid 필수

### 4.3 신뢰/재계산(추후)

- MVP: 클라이언트 계산(totalDistance/avgSpeed)을 그대로 저장
- vNext: 서버에서 distance 재계산 및 이상치 탐지(점프/노이즈)로 품질 개선

---

## 5. 프라이버시/운영 메모

- 위치/경로는 민감 데이터로 취급한다.
  - 운영 로그에 원본 위경도 INFO 출력 금지(POL-002)
- 공유 정책:
  - 라이딩 원본은 공유하지 않고, 코스 공유(shareId)만 제공하는 것을 기본으로 한다.

---

## 6. 완료 기준(DoD)

- RN에서 라이딩 시작/중지 후 path가 누적된다.
- `/api/v1/ridings` 저장 성공 시 ridingId를 받는다.
- `/api/v1/courses/from-riding`로 코스 생성이 가능하다.
- 생성된 코스를 `/api/v1/courses/{id}`로 조회 시 polyline이 정상 렌더링된다.

---

## 7. 오픈 이슈(vNext)

- 백그라운드 기록 정책(권한/고지/배터리)
- 오프라인(네트워크 끊김) 시 로컬 버퍼링/재전송
- 경로 단순화(RDP) 도입 시 허용 오차/품질 기준
- 라이딩 삭제/다운로드(개인 데이터 관리)
