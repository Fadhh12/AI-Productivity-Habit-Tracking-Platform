# Phase 19 — Account menu, profile photo and account page

The top-right user block in the header is now a real account menu, and there
is a proper account page with a profile photo.

## Backend

- `users.display_name` and `users.avatar` (migration `20260920210000_add_profile_fields`).
- `GET/PATCH /api/users/me` return and accept `displayName` (whitespace
  collapsed, max 40 chars, empty clears it) and `avatar`.
- The photo is stored as a small **data URL in the row** — no object storage
  needed yet. `profile.util.ts` only accepts `data:image/{jpeg,png,webp};base64,…`
  up to 70,000 characters, which rejects SVG (script risk), other MIME types
  and anything oversized. `avatar: null` removes the photo. 5 unit tests.

## Frontend

- `components/AccountMenu.tsx` — avatar button in the header opening a menu
  (Akun saya, Continuum Plus, Pengaturan, Keluar); closes on outside tap/Esc,
  44px rows. On phones only the avatar shows to save header space.
- `/account` — large avatar with a camera button, name, email, member-since,
  plan badge, stats (level, longest streak, total check-ins), display-name
  form, shortcuts (Plus, Pencapaian, Pengaturan) and sign out.
- `lib/image.ts` — picks a photo, center-crops to a square, scales to 256px
  and encodes JPEG, lowering quality until it fits the server cap, so phone
  camera photos work without uploading megabytes.
- `components/Avatar.tsx` — photo, or the name's initial as a fallback; also
  used in Settings.

## Verification

- 5 new unit tests; API checked with a throwaway user (name normalised, PNG
  accepted, SVG rejected with 400, `null` clears).
- Rendered in headless Chrome at 390×844 (Today with notification panel and
  account menu open, Account, Plus, Achievements): no horizontal overflow on
  any page, menus fit the screen. Not yet run on a real device/emulator.

## Next

Shareable streak / consistency card, then Play Billing.
