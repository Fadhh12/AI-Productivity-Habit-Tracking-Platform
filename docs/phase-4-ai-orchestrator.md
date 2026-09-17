# Phase 4 — AI Orchestrator

A separate module (`src/modules/ai`) wrapping the Claude API, isolated from
the core CRUD modules by a circuit breaker so an AI outage can never block
core functionality.

## Endpoints

| Method | Endpoint | Body / Query | Notes |
| --- | --- | --- | --- |
| POST | `/api/ai/quick-add` | `{ "text": "..." }` | Returns a **draft** activity log; nothing is saved until the user confirms via the normal `POST /api/activities` |
| GET | `/api/ai/digest?period=weekly\|monthly` | — | Narrative summary of rollup data; genuine (non-fallback) results are persisted to `ai_insights` |
| POST | `/api/ai/goal-suggestion` | `{ "yearlyGoalTitle": "..." }` | Suggests a monthly-goal + habit breakdown |

Every response includes:

```json
{ "ai_available": boolean, "fallback": boolean, "is_ai_generated": boolean }
```

`is_ai_generated` is `true` only for genuine Claude output — fallback
responses set it to `false` so the frontend never mislabels a
locally-generated placeholder as AI content.

## Non-negotiable rules — implementation

- **8s timeout, non-blocking:** `ClaudeClient` passes `timeout: 8000` (from
  `AI_TIMEOUT_MS`) to the Anthropic SDK per-request; a timeout throws and is
  caught the same as any other failure.
- **Structured fallback on failure/timeout:** every `AiService` method
  wraps its Claude call in try/catch; on any error it returns a reasonable
  local fallback (naive text-to-draft parsing for quick-add, numbers pulled
  straight from rollup data for digest, a generic 3-month template for
  goal-suggestion) with `ai_available: false, fallback: true`.
- **Circuit breaker:** `CircuitBreakerService` (pure, unit-tested in
  `circuit-breaker.service.spec.ts`) opens after 5 consecutive failures
  (`AI_CIRCUIT_BREAKER_THRESHOLD`) for 60s (`AI_CIRCUIT_BREAKER_COOLDOWN_MS`).
  While open, calls skip the network entirely and return the fallback
  immediately.
- **Rate limit:** `AiRateLimiterService` uses a Redis `INCR` + `EXPIRE`
  counter keyed per user per UTC day (`AI_DAILY_RATE_LIMIT`, default 50).
  Exceeding it returns `429` with a clear message.

## Manually verified (no real Claude API key configured in this environment)

Since `CLAUDE_API_KEY` is left as the placeholder value locally, every call
naturally exercises the **failure path** — which is exactly what needed
verifying:

```
POST /api/ai/quick-add {"text":"olahraga 30 menit tadi pagi"}
-> {"title":"olahraga 30 menit tadi pagi","category_guess":null,
    "start_time":"...","end_time":"...",
    "ai_available":false,"fallback":true,"is_ai_generated":false}
   (377ms — real failed network attempt, then fallback)

GET /api/ai/digest?period=weekly
-> {"period":"weekly",
    "narrative":"Kategori tersibuk: Kuliah (240 menit). Habit selesai: 0, terlewat: 0.",
    "highlights":[...], "ai_available":false, "fallback":true, "is_ai_generated":false}

POST /api/ai/goal-suggestion {"yearlyGoalTitle":"Selesaikan 12 buku tahun ini"}
-> {"monthlyGoals":[...3 months...], "ai_available":false, "fallback":true, "is_ai_generated":false}
```

After 5 consecutive failures, the circuit opened — the next call returned in
**46ms instead of 377ms**, confirming it skipped the network call entirely:

```
POST /api/ai/quick-add {"text":"test after breaker open"}
-> (46ms) {"ai_available":false,"fallback":true,...}
```

Rate limiting was verified by setting the Redis counter to the limit (50)
directly and confirming the next request is rejected:

```
POST /api/ai/quick-add  (with ai:ratelimit:<user>:<date> = 50)
-> 429 {"message":"Daily AI request limit reached (50/day). Try again tomorrow."}
```

`ai_insights` remained empty throughout (`SELECT count(*) FROM ai_insights` =
0), confirming fallback digests are never persisted as if they were genuine
AI output — only a real Claude-generated digest is saved there.

**With a real `CLAUDE_API_KEY`**, the exact same code path calls Claude,
parses its structured JSON reply, calls `circuitBreaker.recordSuccess()`,
and returns `ai_available: true, fallback: false, is_ai_generated: true`
(and for digest, persists the result to `ai_insights`) — no code branches
differently between "would succeed" and "did succeed".

## Unit tests

`circuit-breaker.service.spec.ts` covers: staying closed under threshold,
opening at threshold, staying open through cooldown then resetting, a
success resetting the failure count, and remaining-cooldown reporting.
