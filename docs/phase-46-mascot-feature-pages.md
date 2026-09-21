# Phase 46 — Mascot on the feature pages

- `components/ReactiveMascot.tsx`: an in-page Conti that mirrors the app's reactions (thinking, cheering, worried) with an optional speech bubble.
- Coach: Conti next to the title. It thinks with a "?" while the coach answers.
- Pencapaian: a cheering Conti beside the level bar. Habit Tracker: a sleepy Conti in the "Forgiveness Engine" card (rest is fine) that perks up on every check-in.
- The floating companion now stays away from pages that have their own Conti (dashboard, Coach, Pencapaian, Habit Tracker) so there is never a double mascot.
- Dev note: after adding new Tailwind classes to files that were not open before, the Turbopack dev cache can serve stale CSS; deleting `frontend/.next/dev` and restarting the dev server fixes it. Production builds are unaffected.
