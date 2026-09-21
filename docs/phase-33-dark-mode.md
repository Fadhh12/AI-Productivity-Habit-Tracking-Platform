# Phase 33 — Dark mode

- Theme-aware colours in `tailwind.config.js` now read CSS variables (`--c-*`, RGB triplets so opacity utilities like `bg-surface-card/80` still work). Light values live in `:root`, dark values under `.dark` in `globals.css`.
- `ThemeToggle` in the top bar. First visit follows the system setting; the choice is stored in `localStorage` (`continuum-theme`). An inline script in `app/layout.tsx` applies the class before first paint, so there is no light flash.
- `.force-light` restores the light palette inside a dark page. The landing page is dark-locked, and its phone mock uses `.force-light` to keep the real app look.
- Shadows switch to neutral black in dark mode; brand lime, the dark sidebar and dark hero cards are unchanged.
- Checked with a headless browser: dashboard in dark at 1280px, landing, and login.
