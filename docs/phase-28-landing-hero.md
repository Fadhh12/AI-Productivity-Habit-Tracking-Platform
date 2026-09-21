# Phase 28 — Landing page, step 1: nav and hero

`/` is now a public landing page instead of an instant redirect. Signed-in users see a "Buka dashboard" button in the same spot as the signup buttons.

Design read: consumer habit app for young Indonesian adults, dark premium language matching the dashboard sidebar, one lime accent, Tailwind v3 with CSS and IntersectionObserver only (no new dependencies). The landing page is dark-locked on purpose.

- `components/landing/LandingNav.tsx`: floating glass pill; on mobile the hamburger morphs into an X and opens a full-screen menu with staggered links.
- `components/landing/Hero.tsx`: headline, one short sentence, one CTA pair (`Mulai gratis` / `Masuk`), following the hero rules (2-line-ish headline, subtext under 20 words).
- `components/landing/PhoneMock.tsx`: a phone frame that renders the **real** `HabitCard`. Visitors can tap the check button and see the same celebration as in the app.
- `components/landing/AuthCtas.tsx`: guest / signed-in CTAs. Same labels everywhere on the page.
- `components/landing/Reveal.tsx` + `.reveal` in `globals.css`: one-time scroll reveal, disabled under reduced motion and with no-JS fallback.
