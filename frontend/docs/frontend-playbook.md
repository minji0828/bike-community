# Frontend Playbook

This playbook defines the practical engineering standard for the mobile frontend.

## 1) Planning rule

- Map user flow -> API contract -> screen state -> UI components.
- Do not design a screen before confirming backend endpoint shape.

## 2) API rule

- Keep endpoint calls in `src/api/*` only.
- Screen code never builds URLs directly.
- If backend returns wrapper (`{ code, message, data }`), unwrap in API layer.

## 3) State rule

- Persist only durable values: base URL, radius config, `deviceUuid`, optional `userId`.
- Keep high-frequency live values (`path`, GPS ticks) in screen/hook state for MVP.

## 4) UI rule

- Use a shared token set (colors, spacing, radius, typography).
- Keep touch targets >= 44px.
- Use status chips and banners for ride/follow state.
- Avoid deeply nested component trees inside screens.

## 5) Style direction (Swing x GCOO inspired)

- Deep navy base + electric blue action + mint safety accents.
- High contrast for outdoor readability.
- Rounded cards for quick-glance mobility dashboard feel.

## 6) Performance checklist

- Memoize derived map polylines and computed stats.
- Keep marker count manageable and avoid unnecessary rerenders.
- Downsample path before upload.

## 7) Error handling checklist

- API errors show backend message where available.
- Keep recover path visible (`Retry`, `Refresh`, `Test connection`).
- Do not silently swallow permission/network failures.

## 8) Delivery checklist

- Typecheck (`npx tsc --noEmit`)
- Manual map flow sanity check
- Backend mapping document updated when endpoint usage changes
