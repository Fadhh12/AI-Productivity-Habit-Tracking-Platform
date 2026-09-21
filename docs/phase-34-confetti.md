# Phase 34 — Celebration: confetti and haptics

- `components/Confetti.tsx`: 36 CSS-animated pieces (transform and opacity only), random scatter drawn per burst, skipped under `prefers-reduced-motion`.
- Plays when a new badge unlocks (from the toast corner) and when a check-in completes **every** active habit for the day (from the top of the dashboard).
- Short `navigator.vibrate` pulse on check-in and on badge unlock where the browser supports it (Android Chrome and installed PWA; iOS ignores it).
