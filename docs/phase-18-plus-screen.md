# Phase 18 — Continuum Plus screen and upgrade prompts

Frontend for the plan foundation in [phase 17](./phase-17-plans-and-premium.md).

- `lib/plan.tsx` — `PlanProvider` (mounted in the app shell) loads `GET /api/plan`;
  `usePlan()` exposes `plan`, `isPlus` and `refresh()`. If the request fails
  (offline) the last known plan is kept; the server enforces limits regardless.
- `lib/premium.ts` — `upgradeReason(err)` recognises the API's
  `PREMIUM_REQUIRED` (403) and free-plan `LIMIT_REACHED` (429) errors.
- `components/UpgradeNotice.tsx` — friendly card with a "Lihat Continuum Plus"
  button, shown instead of a raw error. Used for the monthly AI digest and AI
  pattern cards and PDF export on Reports, and when the free Coach limit is hit.
  CSV export and everything else stay untouched.
- `/plus` page — current plan and expiry, today's AI usage meters, and a
  Free vs Plus comparison table that fits a phone (compact 3-column grid).
  The subscribe button is intentionally **disabled** with a note that
  subscriptions arrive through Google Play; nothing pretends to charge.
- Entry points: a "Continuum Plus" card at the bottom of the desktop sidebar
  and a banner at the top of Settings (reachable on mobile).

## Verification

Typecheck and production build pass (`/plus` is generated). The API side was
verified end to end in phase 17. Not yet run on a device or emulator.

## Next

Account page and profile photo, shareable streak card, then Play Billing.
