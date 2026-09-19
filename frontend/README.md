# Continuum Web (PWA)

Mobile-first Next.js frontend for the Continuum backend — installable as a
PWA so it can be used from a phone's home screen like a native app.

## Screens

- **Login / Register** — minimal, email + password only.
- **Hari ini (Today)** — quick-add bar (natural language → AI draft →
  confirm), today's activity log, and a habit checklist with one-tap
  check-in. Missed/forgiven habit days are shown in neutral gray text, never
  red or struck through (non-punitive by design, per the product spec).
- **Goals** — create yearly/monthly goals, view a goal's breakdown (child
  monthly goals + linked habits), ask AI to suggest a breakdown, delete a
  goal (habits are soft-unlinked, never deleted).
- **Laporan (Reports)** — AI digest card (falls back to a plain "not
  available yet" message if AI/rollup data isn't ready — the raw numbers
  below it still render independently) plus category time distribution,
  checkin counts, and streak trends from the cached monthly rollup.
- **Setelan (Settings)** — change timezone (adjusts the day boundary/
  reminders going forward), log out.

## Running locally

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Opens on `http://localhost:3001` (the backend already owns `3000`, so this
project runs the frontend on `3001` by default — see `package.json`). Set
`NEXT_PUBLIC_API_URL` in `.env.local` to wherever the backend actually is.

### Opening it from your phone (the actual point of this PWA)

1. Make sure your phone and computer are on the same Wi-Fi network.
2. Find your computer's LAN IP (`ipconfig` on Windows, look for `IPv4
   Address`).
3. Set `NEXT_PUBLIC_API_URL=http://<your-lan-ip>:<backend-port>` in
   `frontend/.env.local`, and make sure the backend's CORS (already open via
   `app.enableCors()`) and firewall allow the connection.
4. `npm run dev` already binds to `0.0.0.0` (see `package.json`), so it's
   reachable at `http://<your-lan-ip>:<frontend-port>` from your phone's
   browser.
5. Open that URL on your phone, then use the browser's "Add to Home Screen"
   (Android Chrome) or "Add to Home Screen" from the Share sheet (iOS
   Safari) to install it as a standalone app.

## PWA notes

- `public/manifest.json` + `public/sw.js` provide installability and basic
  app-shell caching (network-first for `/api/*`, so you never see stale data
  behind your back; cache-first for the static shell).
- The app icon (`public/icons/icon.svg`) is a placeholder — swap it for a
  real design before shipping publicly. Some iOS versions prefer a PNG
  `apple-touch-icon`; add one if home-screen icon rendering looks off on
  iPhone.
