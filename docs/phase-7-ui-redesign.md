# Phase 7 — Desktop UI Redesign (Continuum Design System)

The frontend built in Phase 6 was mobile-first with a bottom tab bar and a
minimal off-the-shelf look. This phase re-skins it against a set of AI-Stitch
mockups (`stitch_productivity_app_ui_design/`) — a dark sidebar shell, an
"electric chartreuse on warm porcelain" design system, and three new pages —
while keeping every screen wired to the real backend API instead of the
mockups' static placeholder numbers.

## Design system source

`stitch_productivity_app_ui_design/continuum_system/DESIGN.md` documents the
full token set (colors, type scale, spacing, radii) and its "Anti-Burnout,
AI-Native" ethos: no red/strikethrough punitive states, a hard cap of 5
active habits, forgiving rest-day styling. The six page mockups under the
same folder (`code.html` + `screen.png` each) were the layout reference for
every page below.

Tokens were merged into `frontend/tailwind.config.js` (colors, `borderRadius`,
`spacing`, `fontFamily`/`fontSize`) and Plus Jakarta Sans + Material Symbols
were added as `<link>` tags in `frontend/app/layout.tsx`.

## Navigation shell

`BottomNav` (mobile tab bar) is replaced on desktop by:

- `components/Sidebar.tsx` — fixed dark rail, 6 routes, active-state pill.
- `components/TopHeader.tsx` — search field (decorative), a notification bell
  wired to `GET /api/notifications` (mark-as-read on click), and the signed-in
  user's email/join-date pulled from `useAuth()`.

`BottomNav` itself was restyled to the new palette and kept for `<lg`
viewports rather than deleted, matching the design system's own documented
mobile breakpoint (hidden sidebar, persistent bottom bar).

## Pages

| Nav item | Route | Status |
|---|---|---|
| Dashboard | `/today` | Redesigned |
| Habit Tracker | `/habit-tracker` | New |
| Goals & Horizon | `/goals`, `/goals/[id]` | Redesigned |
| Activity Logs | `/activity-logs` | New |
| AI Reports & Digest | `/reports` | Redesigned |
| Settings | `/settings` | Redesigned |

**Habit Tracker** needed one backend addition: `HabitCheckin` existed in the
schema but was never returned by any endpoint. `habit.repository.ts`'s
`findAll`/`findById` now `include` each habit's last 7 days of checkins, which
the page turns into a real (not fabricated) weekly consistency grid and a
per-habit completion-ring percentage.

**Activity Logs** adds a date-navigable timeline (reusing
`GET /api/activities?date=`), a client-computed category time-distribution
bar (no new endpoint needed), and inline delete.

## What was deliberately left out of the mockups

The mockups include several visuals with no backing data model — a fake
"Continuum Pro" upsell, star ratings, an "overlap detection guard" stat, a tag
cloud, and hand-authored progress percentages on goals. Rather than fabricate
numbers in the UI, these were either dropped or replaced with a real
equivalent (e.g. the Pro upsell card became a link into the real AI Digest
page; goal "progress" shows habit/child-goal counts from the real breakdown
endpoint instead of an invented percentage).

## Demo data

`prisma/seed.ts` (new) seeds a `demo@continuum.app` / `Demo12345!` account
with 5 categories, 5 habits (varied streak/skip patterns across the last 7
days), 3 yearly + 2 monthly goals, 20 activity log entries spread across the
week, and a few notifications — enough for every redesigned page to render
with real, non-empty data. Re-running `npm run seed` wipes and recreates that
one account (`user.email = demo@continuum.app`) via a cascading delete; it
never touches other users.

## Verification

- `npx tsc --noEmit` clean on both `frontend/` and the backend root.
- `npm run build` (Next.js) succeeds; all 7 routes listed in the route table.
- `eslint` clean on `frontend/{app,components}` and `src/modules/habit`.
- Live smoke test against a running backend (`localhost:3000`) + Postgres/Redis:
  registered a user, created/checked-in a habit, confirmed
  `GET /api/habits` now returns the `checkins` array end-to-end.
- Seeded `demo@continuum.app` and confirmed via the API that today's activity
  count, habit streaks, and goal titles match what the seed script intended
  (caught and fixed an off-by-one in the seed's own date indexing this way).
