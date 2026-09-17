# Phase 6 — PWA Frontend (Mobile Access)

A mobile-first Next.js frontend (`frontend/`) so Continuum can be installed
and used from a phone's home screen, on top of the backend built in Phases
1–5. See [frontend/README.md](../frontend/README.md) for setup, running
locally, and how to open it from a phone on the same Wi-Fi network.

## What was built

- **Login / Register** — minimal, matching the spec's "no long survey" principle.
- **Hari ini (Today)** — the core daily loop: quick-add bar (natural language
  → AI draft → confirm before saving, per the spec's non-negotiable rule),
  manual activity entry, habit creation, and one-tap habit check-in.
- **Goals** — create yearly/monthly goals, view breakdown (child goals +
  linked habits), ask AI for a breakdown suggestion, delete with soft-unlink.
- **Laporan (Reports)** — AI digest card (independent fallback if AI/data
  isn't ready) plus the cached monthly rollup numbers.
- **Setelan (Settings)** — change timezone, log out.
- **PWA:** `manifest.json` + a service worker (network-first for `/api/*` so
  data is never stale behind the user's back, cache-first for the app shell)
  make it installable on Android/iOS home screens.

## A build-time bug found and fixed along the way

Adding `frontend/` under the same repo root broke the **backend's** `nest
build`/`nest start` — its `tsconfig.json` had no `include` restricting
compilation to `src/`, so the TypeScript compiler started scanning
`frontend/*.tsx` too and failed on JSX syntax it wasn't configured for.
Fixed by adding `"include": ["src/**/*"]` and excluding `frontend` in the
backend's `tsconfig.json`. Backend build/tests re-verified green afterward.

## Real-browser verification (Playwright, mobile viewport)

Since no browser automation CLI was available in this environment, Chromium
was driven directly via a temporary Playwright script (not committed — a
one-off verification tool for this session) against a live backend
(`localhost:3000`) and frontend (`localhost:3001`) at an iPhone-sized
viewport (390×844). All 10 steps passed with **zero console errors**:

1. Register → redirects to `/today`
2. Empty state shows "Belum ada habit aktif..." (non-blank, actionable)
3. Create a habit via the new "+ Tambah habit" form
4. Check in the habit → streak becomes "🔥 1 hari beruntun", button becomes
   disabled "✓ Selesai" (non-punitive styling — green, not red/struck-through)
5. Add a manual activity → appears in the today list
6. Quick-add AI ("olahraga 30 menit tadi pagi") → since no real
   `CLAUDE_API_KEY` is configured, returns the fallback draft labeled
   **"Draft manual (AI belum tersedia)"** (honest, not mislabeled as AI) →
   confirmed → saved as a real activity log entry
7. Create a yearly goal → listed correctly
8. Goal detail → "AI: sarankan breakdown" → fallback template labeled
   **"Template umum (AI belum tersedia)"**
9. Reports page renders (digest fallback card + raw numbers) without crashing
10. Settings shows the logged-in user's email

**A gap found during this pass:** the original Goals page only created
*goals*, not *habits* — there was no UI path to create a habit at all. Fixed
by adding a "+ Tambah habit" form directly on the Today page (matching where
a user would naturally want to add one), including handling the backend's
soft-limit-of-5 `requiresConfirmation` response with a confirm dialog that
resubmits with `force: true`.

## Dependency hardening

`npm audit` on the initial `next@14.2.15` scaffold flagged 1 critical + 4
high vulnerabilities in the Next.js 14.x line (including an unauthenticated
RCE on Windows-hosted servers) that were never backported to 14.2.x — only
fixed in later majors. Upgraded to `next@16.3.5` (latest stable) instead of
leaving a known-vulnerable dependency in a "finished" project:

- Required `eslint@9` (Next 16's `eslint-config-next` needs it) and a
  migration from `.eslintrc.json` to flat-config `eslint.config.mjs`, since
  `next lint` was removed as a CLI subcommand in Next 16 — `lint` now runs
  plain `eslint .`.
- Turbopack's new stricter `react-hooks/set-state-in-effect` rule flagged
  the standard "fetch on mount" pattern used on every data page as an error;
  disabled that one rule with a comment explaining why (it's the idiomatic
  client-side data-loading pattern for a page without a server backend for
  RSC data fetching, not a bug).
- Re-ran the full 10-step Playwright verification after the upgrade — all
  10 steps still passed, zero console errors, zero build warnings.
- `npm audit` now reports **0 vulnerabilities**.
