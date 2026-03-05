# Design Tokens

This project uses a custom token set inspired by common micromobility UI patterns (Swing/GCOO/Lime/Tier):

- bright, sky-tinted backgrounds
- white surfaces with soft borders
- electric primary action color
- high-visibility accents (mint/lime/yellow)

Current mode: **Sporty Lime**

- primary CTA: electric blue (`colors.primary`)
- active/navigation/status success emphasis: lime (`colors.lime`)
- warning accent: yellow (`colors.swingYellow` / `colors.warning`)

Tokens are defined in:

- `frontend/mobile/src/theme/tokens.ts`

## Token groups

- `colors`: background/surface/text + brand accents
- `spacing`: layout rhythm
- `radius`: pill + card rounding
- `typography`: base scale
- `shadows`: consistent floating depth

## Usage rules

- Screen backgrounds use `colors.bg` via `ScreenContainer`.
- Floating overlays on maps use `colors.mapCard`.
- Reusable UI must be built with `AppCard`, `AppButton`, `AppChip` first.

## Notes on "real service" references

We do not copy proprietary design systems. We only borrow high-level patterns that are common in the industry and implement our own token values.
