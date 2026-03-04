# Screens

## 1) Home / Map

Purpose: orientation + quick access to nearby toilets.

Key UI elements:

- Map centered on current location
- "Refresh" action to re-fetch nearby toilets
- Radius control (default 500m)
- Marker detail sheet (name/address/opening hours)

Primary flows:

1. App launch -> request location permission -> map centers on user
2. Fetch nearby toilets -> render markers
3. Tap marker -> see details

## 2) Ride

Purpose: capture a route and request toilets along it.

Key UI elements:

- Start/Stop button
- Live stats: elapsed time, approximate distance (client-side)
- Polyline on map for recorded path
- Results panel: toilets along route

Primary flows:

1. Start -> begin sampling location -> append points to path
2. Stop -> submit ride to backend -> fetch toilets along route -> show results

## 3) Settings

Purpose: local configuration and debugging.

- API base URL (e.g. `http://10.0.2.2:8080` for Android emulator)
- Default nearby radius
- Show/copy device UUID
