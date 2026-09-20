# Phase 20 — Shareable streak card

Lets users show off their consistency, which is also free marketing: the card
carries the Continuum name and a "Coba Continuum" call to action. It is free
for everyone, not a Plus feature.

## How it works

- `frontend/lib/shareCard.ts` draws the card **in the browser** on a canvas
  (no server call, no third-party social API, works offline): brand, profile
  photo or initial, display name, a big streak number with a positive
  headline (`streakHeadline`, never guilt-based), level and total check-ins.
  Two sizes: **Post 4:5** (1080×1350) and **Story 9:16** (1080×1920).
- `frontend/components/ShareCard.tsx` shows a live preview and:
  - **Bagikan** — uses the Web Share API with the PNG file, which opens the
    phone's native share sheet (Instagram, WhatsApp, Telegram, …). No API keys
    or app registration are needed, and it works the same from the installed PWA.
  - **Unduh gambar** — saves the PNG; also the fallback on desktop browsers
    that cannot share files.
  - A plain WhatsApp text invitation link.
- Shown on the Account page and the Achievements page. Users with no
  check-ins yet see a hint instead of an empty card.
- The streak shown is the longest **current** habit streak (`stats.longestStreak`
  from `/api/gamification/summary`).

## Why not post directly through Instagram/WhatsApp APIs

Those APIs need business accounts, app review and per-user tokens, and the
native share sheet already gives the same result with one tap.

## Verification

Typecheck and production build pass. Rendered in headless Chrome at 390 px
wide with a user at a 12-day streak: card and buttons displayed correctly with
no horizontal overflow. The native share sheet itself can only be checked on a
real Android device.

## Next

Google Play Billing with server-side purchase verification, together with the
Android wrapper. A public invite/landing URL on the card once the app has one.
