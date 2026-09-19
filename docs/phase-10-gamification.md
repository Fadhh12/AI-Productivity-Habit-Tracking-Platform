# Phase 10 — Gamification (Badges, XP, Levels)

Light, non-competitive progression to make users want to come back. It
follows the anti-burnout ethos: no leaderboards, no losses — missed days
never subtract XP or lock badges.

## Backend (`src/modules/gamification`)

`GET /api/gamification/summary` (JWT) returns
`{ stats, level, xp, xpIntoLevel, xpForNextLevel, badges[] }`.

- **Nothing new is stored.** Everything is derived on read from existing
  tables (`habit_checkins`, `activity_logs`, `daily_reflections`, `goals`,
  `habits`), so it can never drift out of sync and needs no migration.
- **XP**: +10 per done checkin, +5 per activity, +15 per answered
  reflection, +100 per completed goal.
- **Level**: level *n* starts at `100 × (n-1)²` XP (fast early levels,
  slower later).
- **Badges** (12): first checkin, 25/100 checkins, 7/30-day streak, 10/100
  activities, first/14 reflections, habit linked to a goal, first forgiven
  rest day ("Istirahat Bijak" — rewards using the tolerance rule), first
  completed goal. Each returns `progress`, `target`, `unlocked`.
- Pure logic lives in `gamification-calculator.util.ts` (4 unit tests).

## Frontend

- New page `/achievements` ("Pencapaian", sidebar + bottom nav): level card
  with XP bar, and a badge collection showing locked badges with progress.
- `BadgeUnlockToast` (mounted in the app shell) re-checks on each page
  change and shows a toast for newly unlocked badges. Seen badges are kept
  in `localStorage`; the first run only records existing badges so current
  users aren't flooded.
- The older client-only streak milestone chips on habit cards are unchanged.

## Verification

Backend build, all unit tests, and frontend `tsc --noEmit` pass. Not yet
exercised in a running browser session — open `/achievements` after
logging in and check a few checkins move the XP bar.

## Ideas for later

Weekly AI-generated challenge, growing "plant" visual tied to consistency,
seasonal/optional badges.
