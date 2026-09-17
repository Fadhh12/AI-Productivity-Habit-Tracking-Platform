# Continuum — AI Productivity & Habit Tracking Platform

Backend API for Continuum: activity logging, habit streaks with a forgiveness
rule, goal decomposition, automated rollups, and a Claude-powered AI layer —
built as a modular monolith (NestJS + PostgreSQL + Redis + BullMQ).

Full product spec: [Continuum-Dokumentasi-Proyek.md](./Continuum-Dokumentasi-Proyek.md).

## Stack

- **Backend:** Node.js + NestJS (TypeScript)
- **Database:** PostgreSQL via Prisma ORM
- **Cache:** Redis
- **Job queue:** BullMQ (rollup jobs, AI retries)
- **Auth:** JWT access + refresh tokens, passwords hashed with argon2
- **AI:** Claude API (Anthropic)

## Project layout

```
src/
├── modules/        # auth, activity, category, habit, goal, rollup, ai
├── shared/         # middleware, validators, utils, filters, guards
├── infra/          # db (Prisma), cache (Redis), queue (BullMQ)
└── config/         # environment configuration + validation
prisma/
└── schema.prisma   # database schema + migrations
```

## Running locally

### 1. Prerequisites

- Node.js 20+
- Docker (for Postgres + Redis), or point `DATABASE_URL`/`REDIS_URL` at your own instances

### 2. Setup

```bash
cp .env.example .env
# fill in CLAUDE_API_KEY and change the JWT secrets — see "Manual steps" below

npm install
docker compose up -d          # starts Postgres + Redis
npx prisma migrate dev        # applies migrations
npm run start:dev
```

The API listens on `http://localhost:3000` by default.

### 3. Try it

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password1","timezone":"Asia/Jakarta"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password1"}'
```

## Environment variables

See [.env.example](./.env.example) for the full list. Required:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Prisma) |
| `REDIS_URL` | Redis connection string (cache + job queue) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets — **must be changed manually** before any real use |
| `CLAUDE_API_KEY` | Anthropic API key for the AI module — **must be filled in manually**, AI endpoints degrade to fallback mode without it |

## Manual steps (must fill in yourself)

1. `CLAUDE_API_KEY` in `.env` — get one from the Anthropic console.
2. `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — replace the placeholder values with real random secrets before deploying anywhere non-local.
3. If not using `docker compose`, point `DATABASE_URL` / `REDIS_URL` at your own Postgres/Redis instances.

## Testing

```bash
npm test          # unit tests
npm run lint       # ESLint
```

CI (GitHub Actions, `.github/workflows/ci.yml`) runs lint + unit tests on every push.

## Status

This backend is being built incrementally, module by module:

- [x] Foundation: project structure, auth (register/login/refresh/logout), DB schema & migrations, middleware, CI
- [x] Core modules: category, activity log, habit + streak engine, goal + decomposition — see [docs/phase-2-core-modules.md](./docs/phase-2-core-modules.md)
- [x] Rollup engine (scheduled aggregation jobs + manual refresh) — see [docs/phase-3-rollup-engine.md](./docs/phase-3-rollup-engine.md)
- [ ] AI orchestrator (quick-add NLP, digest, goal suggestions, circuit breaker)
- [ ] Hardening: health check, idempotency, edge-case tests, final docs
