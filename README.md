# Continuum — AI Productivity & Habit Tracking Platform

Continuum: activity logging, habit streaks with a forgiveness rule, goal
decomposition, automated rollups, and a Claude-powered AI layer — built as a
modular monolith (NestJS + PostgreSQL + Redis + BullMQ), with a mobile-first
PWA frontend (Next.js) so it can be installed on a phone's home screen.

This README covers the **backend API**. For the frontend, see
[frontend/README.md](./frontend/README.md).

Full product spec: [Continuum-Dokumentasi-Proyek.md](./Continuum-Dokumentasi-Proyek.md).

## Stack

- **Backend:** Node.js + NestJS (TypeScript)
- **Database:** PostgreSQL via Prisma ORM
- **Cache:** Redis
- **Job queue:** BullMQ (rollup jobs, retried with exponential backoff)
- **Auth:** JWT access + refresh tokens (rotated on use), passwords hashed with argon2
- **AI:** Claude API (Anthropic), isolated behind a circuit breaker

## Project layout

```
src/
├── modules/        # auth, category, activity, habit, goal, rollup, ai, notification, user, health
├── shared/         # middleware, validators, utils, filters, guards, idempotency
├── infra/          # db (Prisma), cache (Redis), queue (BullMQ)
└── config/         # environment configuration + validation
prisma/
├── schema.prisma   # database schema
└── migrations/     # applied migrations
docs/               # per-phase endpoint reference + verification notes
frontend/           # Next.js PWA client (separate app, own package.json — see frontend/README.md)
```

## Installation

### Prerequisites

- Node.js 20+
- Docker (for Postgres + Redis) — or point `DATABASE_URL`/`REDIS_URL` at your own instances

### Setup

```bash
cp .env.example .env
# fill in CLAUDE_API_KEY and change the JWT secrets — see "Manual steps" below

npm install
docker compose up -d          # starts Postgres + Redis
npx prisma migrate deploy     # applies all migrations
npm run start:dev
```

The API listens on `http://localhost:3000` by default. `GET /health` confirms
the DB, Redis, and AI circuit breaker are all reachable.

### Try it

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password1","timezone":"Asia/Jakarta"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password1"}'
```

## Environment variables

See [.env.example](./.env.example) for the full list with defaults.

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `DATABASE_URL` | PostgreSQL connection string (Prisma) |
| `REDIS_URL` | Redis connection string (cache + BullMQ job queue) |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRES_IN` | Access token signing secret + lifetime (default `15m`) |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Refresh token signing secret + lifetime (default `7d`) |
| `CLAUDE_API_KEY` | Anthropic API key — AI endpoints degrade to a structured fallback without it |
| `CLAUDE_MODEL` | Claude model id (default `claude-sonnet-5`) |
| `AI_TIMEOUT_MS` | Per-request Claude timeout (default `8000`) |
| `AI_DAILY_RATE_LIMIT` | Max AI requests per user per day (default `50`) |
| `AI_CIRCUIT_BREAKER_THRESHOLD` / `AI_CIRCUIT_BREAKER_COOLDOWN_MS` | Consecutive failures before the circuit opens, and how long it stays open (defaults `5` / `60000`) |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` | Global per-IP rate limit window/count (default 120 req/min) |

### Manual steps (must fill in yourself)

1. **`CLAUDE_API_KEY`** — get one from the Anthropic console. Without it, `/api/ai/*` endpoints work but always return `{"ai_available": false, "fallback": true}`.
2. **`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`** — replace the placeholder values with real random secrets before deploying anywhere non-local.
3. If not using `docker compose`, point `DATABASE_URL` / `REDIS_URL` at your own Postgres/Redis instances.

## Testing

```bash
npm test          # unit tests (business logic: streak engine, overlap detection, rollup math, circuit breaker)
npm run lint      # ESLint
npm run build     # TypeScript build (nest build)
```

CI (GitHub Actions, [.github/workflows/ci.yml](./.github/workflows/ci.yml))
runs `prisma generate` + lint + unit tests on every push.

Endpoint-level behavior (overlap warnings, streak/forgiveness rule, goal
soft-unlink, rollup retry, AI fallback/circuit-breaker/rate-limit, health
degradation, idempotency) was verified manually against a live server; see
`docs/phase-2-core-modules.md` through `docs/phase-5-testing-report.md` for
the full request/response transcripts.

## Deploying

Any Node-hosting platform with a managed Postgres + Redis add-on works
(Railway and Render are a low-cost fit for an MVP, per the project's tech
stack notes):

1. Provision a PostgreSQL and a Redis instance; set `DATABASE_URL` /
   `REDIS_URL` to their connection strings.
2. Set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `CLAUDE_API_KEY` as real
   secrets (never commit them — `.env` is gitignored).
3. Build and run:
   ```bash
   npm ci
   npx prisma migrate deploy   # never `migrate dev` in production
   npm run build
   npm run start:prod
   ```
4. Point your platform's health check at `GET /health` (returns `200` when
   healthy, `503` when the DB or Redis is unreachable).
5. The BullMQ rollup worker and the habit-midnight/rollup schedulers run
   in-process (`RollupProcessor`, `HabitMidnightScheduler`,
   `RollupScheduler`) — no separate worker deployment is required for this
   MVP scale; split them into a standalone worker process if load grows.

## Documentation index

| Phase | Doc |
| --- | --- |
| 1 — Foundation (auth, schema, CI) | this README |
| 2 — Category, Activity, Habit, Goal | [docs/phase-2-core-modules.md](./docs/phase-2-core-modules.md) |
| 3 — Rollup engine | [docs/phase-3-rollup-engine.md](./docs/phase-3-rollup-engine.md) |
| 4 — AI orchestrator | [docs/phase-4-ai-orchestrator.md](./docs/phase-4-ai-orchestrator.md) |
| 5 — Health, idempotency, edge cases | [docs/phase-5-testing-report.md](./docs/phase-5-testing-report.md) |
| 6 — PWA frontend (mobile access) | [frontend/README.md](./frontend/README.md) |
| 8 — Monthly report export (CSV/PDF) | [docs/phase-8-report-export.md](./docs/phase-8-report-export.md) |
| 9 — Google Calendar import | [docs/phase-9-google-calendar.md](./docs/phase-9-google-calendar.md) |
| 10 — Gamification (badges, XP, levels) | [docs/phase-10-gamification.md](./docs/phase-10-gamification.md) |

## Status

- [x] Foundation: project structure, auth (register/login/refresh/logout), DB schema & migrations, middleware, CI
- [x] Core modules: category, activity log, habit + streak engine, goal + decomposition
- [x] Rollup engine (scheduled aggregation jobs + manual refresh, retry + in-app notification on failure)
- [x] AI orchestrator (quick-add NLP, digest, goal suggestions, circuit breaker, rate limiting)
- [x] Hardening: `/health`, idempotent writes, edge-case verification, structured logging, final docs
- [x] PWA frontend (Next.js, installable on a phone's home screen) — see [frontend/README.md](./frontend/README.md)
