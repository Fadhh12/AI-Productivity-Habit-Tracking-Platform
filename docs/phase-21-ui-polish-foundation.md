# Phase 21 — UI polish, step 1: motion foundation

First of a series of small UI/motion upgrades. No new dependencies; everything is CSS/Tailwind.

## What changed

- `frontend/app/globals.css`: shared spring easing (`--ease-spring`), tinted shadows
  (brand olive instead of black), visible keyboard focus ring, smooth scroll,
  `text-wrap: balance/pretty`, and reusable utilities: `.press` (pressed feedback),
  `.lift` (hover rise, hover-capable pointers only), `.stagger` (children fade up in
  sequence), `.shimmer`, `.tabular`, `.no-scrollbar`.
- Keyframes: `fade-up`, `fade-in`, `scale-in`, `slide-up`, `pop`, `ring-pulse`,
  `float`, `flame`, `shimmer`. Also exposed as Tailwind `animate-*` classes.
- `prefers-reduced-motion: reduce` disables movement globally.
- `Skeleton` now uses a shimmer sweep instead of a pulse.

## Rules for later steps

Animate only `transform` and `opacity`. Use the shared easing. Never leave an
element invisible when motion is off.
