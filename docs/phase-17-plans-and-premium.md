# Phase 17 — Free vs Continuum Plus (plan foundation)

Prepares the app for a Play Store subscription. Core tracking stays free; the
features that cost money to run or serve power users are gated behind
**Continuum Plus**. No payment is wired in yet — that comes with the Android
wrapper (Google Play Billing is mandatory for in-app digital subscriptions).

## What is free vs Plus

| Area | Free | Plus |
| --- | --- | --- |
| Habits, streaks, check-ins, goals, activity log, reminders, gamification | Yes | Yes |
| Offline mode, push, manual Google Calendar sync, CSV export | Yes | Yes |
| Coach AI chat | 5 messages/day | up to `AI_DAILY_RATE_LIMIT` (default 50)/day |
| Other AI (quick-add, reflection, weekly digest, goal suggestion) | 10 requests/day | up to `AI_DAILY_RATE_LIMIT`/day |
| Monthly AI digest | — | Yes |
| AI pattern detection | — | Yes |
| Proactive insights | weekly summary only | weekly summary + comeback + pattern |
| Weekly challenge | template challenge | AI-personalised challenge |
| PDF report export | — | Yes |
| Automatic hourly Google Calendar sync | — | Yes |

The anti-burnout habit cap (5, override with `force`) is deliberately **not**
gated: it is health guidance, not a paywall.

## Backend (`src/modules/plan`)

- `users.premium_until` (migration `20260920190000_add_premium_until`).
  Plus is active while it is in the future; expiry needs no cron job.
- `plan.util.ts` — pure rules (`resolvePlan`, `dailyLimit`, `extendPremium`), unit-tested.
- `PlanService.requirePlus(userId, feature)` throws
  `403 { code: "PREMIUM_REQUIRED", feature }`; `PlanModule` is global so any
  module can call it.
- `AiRateLimiterService` moved here and is plan-aware with two daily buckets
  (`coach`, `ai`); over budget returns `429 { code: "LIMIT_REACHED", plan }`.
- The global exception filter now forwards `code`, `feature` and `plan` so the
  client can show an upgrade prompt instead of a raw error.
- `GET /api/plan` returns plan, expiry, limits, today's usage and the Plus feature list.
- Until billing exists, grant/revoke by hand:
  `npm run plan:set -- someone@example.com 30` (add 30 days) or `... 0` (revoke).
  Renewing early extends the remaining time.

## Verification

- 81/81 unit tests pass; build passes.
- End-to-end with throwaway users (deleted afterwards): free user got 403 on
  PDF export, monthly digest and pattern detection, CSV export was allowed, and
  the 6th coach message returned 429 `LIMIT_REACHED`. After `plan:set ... 30`
  the same calls were allowed and the limit became 50.

## Next

Paywall / Plus screen in the app, then Play Billing + server-side purchase
verification with the Android wrapper.
