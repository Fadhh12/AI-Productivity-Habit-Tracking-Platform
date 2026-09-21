# Phase 22 — UI polish, step 2: app shell

- Route change replays a fade-up on the page content (`(app)/layout.tsx`, keyed by pathname).
- Content is capped at 1600px so ultra-wide screens stay readable; loading screen is a floating logo.
- Sidebar: staggered nav entry, press feedback, filled icon and lime glow on the active item, `aria-current`.
- BottomNav: frosted bar, active tab gets a lime pill behind a filled icon, hidden scrollbar, safe-area padding kept.
- TopHeader search: focus ring + soft shadow; results dropdown scales in from the top.
- Uses `100dvh` instead of `100vh` for mobile browser toolbars.
