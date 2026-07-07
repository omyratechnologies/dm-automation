# AGENTS.md — saas-dm-automations

## Quick reference

| Command | What |
|---|---|
| `npm run build` | `@repo/shared` → `@repo/api` → `@repo/web` (required in that order) |
| `npm test` | jest across all workspaces |
| `npm run typecheck` | `tsc --noEmit` across all workspaces |
| `npm run dev:api` | `nest start --watch` on :4000 |
| `npm run dev:web` | `next dev` on :3000 |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (CI/prod) |
| `npx jest` (from `apps/api`) | single-package tests |

`postinstall` runs `prisma generate` automatically — no separate generate step after install.

## Architecture

**npm workspace monorepo** at root `package.json`:
- `apps/api` — NestJS backend, port 4000. Root prefix `/v1`. Swagger at `/docs`. Pino structured logging.
- `apps/web` — Next.js 14 App Router, port 3000. Clerk auth. TanStack Query. socket.io-client.
- `packages/shared` — Zod schemas, job payloads, constants. Must be built first (`dist/index.js`).
- `packages/db` — Prisma schema + migrations only. Apps import `@prisma/client` directly.

**Queue pipeline** (BullMQ + Redis):
```
webhook-events → flow-runs → send-messages → broadcasts
                 token-refresh (daily cron 03:00 UTC)
                 webhook-event-cleanup (daily cron 04:00 UTC)
```
- `send-messages`: attempts=5, exponential backoff 30s, concurrency=5
- All other queues: attempts=3, exponential backoff 10s (set globally, can override per-queue)
- `UnrecoverableError` for terminal send rejections (plan limits, window expired, no prior inbound)
- `FlowExecutionError` for business-rule flow failures → run marked FAILED, no BullMQ retry

**IG Graph API** version: `v25.0` (in `INSTAGRAM_GRAPH_URL` default). Calls go through `IgGraphClient` (axios, 15s timeout). Token in `Authorization: Bearer` header, not query string.

## Testing

- jest config in `apps/api/package.json` — transforms with `ts-jest`, `isolatedModules: true`
- Rate limiter / metrics / cleanup services skip Redis in test mode (`NODE_ENV === "test"`)
- Mock `ioredis` / `axios` / `@clerk/backend` directly — no need for test containers
- Fixtures follow `makeFixture()` pattern creating plain mock objects cast with `as never`

## Env

Validated at startup by Zod schema in `apps/api/src/config/env.ts`. Required vars:
`DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, `TOKEN_MASTER_KEY` (32-byte base64).

**Important**: Next.js build requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in
`apps/web/.env.production` (or set in Prisma Compute env config). The root `.env`
is NOT read by Next.js builds.

## Key conventions

- **Multi-tenancy**: Organization → Workspace → IG Account, roles OWNER/ADMIN/AGENT
- **24h messaging window**: `MESSAGING_WINDOW_MS` — outside it, only HUMAN_AGENT-tagged sends
- **200 DMs/hr per IG account**: local rate limit via `RateLimiterService` (ioredis)
- **IG tokens**: envelope-encrypted with `TokenCrypto`, never stored in plaintext or exposed in URLs
- **Webhook dedup**: `@@unique([provider, eventKey])` on `WebhookEvent` — duplicate P2002 silently skipped
- **API rate limiting**: `@nestjs/throttler`, 60 req/min global; `@SkipThrottle()` on webhooks + health
- **WebhookEvent cleanup**: auto-deletes records older than 30 days (04:00 UTC daily)
- **Clerk JWT**: verified on socket.io `/inbox` connection; joins per-workspace rooms
- **Health check**: `GET /health` returns uptime + Redis metrics; `GET /health/ready` checks db + redis + IG API

## When working in this repo

1. `@repo/shared` must be built before `@repo/api` — `npm run build` handles this order automatically
2. Server actions in `apps/web/src/actions/` use structured `logger` from `@/lib/logger`, not `console.log`
3. Processors use `@Processor(queue, { concurrency: N })` — add concurrency when latency matters
4. Prisma migrations live in `packages/db/prisma/` — run from root with `npm run db:migrate`
5. Webhook endpoint is public + skip-throttled — Meta sends signed requests verified with `X-Hub-Signature-256`
6. `next build` requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — set in `.env.production` (not committed)
7. Phase 3 writes migrate through NestJS API via `serverApiFetch()` — reads stay cached on Prisma+Redis
8. `AuthedRequestUser.id` = Prisma User UUID, `AuthedRequestUser.clerkId` = Clerk user ID — use `userId` for ownership checks (matches `Automation.userId`, `Membership.userId`)

## Summary

### Goal
Complete full migration from direct Prisma frontend access to NestJS API-only architecture; deploy to Prisma Compute.

### Constraints & Preferences
- All data access goes through NestJS API (`serverApiFetch()`)
- Webhook processing handled by API controllers
- Keep legacy DB models alive through API endpoints (no schema drops yet)
- Use Prisma Compute for deployment with project `proj_cmr9fwryo09lrxef9pacmyfvo`, region ap-southeast-1
- Clerk app ID `app_3G8b8UtSqdSUU95v1kln7w8axB4`

### Status
- **API migration**: Phase A (UserModule), B1-B3 (automations/user/integrations actions), C1-C3 (webhook routes), D (prisma deletion) — all DONE
- **Prod readiness**: deploy.yml, PM2 config, TS errors, .env.example — all FIXED
- **Build**: API + web both compile with 0 errors
- **Tests**: All 108 pass
- **Clerk CLI**: installed, logged in (gantalaavinash@gmail.com), app `app_3G8b8UtSqdSUU95v1kln7w8axB4` linked
- **Prisma Compute**: Was deployed and set up for testing. Config files removed, back to local dev.
