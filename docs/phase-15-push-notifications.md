# Phase 15 — Web Push Notifications

Notifications now reach the user's phone or desktop even when the app is
closed. Every in-app notification (habit reminders, proactive AI insights,
calendar sync) is also delivered as a push to the devices the user enabled.

## Setup (manual)

1. Generate a VAPID key pair once: `npx web-push generate-vapid-keys`.
2. Put them in `.env`:
   ```
   VAPID_PUBLIC_KEY="..."
   VAPID_PRIVATE_KEY="..."
   VAPID_SUBJECT="mailto:you@example.com"
   ```
3. Restart the API. Without the keys, `GET /api/push/public-key` returns
   `available: false` and Settings shows "belum dikonfigurasi" — nothing breaks.

Use a **new pair for production** and keep the private key secret. Changing the
pair invalidates existing subscriptions (users simply re-enable push).

## Backend (`src/modules/push`)

| Endpoint | Purpose |
| --- | --- |
| `GET /api/push/public-key` | `{available, publicKey, devices}` |
| `POST /api/push/subscribe` | Register this device (`endpoint` must be `https`, plus `keys.p256dh` and `keys.auth`) |
| `DELETE /api/push/subscribe` | Remove this device |
| `POST /api/push/test` | Send a test push to the caller's own devices |

- New table `push_subscriptions` (one row per device; `endpoint` is unique, so
  re-subscribing refreshes the row and moves it to the current user).
  Migration `20260920151930_add_push_subscriptions`.
- `NotificationService.notify` now creates the in-app notification and then
  mirrors it as a push, fire-and-forget: a push failure can never break or
  delay the in-app notification.
- `buildPushPayload` maps notification types to a title and a destination
  (weekly summary and pattern → Reports, habit reminder → Habit Tracker, …).
  AI-phrased and template insights map identically.
- Delivery uses the `web-push` library (VAPID + encrypted payload). A push
  service answering 404/410 means the subscription is dead, so it is deleted
  automatically. Other failures are logged as structured errors.

## Frontend

- `sw.js` gains `push` and `notificationclick` handlers. A push is **not**
  shown while the app is visible (the bell already covers that), except the
  test push. Tapping a notification focuses an open tab or opens the target page.
- `lib/push.ts` handles support detection, permission, subscribe/unsubscribe.
- Settings → "Notifikasi Push": per-device switch, "Kirim tes" button, and
  clear states: browser unsupported, iPhone needs "Add to Home Screen" first,
  server not configured, permission blocked, off, on.
- **Logout unsubscribes the device** (with a 3 s cap so sign-out is never
  blocked), so the next person using that browser doesn't receive the
  previous account's notifications.
- Push works only on the **production build** (the service worker is
  disabled in `next dev`). Try it with `npm run build && npm start` in
  `frontend/`. On iOS it requires the app to be installed to the home screen.

## Verification

- 59/59 unit tests pass (5 new for payload mapping and expiry detection);
  typecheck and builds pass.
- API: unauthenticated → 401; non-https endpoint or missing keys → 400.
- **Server delivery, end to end, against a local fake push service** (TLS,
  two subscriptions for one user): the request carried a VAPID `Authorization`
  header, `Content-Encoding: aes128gcm`, a TTL and an encrypted body;
  the endpoint answering 410 was removed while the healthy one stayed; and
  calling `notify()` produced both the in-app notification and the push.
- **Not verified**: the browser-side subscription with a real push service
  (Google's FCM). Automated Chrome refuses to register with it
  (`Registration failed - permission denied`), so this last hop must be
  tried by hand: production build, open Settings, "Aktifkan di perangkat ini",
  then "Kirim tes".

## Not included

Per-notification-type push preferences, quiet hours, and grouping many
notifications into one.
