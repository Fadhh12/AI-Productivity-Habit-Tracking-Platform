# Phase 3 — Rollup Engine

Aggregates `activity_logs` + `habit_checkins` into a per-user monthly summary,
cached in Redis so reads never recompute on the fly.

## How it works

- **Daily/monthly aggregation job** (`RollupProcessor`, BullMQ queue `rollup`):
  reads activities + checkins for the target month, computes category time
  distribution, checkin status counts, per-habit streak trend, and per-goal
  progress (via the pure, unit-tested `RollupCalculator`), then writes the
  result to Redis (`rollup:monthly:{userId}:{YYYY-MM}`, no TTL — the cache
  entry *is* the report until the next successful run replaces it).
- **Scheduler** (`RollupScheduler`): every 15 minutes, checks each user's
  local clock; once a user has just passed local midnight, enqueues a rollup
  job for the month containing "yesterday" — this is the harian→bulanan
  aggregation described in the spec, timezone-aware per user.
- **Manual trigger:** `POST /api/reports/refresh` enqueues the same job
  on-demand.
- **Read path:** `GET /api/reports/monthly?month=YYYY-MM` reads straight from
  the Redis cache. If nothing has been computed yet, it returns
  `{ available: false, message: "..." }` instead of computing on the spot or
  returning stale data silently.

## Retry + failure handling

Jobs are enqueued with `attempts: 4` (1 initial try + 3 retries) and
exponential backoff (2s, 4s, 8s). `RollupProcessor.onFailed` logs a
structured JSON error after every failed attempt; once attempts are
exhausted, it additionally:

1. Logs a structured `error` line: `timestamp`, `userId`, `errorType`,
   `stack`, `jobId`, `month`.
2. Creates an in-app notification (`type: "rollup_failed"`) via
   `NotificationService`, retrievable through `GET /api/notifications`.

### Verified manually (see terminal output for the full run)

```bash
curl -X POST /api/reports/refresh -H "Authorization: Bearer $TOKEN" \
  -d '{"month":"2026-09","simulateFailure":true}'
```

Result: 4 structured failure logs at `10:51:13`, `:15` (+2s), `:19` (+4s),
`:27` (+8s), confirming exponential backoff, followed by an "exhausted all
retry attempts" log and a `rollup_failed` row in `GET /api/notifications`:

```json
[{
  "type": "rollup_failed",
  "message": "Laporan bulan 2026-09 belum terupdate, coba lagi.",
  "read": false
}]
```

The normal (non-simulated) path was verified separately: cache-miss returns
`{"available": false, ...}`, `POST /refresh` queues the job, and after it
completes `GET /api/reports/monthly` returns the aggregated data — including
`categoryDistributionMinutes`, `checkinStatusCounts`, `habitStreakTrend`, and
`goalProgress` — read straight from cache.

## Endpoints

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/reports/monthly?month=YYYY-MM` | Cached read only, never recomputes |
| POST | `/api/reports/refresh` | `{ month?: "YYYY-MM", simulateFailure?: boolean }` — enqueues a rollup job |
| GET | `/api/notifications` | In-app notifications (e.g. rollup failures) |
| PATCH | `/api/notifications/:id/read` | Mark a notification read |

## Unit tests

`rollup-calculator.util.spec.ts` covers the pure aggregation logic: category
minute totals (including null→"Uncategorized" bucketing), checkin status
counts, and goal progress computation — all without touching Prisma or Redis.
