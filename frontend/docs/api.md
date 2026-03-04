# API Mapping (Backend 1:1)

This document maps the current mobile frontend to the actual backend controller code (`src/main/java/com/bikeoasis/domain/**/controller`).

Base URL examples:

- Android emulator: `http://10.0.2.2:8080`
- iOS simulator: `http://localhost:8080`
- Physical device: `http://<your-lan-ip>:8080`

## Response conventions

- Most endpoints return wrapped shape:

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- Exception: `POST /api/v1/ridings` returns raw `Long` (ridingId), not `ApiResponse` wrapper.

## Mobile-used endpoints

### POI

#### `GET /api/v1/pois/nearby`

- Query: `lat`, `lon`, `radius` (default backend = `500`)
- Response `data`: `ToiletResponseDto[]`
- Used by: `Map` screen

#### `POST /api/v1/pois/along-route`

- Query: `radius` (default backend = `100`)
- Body: `[{ lat, lon }]`
- Response `data`: `ToiletResponseDto[]`
- Used by: `Ride` screen after submit

### Riding

#### `POST /api/v1/ridings`

- Body: `RidingCreateRequest`
  - `deviceUuid`, `userId`, `title`, `totalDistance`, `totalTime`, `avgSpeed`, `path`
- Response: raw numeric `ridingId`
- Used by: `Ride` screen submit flow

### Course

#### `GET /api/v1/courses/featured`

- Query: optional `region`
- Response `data`: `CourseFeaturedResponse[]`
  - `id`, `title`, `distanceKm`, `estimatedDurationMin`, `loop`, `featuredRank`, `tags`
- Used by: `Courses` list screen

#### `GET /api/v1/courses/{courseId}`

- Response `data`: `CourseDetailResponse`
  - `id`, `title`, `visibility`, `sourceType`, `verifiedStatus`, `distanceKm`, `estimatedDurationMin`, `loop`, `amenitiesSummary`, `tags`, `warnings`, `path`
- Used by: `Course detail` and `Course follow`

#### `POST /api/v1/courses`

- Body: `CourseCreateRequest`
  - `ownerUserId`, `deviceUuid`, `title`, `description`, `visibility`, `sourceType`, `path`, `tags`, `warnings`
- Response `data`: `{ "courseId": number }`
- Used by: `Ride` screen "Save as course"

#### `POST /api/v1/courses/{courseId}/share`

- Response `data`: `{ "shareId": string }`
- Used by: reserved for next UI increment (share button)

#### `GET /api/v1/courses/public/{shareId}`

- Response `data`: `CourseDetailResponse`
- Used by: reserved for deep-link/shared course entry

## Future-ready endpoints (not fully exposed in current UI)

### Location (`/api/v1/locations`)

- Current, update, history, period, recent, nearby, distance, delete old history endpoints are available server-side.
- In mobile UI, these stay behind `userId` prerequisite until user onboarding/auth flow is added.

### User (`/api/v1/users`)

- Controller exists but no active endpoint methods yet.
