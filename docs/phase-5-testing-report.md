# Phase 5 — Testing, Observability & Hardening Report

## New in this phase

- `GET /health` — checks DB (Prisma), Redis, and the AI circuit breaker state.
- `POST /api/activities` now accepts an `Idempotency-Key` header for
  duplicate-safe retries (habit checkin was already naturally idempotent via
  the `(habitId, checkinDate)` unique constraint).
- `GET /api/users/me` / `PATCH /api/users/me` — lets a user read/change their
  timezone, which is what the timezone edge case below exercises.
- Global structured JSON error logging (`timestamp`, `userId`, `endpoint`,
  `errorType`, `stack`) was already in place since Phase 1
  (`HttpExceptionFilter` + `StructuredLogger`) — carried through unchanged.

## Edge case results

| # | Edge case | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Idempotent activity log write | **PASS** | Same `Idempotency-Key` sent twice returned the identical record both times; `SELECT count(*) FROM activity_logs WHERE title='Idempotency test'` = **1** |
| 2 | Idempotent habit checkin | **PASS** | Calling `POST /habits/:id/checkin` twice the same local day returns `"idempotent": true` on the second call with `currentStreak` unchanged (verified in Phase 2 and re-confirmed here) |
| 3 | Timezone change adjusts the day boundary | **PASS** | Checked in a habit under `Asia/Jakarta` (`checkinDate: 2026-09-17`), switched the user to `Pacific/Kiritimati` (UTC+14, already the next calendar day at that instant), checked in again immediately — new row landed on `checkinDate: 2026-09-18` and `currentStreak` advanced 1→2 (correctly treated as the very next day, not a skip) |
| 4 | Habit skipped repeatedly beyond tolerance | **PASS** | Deterministic proof via `streak-engine.service.spec.ts`'s multi-day sequence test: build streak to 3 → forgiven skip (streak holds at 3) → check-in (streak 4) → second skip in-window → streak resets to 0 → next check-in starts a fresh streak at 1. Every intermediate value asserted exactly. |
| 5 | Goal deleted while habits are linked | **PASS** | Created a yearly goal + linked habit, deleted the goal — habit immediately showed `goalId: null` (no error), and a subsequent checkin on that habit succeeded normally (streak incremented) |
| 6 | `/health` reports degraded state fast when Redis is down | **PASS (after a fix)** | Initially found that stopping Redis caused `/health` to hang indefinitely — ioredis queues commands during a disconnect instead of failing fast. Fixed by racing `ping()` against a 2s timeout in `RedisService.isHealthy()`. Re-tested: `/health` now returns `503 {"status":"degraded","checks":{"redis":"down",...}}` in ~2s, and back to `200 "ok"` once Redis is restored. |
| 7 | `/health` reports degraded state fast when the DB is down | **PASS** | Stopping Postgres made `/health` return `503 {"status":"degraded","checks":{"database":"down",...}}` in ~50ms (Prisma fails fast on connection refused) |

## Structured logging

Every uncaught exception across the API is logged as a single JSON line via
`StructuredLogger` (through the global `HttpExceptionFilter` installed in
Phase 1) with `timestamp`, `level`, `requestId`, `userId` (when
authenticated), `endpoint`, `errorType`, and `stack`. The rollup job
processor (Phase 3) uses the same logger for job-attempt and
exhausted-retry failures. No separate work was needed here — verified by
re-reading the existing filter and by the Phase 3/4 manual test transcripts,
which already show this exact log shape in practice.

## Test suite summary

```
Test Suites: 5 passed, 5 total
Tests:       22 passed, 22 total
```

Covers: date/timezone utilities, activity overlap detection, the full habit
streak/forgiveness engine (including the multi-day sequence above), rollup
aggregation math, and the AI circuit breaker state machine.
