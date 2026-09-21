# Phase 37 — Dark mode: calmer lime and readable text on lime

- `accent-lime` and `accent-lime-dim` are now theme variables. Dark mode uses a muted lime (`158 190 48`) instead of full-strength `#CCFF00`, which glowed too hard on near-black surfaces. The sidebar's lime glow shadow is off in dark mode.
- Fix: `text-text-primary` turns light in dark mode, so labels on lime pills (for example the active "Dashboard" item) became white on lime. A rule in `globals.css` forces dark text on any lime surface (including hover states) in dark mode.
- The landing page and 404 are locked to the light palette (`.force-light`) so the brand lime stays at full strength there.
- Tailwind `darkMode: 'class'` enabled so `dark:` utilities follow the toggle.
