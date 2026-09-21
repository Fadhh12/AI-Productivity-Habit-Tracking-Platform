# Phase 27 — UI polish, step 7: responsive QA and overlays

Audit of fixed widths, overflow and `100vh` usage found no horizontal-overflow risks: decorative glows sit inside
`overflow-hidden` containers, dropdowns already clamp to the viewport (`max-w-[calc(100vw-1rem)]`, `inset-x-2`),
and `body` has `overflow-x: hidden` as a guard.

- Overlays now animate: confirm dialog (fade + scale), notification panel (scale from top), account menu (scale from top-right),
  badge toast (slide up, width-capped for 320px screens), offline banner (fade).
- Challenge progress bar uses `scaleX` like the other bars.
- Activity Logs: stagger, lifted cards, tinted shadows.
- Remaining `shadow-sm/md/xl` replaced with the tinted tokens.

Known, pre-existing and untouched: ESLint `react-hooks/refs` error in `lib/useQueueFlushed.ts`, and two Google Fonts
warnings in `app/layout.tsx`.

Not done: automated screenshot checks at 320/375/768/1280px (needs backend + browser driver running).
