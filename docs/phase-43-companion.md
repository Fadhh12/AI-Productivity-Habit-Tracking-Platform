# Phase 43 — Floating companion

- `components/Companion.tsx`, mounted in the app shell: a small Conti at the bottom-right of every page except the dashboard (which has the poster mascot). It shows the current mascot reaction with a speech bubble, greets each page once per session, gives a tip when tapped, and falls asleep after 3 minutes without input (wakes with "Oh, hai lagi!").
- `Settings` has a "Teman maskot Conti" switch (`lib/companion.ts`, stored in `localStorage`, default on).
- The badge toast moved to the bottom-left on phones so it never collides with the companion.
