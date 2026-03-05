# Screens

## Navigation map

- Tabs: `Map`, `Courses`, `Ride`, `Settings`
- Stack overlays: `CourseDetail`, `CourseFollow`

## 1) Map

Purpose: immediate local context and sanitary stop discovery.

Primary API:

- `GET /api/v1/pois/nearby`

Core UI:

- Full map canvas
- Floating control card (radius, refresh, result count)
- Nearby toilet markers

## 2) Courses (Featured)

Purpose: give non-empty riding options on cold start.

Primary API:

- `GET /api/v1/courses/featured`

Core UI:

- Card list with distance/time/tags
- Status chip (featured/order context)
- Pull-to-refresh

## 3) Course Detail

Purpose: validate if this course is worth following.

Primary API:

- `GET /api/v1/courses/{courseId}`

Core UI:

- Route map preview with start/end markers
- Metadata strip (distance, duration, loop, toilets)
- Warning list
- Community comments (list/create/delete/report)
- CTA: Start Following

## 4) Course Follow

Purpose: turn a stored route into live guidance.

Primary API:

- `GET /api/v1/courses/{courseId}`

Core UI:

- Route polyline + user location
- Distance-to-route indicator
- Off-route banner with hysteresis logic to avoid flicker
- Recenter action and stop-follow action

## 5) Ride

Purpose: record and save user-generated ride data.

Primary APIs:

- `POST /api/v1/ridings`
- `POST /api/v1/pois/along-route`
- `POST /api/v1/courses/from-riding`

Core UI:

- Ride state badge (`IDLE`, `RUNNING`, `STOPPED`)
- Time/distance live metrics
- Start/Stop/Submit/Clear controls
- Post-submit metrics (rideId, toilets count)
- Save as Course action (ridingId 기반 코스 생성)

## 6) Settings

Purpose: device-local ops and backend connectivity setup.

Core UI:

- API base URL input + connectivity test
- Nearby/route radius configuration
- Optional userId for location APIs
- Device UUID display + copy button
- Kakao code exchange form (`/api/v1/auth/kakao`)
- Access token persistence for comment write actions
