# Architecture

## Goal

Build a frontend that is stable for MVP delivery now, but can scale without rewrite when auth, background tracking, and richer course features are added.

## Current stack

- Expo-managed React Native + TypeScript
- React Navigation (tabs + stack)
- `fetch` API client wrapper (`src/api/client.ts`)
- Zustand persisted settings store (`src/state/settingsStore.ts`)
- AsyncStorage (general settings) + SecureStore (auth token)

## Practical architecture baseline (adopted)

### 1) Layered module boundaries

- `api/`: endpoint functions only, no UI logic
- `types/`: backend DTO-aligned request/response types
- `state/`: client settings and persistent app config
- `screens/`: orchestration + rendering only
- `components/`: reusable view primitives (map wrapper, UI cards/buttons to expand)
- `utils/`: stateless helpers (distance, downsampling, uuid)

### 2) API mapping policy

- Frontend endpoint calls must map 1:1 to active backend controller methods.
- No speculative endpoint call (example: use real `POST /api/v1/courses/from-riding` for ride-save flow).
- DTO naming in frontend mirrors backend response intent.

### 3) State policy

- Persist durable configuration (`apiBaseUrl`, `radius`, `userId`, `deviceUuid`) in AsyncStorage.
- Persist auth token in SecureStore.
- Keep volatile ride tracking state in screen scope for MVP.
- Move to dedicated ride store/hook only when background tracking is introduced.

## Design system direction (Swing x GCOO inspired)

- Visual tone: bright outdoor dashboard (sky-tinted background + white cards + electric accent + mint safety accent)
- Information style: high-contrast status chips, map-first layout, floating action cards
- Interaction style: quick, glove-friendly controls (large press targets, clear hierarchy)

### Shared UI primitives

- `src/components/ui/AppButton.tsx`
- `src/components/ui/AppCard.tsx`
- `src/components/ui/AppChip.tsx`
- `src/components/ui/ScreenContainer.tsx`

All major screens should compose these primitives first, and only add screen-local styles for layout differences.

## Target folder shape (next refactor stage)

```text
src/
  api/
  components/
    ui/
  hooks/
  navigation/
  screens/
  state/
  theme/
  types/
  utils/
```

## Error handling standards

- Treat non-2xx as errors.
- Prefer backend `message` when available.
- Surface retry path in-screen (not only modal alert) for map/course list failures.

## Location tracking standards

- Foreground permission only in MVP.
- Sampling baseline: `timeInterval=2000ms`, `distanceInterval=5m`.
- Off-route detection uses point-to-segment distance + hysteresis to avoid flicker.

## References used to shape this baseline

- Expo Router/architecture docs (for future file-routing migration)
- Shopify RN performance guidance (list/map-heavy flows)
- Zustand practical state split (server-state vs client-state separation)
