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

- Use a shared token set (colors, spacing, radius, typography) from `src/theme/tokens.ts`.
- Keep touch targets >= 44px.
- Use status chips and banners for ride/follow state.
- Avoid deeply nested component trees inside screens.

## 5) Component rule (mandatory)

- Put reusable presentation units in `src/components/ui`.
- Current base primitives:
  - `AppButton`: all action buttons (primary/ghost/danger)
  - `AppCard`: floating cards and section containers
  - `AppChip`: compact status tags and metadata pills
  - `ScreenContainer`: screen-level bright background container
- Screen files should orchestrate data/state, not duplicate visual primitives.

## 6) Style direction (Swing x GCOO inspired)

- Bright sky background + white elevated surfaces + electric blue action + mint safety accents.
- High contrast for outdoor readability.
- Rounded cards for quick-glance mobility dashboard feel.
- Map overlays must remain translucent and readable over street labels.

## 7) UX checklist (bike app benchmark)

- Minimize taps for primary flow: `위치 확인 -> 조회 -> 시작/중지`.
- Keep primary CTA visually strongest in each card.
- Put live metrics (거리/시간/상태) in first viewport.
- Keep cards glove-friendly: larger pills, clear spacing, no tiny icon-only controls.

## 8) Performance checklist

- Memoize derived map polylines and computed stats.
- Keep marker count manageable and avoid unnecessary rerenders.
- Downsample path before upload.

## 9) Error handling checklist

- API errors show backend message where available.
- Keep recover path visible (`Retry`, `Refresh`, `Test connection`).
- Do not silently swallow permission/network failures.

## 10) Delivery checklist

- Typecheck (`npx tsc --noEmit`)
- Manual map flow sanity check
- Backend mapping document updated when endpoint usage changes
