# Overview

BikeOasis mobile focuses on one clear commuter flow:

1. Discover a safe/usable route context (map + nearby toilets)
2. Record an actual ride
3. Convert real ride data into reusable course content

## Product style target

- Mobility utility first (fast, practical)
- Swing-like urban confidence + GCOO-like clear accessibility
- Map-centric UI with compact actionable overlays
- Bright day-time readability first (outdoor visibility prioritized)

## MVP scope (current implementation target)

- Map
  - Foreground location permission
  - Current position
  - Nearby toilet query and marker rendering (`GET /api/v1/pois/nearby`)
- Courses
  - Featured list (`GET /api/v1/courses/featured`)
  - Course detail and follow (`GET /api/v1/courses/{id}`)
  - Off-route detection with hysteresis in follow mode
- Ride
  - Start/stop path recording
  - Ride upload (`POST /api/v1/ridings`)
  - Along-route toilet query (`POST /api/v1/pois/along-route`)
  - Course creation from recorded path (`POST /api/v1/courses`)
- Settings
  - API base URL configuration
  - Radius configuration
  - Persistent device UUID copy

## Explicitly deferred

- Login/auth and profile UX (backend user endpoints are not active yet)
- Background location service lifecycle optimization
- Shared course deep-link entry UX (`/courses/public/{shareId}` UI pending)
