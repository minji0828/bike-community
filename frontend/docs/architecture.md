# Architecture

## Stack

- React Native via Expo (managed)
- TypeScript
- React Navigation
- Data fetching via `fetch` (simple REST)
- Storage: AsyncStorage (config + device UUID)

## App structure

`frontend/mobile/src/`

- `api/` - REST client + endpoint functions
- `navigation/` - React Navigation tabs
- `screens/` - screen components (Map/Ride/Settings)
- `state/` - app state stores (settings)
- `types/` - shared TS types matching backend DTOs
- `utils/` - helpers (distance calc, downsampling, uuid)

## Error handling

- Treat any non-2xx response as an error
- Backend uses a wrapper `{ code, message, data }` for most endpoints; show `message` when present
- Keep errors visible but non-blocking (retry-friendly)

## Location sampling

Foreground-only (MVP):

- Use a time-based sampling interval (e.g. 2-5s) OR distance filter
- Append points to `path` while a ride is active
- Derive distance client-side for UI (backend stores the polyline)
