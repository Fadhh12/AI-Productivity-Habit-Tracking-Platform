# Phase 14 — Offline PWA

The app can now be opened, browsed and used without a connection, and changes
made offline are saved on the device and sent automatically when the network
returns.

## What works offline

| | Behaviour |
| --- | --- |
| Screens already visited | Open instantly from cache, including full reloads and switching between screens |
| Data | The last-known data from the API is shown (network first, so it is never stale while online) |
| Habit check-in | Saved to a queue, shown as done immediately, sent on reconnect |
| Creating an activity (manual form, recurring) | Saved to the queue and sent on reconnect |
| A screen never opened before | A friendly "Kamu sedang offline" page (`public/offline.html`) |
| AI features, Google Calendar, exports | Need a connection; they fail with a normal error message |

A banner (`OfflineBanner`) shows the connection state, how many changes are
waiting, and a confirmation after they are sent.

## Service worker (`frontend/public/sw.js`, v2)

Four cache buckets, each with its own strategy:

- `continuum-static-v2` — hashed `/_next/static/*` files, icons, manifest, and
  Google Fonts (cache first / stale-while-revalidate).
- `continuum-shell-v2` — HTML pages (network first, cached copy on failure;
  redirected responses are never cached).
- `continuum-rsc-v2` — Next.js route payloads fetched on client-side
  navigation. These share URLs with the HTML pages, so they need a separate
  bucket; keeping them together made the offline page render raw payload text
  (found and fixed while testing).
- `continuum-api-v1` — API `GET` responses (network first with a 6 s timeout,
  cached copy on failure). Never cached: `/api/auth/*`, `/api/ai/*`,
  Google auth URLs, report exports.

The worker is registered **only in production builds**. In development the
layout unregisters any leftover worker and clears `continuum-*` caches so it
cannot interfere with hot reloading.

## Offline write queue (`lib/offlineQueue.ts`)

- `apiFetchQueued(path, options, kind)` behaves like `apiFetch`, but if the
  request fails because the network is unreachable it stores it
  (`localStorage`) and returns `{ queued: true }`. Server errors still throw.
- Only two kinds are queued: `checkin` and `activity`.
- Replay is in order, triggered by the browser's `online` event and on app
  start. Each request carries an `Idempotency-Key`, and check-ins are naturally
  unique per habit and day, so a replay can never create duplicates.
- A network error during replay stops the flush and keeps the rest; a server
  rejection (4xx) drops that item.
- **A check-in queued on one day and replayed on a later day is dropped**, not
  recorded, because the server would stamp it with the wrong date and disturb
  the streak. The banner says how many could not be sent. (Backdating check-ins
  would need a streak recalculation; left for later.)
- Pages that show the affected data reload after a flush (`useQueueFlushed`).

## Privacy

Cached API responses and queued writes belong to the signed-in user, so
`clearOfflineData()` wipes both on login, register and logout. Another person
signing in on the same browser never sees the previous account's data.

## Installability

`manifest.json` now has 192px and 512px PNG icons (rendered from the SVG),
`id`, `scope`, `lang`, a theme colour matching the app, and two home-screen
shortcuts (Habit Tracker, Coach AI).

## Verification

Tested in real Chrome (Playwright driving the installed Chrome) against a
production build (`next build` + `next start`) and the live API. The scenario:

1. Sign in, open Today and Habit Tracker while online (service worker takes control).
2. Go offline: full reload of Today renders from cache, with the banner.
3. Navigate to Habit Tracker offline, tap "Tandai selesai": shown as done,
   1 item in the queue, banner shows "1 perubahan tersimpan".
4. Open a never-visited screen offline: the offline page.
5. Go back online: queue empties automatically; the server shows the
   habit's streak is 1.
6. Log out: the API cache is deleted.

All steps passed. TypeScript typecheck and production build pass.

## Not included

Offline editing/deleting of existing items, backdated check-ins, background
sync while the app is closed, and push notifications (next phase).
