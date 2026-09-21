# Phase 42 — Mascot moods and event system

- `Mascot` now has 7 moods: `happy`, `cheer` (arms up, looping bounce), `sleepy`, `thinking` (thought bubble, eyes look up), `oops` (worried brows, sweat drop, shake), `shy` (hands cover the eyes), `love` (heart eyes, rising hearts).
- Pupils follow the pointer while `happy` (written straight to the DOM in a rAF, no React re-renders). `pulse` prop makes the mascot hop from outside.
- `lib/mascot.ts`: `emitMascot(event)` fires a window event from anywhere; `useMascotReaction()` returns the current reaction (mood, one-line message, pulse counter) or `null` at rest. `thinking` lasts until `idle`; other reactions fade after 2 to 4 seconds. Later phases hook the app's actions into it.
