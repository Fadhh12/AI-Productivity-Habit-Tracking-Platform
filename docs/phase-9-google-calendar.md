# Phase 9 — Google Calendar Import

Connects a user's Google Calendar (read-only) and imports its events as
activity logs, on demand and automatically every hour.

## Manual setup (required to use it)

1. In Google Cloud Console, create an OAuth 2.0 Client ID (type: Web application).
2. Add the authorised redirect URI: `http://localhost:3000/api/calendar/google/callback`
   (use your deployed API URL in production).
3. Enable the **Google Calendar API** for the project.
4. Set in `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`,
   `FRONTEND_URL`, and optionally `GOOGLE_TOKEN_ENCRYPTION_KEY`
   (falls back to `JWT_ACCESS_SECRET`).

Without these, the feature degrades gracefully: `GET /api/calendar/google/status`
returns `available: false` and the Settings card shows "belum dikonfigurasi"
— same pattern as the AI layer without `CLAUDE_API_KEY`.

## Endpoints (`src/modules/calendar`)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/calendar/google/auth-url` | JWT | Returns Google consent URL (`{available, url}`) |
| GET | `/api/calendar/google/callback` | public | Google redirects here; exchanges `code`, stores tokens, redirects to `${FRONTEND_URL}/settings?calendar=connected\|error` |
| GET | `/api/calendar/google/status` | JWT | `{available, connected, lastSyncedAt}` |
| POST | `/api/calendar/google/sync?from=&to=` | JWT | Imports events; default window is yesterday → +7 days. Returns `{imported, total}` |
| DELETE | `/api/calendar/google` | JWT | Disconnects; already-imported activities are kept |

## Design notes

- **OAuth state**: the callback is hit by Google's redirect, so it carries no
  Continuum JWT. `getAuthUrl` signs a 10-minute JWT (`sub` = user id) into
  `state`; the callback verifies it to know which user is connecting and to
  block forged callbacks (CSRF).
- **Tokens encrypted at rest**: access/refresh tokens are stored AES-256-GCM
  encrypted (`src/shared/utils/secret-crypto.util.ts`, unit-tested). The
  access token is refreshed automatically by `googleapis`; refreshed tokens
  are persisted via the client's `tokens` event.
- **Read-only scope**: `calendar.readonly` only.
- **Idempotent import**: `activity_logs` gained `source` (`manual` |
  `google_calendar`) and `external_id`, with a unique `(user_id, external_id)`
  index. Re-syncing upserts by Google event id — no duplicates; edited events
  update in place. Cancelled events are skipped; all-day events become
  full-day entries; description is truncated to 500 chars. Imported
  activities start uncategorised.
- **Auto-sync**: `CalendarSyncScheduler` runs hourly for all connected
  users. Failures are logged per user and never block others.
- **Notification**: manual/scheduled syncs that import ≥1 event create an
  in-app notification (`calendar_sync`).
- **Migration**: `20260919232808_add_google_calendar_and_activity_source`
  (new `google_calendar_integrations` table + the two `activity_logs` columns).

## Frontend

Settings page → "Integrasi Google Calendar" card: connect, sync now,
disconnect, last-synced time, and a result banner after the OAuth redirect.

## Verification

- `npm run build`, `npm test` (26 tests incl. 4 new crypto tests), frontend
  `tsc --noEmit` all pass; migration applied to the dev DB.
- **Not verified end-to-end**: the real Google consent → callback → sync
  flow needs real OAuth credentials (see manual setup). Test it once
  credentials are in `.env`.
