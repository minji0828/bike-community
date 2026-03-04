# Overview

BikeOasis mobile is a React Native app focused on:

- Showing nearby toilets (POI) around the rider
- Tracking a ride (path points) and saving it to the backend
- Querying toilets along a recorded route

## MVP scope

- Map screen
  - Request foreground location permission
  - Show current position
  - Fetch and display nearby toilets as map markers
- Ride screen
  - Start/stop tracking
  - Record path points (lat/lon) locally
  - Submit a ride to the backend (`POST /api/v1/ridings`)
  - Fetch toilets along that path (`POST /api/v1/pois/along-route`)
- Settings screen
  - Configure API base URL for local/dev environments
  - Show a persistent `deviceUuid` used for anonymous rides

## Non-goals (for now)

- Authentication / login UI
- User creation/profile flows (backend `UserController` is currently empty)
- Background location tracking (foreground-only until requirements are confirmed)
