# Phase 16 — AI Weekly Challenge + Notification Center

Two changes: a weekly challenge proposed by the AI coach, and a redesigned
notification tab that works well on phones (the app is heading to Android
Studio / Play Store as a wrapped PWA, so every new surface is mobile-first).

## Weekly challenge (`src/modules/challenge`)

One challenge per user per local week (Monday–Sunday, in the user's timezone).
It is created lazily the first time the user opens the app that week.

| Metric | Counts | Allowed target |
| --- | --- | --- |
| `checkins` | habit check-ins with status `done` | 3–30 |
| `activities` | logged activities | 3–20 |
| `active_days` | local days with an activity or a done check-in | 3–7 |

Design rules:

- **AI proposes, code decides.** The prompt gets last week's numbers as
  labelled facts and returns `{title, description, metric, target}`.
  `sanitizeDraft` rejects anything invalid, including a target outside the
  metric's bounds (a moved target would contradict the description text).
  A `checkins` goal is also rejected for users with no active habit.
- **Deterministic fallback** (`fallbackChallenge`) when the AI is off, the
  circuit is open, or the answer is rejected: about +20% over last week, at
  least 3 check-ins per active habit, or a gentle "3 active days" for new users.
- **Progress is never stored.** It is recomputed from real data on each read,
  so it cannot drift and offline check-ins that sync later are counted.
- **Non-punitive.** A missed week is shown as "Belum tercapai" in the history,
  with no penalty; the prompt forbids guilt.
- **Completion** is idempotent (`updateMany ... where completed_at is null`),
  so exactly one `challenge_complete` notification (and push) is sent, either
  when the user opens the app or from the hourly sweep (`challenge.scheduler.ts`).
- Concurrent first requests are safe: the `(user_id, week_start)` unique index
  keeps one row and the loser reads it.

Endpoints (JWT): `GET /api/challenges/current`, `GET /api/challenges/history`
(last 8 finished weeks). New table `weekly_challenges`, migration
`20260920170000_add_weekly_challenges`.

UI: `ChallengeCard` on the Today page (refreshes when a check-in or activity
is added) and on the Achievements page together with the history list.

## Notification center (`frontend/components/NotificationBell.tsx`)

- **Mobile:** opens as a full-width sheet under the header with a dimmed
  backdrop; **desktop:** a dropdown anchored to the bell. Uses `100dvh`-based
  max height and `overscroll-contain` so the list scrolls without moving the page.
- Unread count badge on the bell (9+), 44px tap target; closes on outside tap or Esc.
- Filter tabs **Semua / Belum dibaca**; items grouped **Hari ini / Kemarin / Sebelumnya**.
- Each item has a type icon, a readable label, relative time ("5 mnt lalu"),
  an unread dot and the AI badge; tapping marks it read and opens the related
  page (`lib/notifications.ts` maps type → label/icon/tone/route).
- **Tandai semua dibaca** via new `PATCH /api/notifications/read-all`.
- Push payload for `challenge_complete` added to `push-payload.util.ts`.

## Verification

- 16 unit tests for the challenge rules (week start, timezone midnight,
  clamping, sanitising, fallbacks); backend build and frontend typecheck/build pass.
- End-to-end against the real DB and Gemini with throwaway users (deleted
  afterwards): AI challenge generated; a 3-activity user reached the target,
  status became `completed`, one notification was created; `read-all` flipped
  every notification to read.
- Found during testing: the AI proposed "1 check-in" but the code clamped the
  target to 3, and it chose a check-in goal for a user with no habits. Both
  are now rejected in favour of the fallback.
- The UI is built mobile-first but was not run on a physical device or emulator here.

## Not included yet

XP/badge rewards for completing challenges, user-chosen difficulty, and
challenge reminders mid-week.
