# Phase 2 — Core Modules: Category, Activity, Habit, Goal

All endpoints below require `Authorization: Bearer <accessToken>` (from
`/api/auth/login` or `/api/auth/register`).

## Categories (`/api/categories`)

Max 20 active categories per user.

| Method | Endpoint | Body |
| --- | --- | --- |
| GET | `/api/categories` | — |
| GET | `/api/categories/:id` | — |
| POST | `/api/categories` | `{ "name": "Kuliah", "color"?: "#RRGGBB" }` |
| PATCH | `/api/categories/:id` | `{ "name"?, "color"?, "active"? }` |
| DELETE | `/api/categories/:id` | — |

```bash
curl -X POST /api/categories -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Kuliah"}'
# -> {"id":"...","name":"Kuliah","color":"#6B7280","active":true}
```

Exceeding 20 active categories returns `400` with a clear message instead of
silently failing.

## Activity Logs (`/api/activities`)

Validation: `title` 1–120 chars, `endTime` must be after `startTime` (blocking
validation error if violated). Overlapping time ranges **within the same
category** are allowed but return a non-blocking `warnings` array.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/activities?date=YYYY-MM-DD` | Filter by day; omit `date` for all |
| GET | `/api/activities/:id` | |
| POST | `/api/activities` | `{ title, categoryId?, startTime, endTime, note? }` |
| PATCH | `/api/activities/:id` | Partial update, same overlap check |
| DELETE | `/api/activities/:id` | |

```bash
curl -X POST /api/activities -H "Authorization: Bearer $TOKEN" -d '{
  "title": "Diskusi kelompok",
  "categoryId": "<categoryId>",
  "startTime": "2026-09-17T03:00:00.000Z",
  "endTime": "2026-09-17T05:00:00.000Z"
}'
# -> {
#   "data": { "id": "...", "title": "Diskusi kelompok", ... },
#   "warnings": ["This activity overlaps with another entry in the same category. It was still saved — please double-check your schedule."]
# }
```

## Habits (`/api/habits`)

Max 5 active habits per user — a soft limit. Exceeding it without `force`
returns `{ requiresConfirmation: true, message }` instead of an error;
resending with `"force": true` creates it anyway.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/habits` | |
| GET | `/api/habits/:id` | |
| POST | `/api/habits` | `{ name, frequency, goalId?, force? }` |
| PATCH | `/api/habits/:id` | |
| DELETE | `/api/habits/:id` | |
| POST | `/api/habits/:id/checkin` | `{ note? }` — marks today done |

**Streak engine (forgiveness rule):** any past day between the last recorded
checkin and today is auto-resolved before applying today's checkin (and also
periodically by a background job every 15 minutes, approximating "at local
midnight" per the user's timezone). Within a rolling 7-day window, the first
missed day is recorded as `skipped_forgiven` and the streak survives; a second
missed day in the same window resets the streak to 0 and starts a new one.

```bash
curl -X POST /api/habits/<id>/checkin -H "Authorization: Bearer $TOKEN" -d '{"note":"Selesai baca 20 menit"}'
# -> {
#   "data": { "id": "...", "currentStreak": 1, "skipCountWindow": 0, ... },
#   "checkin": { "checkinDate": "...", "status": "done", "note": "..." },
#   "idempotent": false
# }
```

Calling `checkin` again the same local day returns the same result with
`"idempotent": true` — no double increment.

## Goals (`/api/goals`)

`horizon` is `yearly` or `monthly`. A monthly goal's `parentGoalId` must point
to one of the user's own `yearly` goals (or be omitted). A yearly goal cannot
have a `parentGoalId`.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/api/goals` | |
| GET | `/api/goals/:id` | |
| GET | `/api/goals/:id/breakdown` | Goal + child (monthly) goals + linked habits |
| POST | `/api/goals` | `{ title, horizon, parentGoalId?, targetDate? }` |
| PATCH | `/api/goals/:id` | |
| DELETE | `/api/goals/:id` | Soft-unlinks habits/child goals (`goalId`/`parentGoalId` → `null`); never deletes them |

```bash
curl /api/goals/<yearlyId>/breakdown -H "Authorization: Bearer $TOKEN"
# -> {
#   "id": "...", "title": "Selesaikan 12 buku tahun ini", "horizon": "yearly",
#   "habits": [ ... habits linked directly to this goal ... ],
#   "childGoals": [ { "title": "Baca 1 buku bulan ini", "horizon": "monthly", "habits": [...] } ]
# }
```

Deleting the yearly goal above leaves the habit intact with `goalId: null` —
verified via the DB's `ON DELETE SET NULL` foreign keys, not application code,
so it holds even under concurrent writes.

## Unit tests

- `streak-engine.service.spec.ts` — forgiveness rule (first skip forgiven,
  second skip in-window resets, normal check-in increments).
- `activity-overlap.util.spec.ts` — overlap detection (overlapping,
  back-to-back, disjoint, containment).
