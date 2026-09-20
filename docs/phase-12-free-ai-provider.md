# Phase 12 — Free / Pluggable AI Provider

Claude's API is pay-per-use. This phase makes the AI layer provider-agnostic
so the whole app (quick-add, digest, goal suggestion, reflection, pattern
detection, coach chat) can run on a free tier instead.

## What changed

- `ClaudeClient` → `LlmClient` (`src/modules/ai/llm.client.ts`). Same two
  methods (`generateJson`, `generateText`), so no AI feature code changed
  apart from the rename.
- `AI_PROVIDER` selects the backend:
  - `anthropic` (default): Claude via the Anthropic SDK, using
    `CLAUDE_API_KEY` / `CLAUDE_MODEL` exactly as before.
  - `openai`: any **OpenAI-compatible** `/chat/completions` endpoint, using
    `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`. Implemented with `fetch` and
    an `AbortSignal` timeout — no new dependency.
- `json-extract.util.ts`: free/smaller models often wrap JSON in fences or
  add prose around it, so JSON replies are parsed by stripping fences and
  falling back to the outermost `{...}`/`[...]` block (4 unit tests).
- Everything else is unchanged: rate limit, circuit breaker, 8s timeout, and
  the structured fallback when the provider fails or isn't configured.

## Using a free provider

Any OpenAI-compatible endpoint works. Examples (verify current model names
and free-tier limits on each provider's site — they change):

| Provider | `LLM_BASE_URL` | Key |
| --- | --- | --- |
| Google Gemini (AI Studio) | `https://generativelanguage.googleapis.com/v1beta/openai` | free key from aistudio.google.com |
| Groq | `https://api.groq.com/openai/v1` | free key from console.groq.com |
| Ollama (local, fully free) | `http://localhost:11434/v1` | any non-empty string |

`.env`:

```
AI_PROVIDER="openai"
LLM_BASE_URL="..."
LLM_API_KEY="..."
LLM_MODEL="..."
```

Restart the API, then use the Coach page: replies labelled "✨ AI" mean the
provider works; "Ringkasan dasar" means it fell back (check the key, base URL
and model name).

## Notes

- Free tiers have rate limits and slower/less capable models. If JSON-based
  features (quick-add, goal suggestion) fail more often, they simply fall
  back — nothing breaks. `AI_TIMEOUT_MS` can be raised for slow providers.
- Prompts and data sent to a free provider may be used by that provider for
  training, depending on its terms. Use Ollama if the user data must stay local.

## Verification

- Typecheck passes; 4 new unit tests for JSON extraction.
- Live against Google Gemini (AI Studio free key, model `gemini-flash-lite-latest`,
  ~1.5s per call): coach chat and quick-add both return real AI replies
  (`is_ai_generated: true`). The key's model list is available at
  `GET .../v1beta/openai/models` if a model name stops working.
- Two prompt fixes found during live testing: quick-add now receives the
  current UTC time and the user's timezone (before, the model guessed a
  2023 date and ignored the timezone; now "jam 2 siang" for an Asia/Jakarta
  user becomes 07:00Z on the right day), and the coach is told to answer in
  plain text because the chat UI does not render markdown.
