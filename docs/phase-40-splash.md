# Phase 40 — Splash intro

`components/Splash.tsx`, mounted in the app shell after login: the first open of each browser session shows a purple full-screen intro (Conti hops in, "Continuum" and the tagline fade up) for about 1.7s, then fades out. Tap to skip. It is skipped under reduced motion and does not replay within the same session (`sessionStorage`). On an installed PWA this reads as the app's launch screen.
