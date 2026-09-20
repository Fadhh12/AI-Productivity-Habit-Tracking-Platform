# Phase 13 — Proactive AI Insights

Until now every AI feature waited for the user to open a screen. This phase
lets the coach speak first: a scheduler decides, with cheap deterministic
rules, when something is worth saying, and only then asks the AI to phrase it.
Results arrive as in-app notifications (the bell in the header).

## The three insights (`src/modules/insight`)

| Kind | When (user's local time) | What it says |
| --- | --- | --- |
| `weekly_win` | Monday 08:00–21:59 | Last week's habit checkins and activities, compared with the week before |
| `comeback` | 10:00–20:59, after 3+ days with no activity or completed habit | A warm invitation to restart with one small step |
| `pattern` | Sunday 18:00–22:59 | The weekday with clearly the lowest completion rate, with one small suggestion |

Design rules:

- **Non-punitive.** Prompts forbid guilt or blame; comeback says pauses are
  normal. Nothing is sent to brand-new accounts with no history.
- **Conservative pattern rule** (`findWeakestWeekday`): needs 14+ checkins in
  the last 28 days, 3+ samples on the weak weekday, a rate of at most 50% and
  a gap of at least 25 points versus the overall rate — so it never nags on noise.
- **At most a few per week.** Each insight has a dedupe `refId`
  (`weekly:<date>`, `comeback:<last-activity-date>`, `pattern:<date>`), so the
  30-minute scheduler tick can never send the same one twice, and a single
  inactivity spell triggers only one comeback message.
- **AI only phrases; rules decide.** Facts are passed as labelled data (not
  instructions) and the reply is capped at 280 chars. If the AI is not
  configured, the circuit is open, or the call fails, a deterministic template
  is sent instead. The notification type records which one it was:
  `ai_insight_<kind>` vs `insight_<kind>`; the UI shows a "✨ AI" badge only
  for the former.
- **Does not use the user's chat quota.** These are system-initiated and
  bounded by the dedupe above; they still respect the shared circuit breaker.

## Opt-out

`users.proactive_insights` (boolean, default true) — new migration
`20260920141928_add_proactive_insights_setting`. `PATCH /api/users/me` accepts
`{ "proactiveInsights": false }`, and `GET /api/users/me` returns it. Opted-out
users are skipped entirely. Settings page has an "Insight AI Proaktif" toggle.

## Code map

- `insight-rules.util.ts` — pure logic: local time resolution, windows,
  weakest-weekday detection, fallback messages, prompt builder (13 unit tests).
- `insight.service.ts` — evaluates rules per user, dedupes, generates, notifies.
- `insight.scheduler.ts` — cron every 30 minutes.
- `insight.repository.ts` — the few queries needed (last activity, checkins).
- `NotificationService.alreadySentAny` — dedupe across the two type variants.
- `AiModule` now exports `LlmClient` so the insight module can reuse it.

## Verification

- 54/54 unit tests pass; backend and frontend typecheck and build pass.
- End-to-end with simulated clocks against the real DB and Gemini
  (throwaway users, cleaned up afterwards): a Sunday-evening tick produced the
  Wednesday pattern insight, a Monday-morning tick produced the weekly
  summary, and a 5-day-quiet user got the comeback message. Repeating the same
  tick produced no duplicates, and an opted-out user received nothing.
- Found and fixed during testing: raw fact keys (`done`, `activities`) made
  the model mislabel counts and mention the "Uncategorized" bucket, so facts
  now use explicit Indonesian labels and skip the uncategorized bucket.

## Not included yet

Push delivery when the app is closed (needs the offline PWA + Web Push
phase), per-insight-type toggles, and quiet-hours customisation.
