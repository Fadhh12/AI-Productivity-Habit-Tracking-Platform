# Phase 11 — AI Coach Chat

A conversational coach that answers free-form questions about the user's own
progress ("Kenapa streak baca-ku turun?", "Kasih 1 langkah kecil buat besok"),
instead of one-way digests.

## Backend (`src/modules/ai`)

`POST /api/ai/coach` (JWT)

```json
{ "message": "Gimana progresku?", "history": [{ "role": "user", "content": "halo" }, { "role": "assistant", "content": "hai" }] }
```

Response: `{ reply, ai_available, fallback, is_ai_generated }` — same envelope
as the other AI endpoints, so the frontend labels it "✨ AI" or "Ringkasan dasar".

- **Stateless**: no new tables. The client keeps the conversation and resends
  it as `history` (validated: max 20 turns of ≤2000 chars, roles limited to
  `user`/`assistant`; unknown roles return 400).
- **Grounding**: each call builds a fresh snapshot of the user's data
  (`CoachService.buildSnapshot`): active habits + streaks, last-7-day category
  minutes and checkin counts, goal progress, and the 15 most recent
  activities, plus local date/timezone.
- **Prompt** (`coach-context.util.ts`): warm, non-judgmental Indonesian, max
  ~120 words, 1–2 small suggestions, on-topic only, never invent numbers.
  The snapshot is passed as DATA; the prompt tells the model to ignore any
  instructions found inside it (guards against prompt injection via
  activity titles).
- **History hygiene** (`buildCoachMessages`): caps turns, drops invalid or
  empty turns, ensures the list starts with a user turn, merges consecutive
  same-role turns, and always ends with the new message.
- **Resilience**: shares the existing daily rate limit (50/day), circuit
  breaker and 8s timeout. When the AI is unavailable, it returns a
  deterministic summary of the week (`buildCoachFallbackReply`) with
  `fallback: true` instead of an error.
- `ClaudeClient.generateText` added for free-form multi-turn replies
  (max 600 tokens).

## Frontend

- New page `/coach` ("Coach AI") with suggestion chips, chat bubbles, AI /
  fallback badge per reply, a typing indicator, and a disclaimer.
- Nav gained a "Coach" entry; the mobile bottom bar is now horizontally
  scrollable because it has more tabs than fit at phone width.
- Conversation lives in component state (cleared on reload) by design.

## Verification

- Backend + frontend typecheck, backend build, and 12 AI unit tests pass
  (8 new: history sanitising, prompt content, fallback reply).
- Live: the endpoint returns the structured fallback when no key is set, and
  400 for an invalid history role.
- **Not verified with a real Claude reply**: requires `CLAUDE_API_KEY` in
  `.env` (see README "Manual steps"). Set it, restart the API, and ask the
  coach a question to confirm the AI path.

## Ideas for later

Persisting conversations, streaming replies, and letting the coach take
actions (e.g. "tambahkan habit ini") after user confirmation.
