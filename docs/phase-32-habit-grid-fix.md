# Phase 32 — Fix: habit cards overflowing on the dashboard

At around 1280px the three habit cards sat in fixed 3 columns, so names were cut ("Journ...") and the frequency label
"Beberapa kali/minggu" ran outside the card because it was `whitespace-nowrap`.

- Habit grid on Today now uses `repeat(auto-fit, minmax(min(100%, 230px), 1fr))`: as many columns as fit, one on a phone.
- The frequency label may wrap.
