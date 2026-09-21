# Phase 44 — Mascot reacts to what you do

`useMascotWhile(busy, doneEvent)` and `useMascotError(error)` (in `lib/mascot.ts`) plus `emitMascot(...)` connect actions to the mascot:

- Check in a habit: happy hop and a cheer line; the check-in that completes the day makes it cheer (with the confetti).
- Catat AI, Coach, goal suggestions, report refresh: Conti thinks with a "?" bubble while the AI works, then answers or shows the saved face.
- Saved reflection / saved AI entry: heart eyes. New habit or goal: cheer. New badge: cheer.
- Any error banner: worried face with a sweat drop.
- The dashboard poster mascot shows the same reactions with a speech bubble; every other page shows them on the floating companion.
