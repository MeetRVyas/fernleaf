# Fernleaf Kitchen admin platform

This monorepo contains the NestJS API in `apps/api`, an empty `apps/web` slot for Session W, and contracts plus helpers in `packages/shared`. The default kitchen time zone is `America/New_York`; all money is stored as integer USD cents.

## Quick start

Use Node 22 and corepack. Run `corepack pnpm install`, then `pnpm typecheck` to generate the Prisma client and check types; this works before creating `.env`. Copy `.env.example` to `.env` and give this worktree its own database name. Use one server per machine, one database per worktree. Start the shared PostgreSQL server once with `pnpm db:up`, then use `pnpm db:create` in each worktree. Next run `pnpm db:migrate`, `pnpm db:seed`, and `pnpm dev`. `pnpm test:db` also generates the client first, but requires a real `DATABASE_URL` and running PostgreSQL. The API listens on `http://localhost:3001/api`; `/api/health` has no database dependency and `/api/health/ready` checks PostgreSQL.

The seeded staff accounts are `admin@test.com`, `kitchen@test.com`, `dispatch@test.com`, and `driver@test.com`, each with password `Test@1234`. Change these before using any nonlocal environment.

## Environment

| Name | Required | Example | Purpose | Secret |
|---|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://fernleaf:fernleaf@127.0.0.1:55432/fernleaf_a?schema=public` | Direct PostgreSQL connection for runtime and migrations | Yes |
| `DIRECT_URL` | No | same as `DATABASE_URL` | Direct migration connection when runtime uses a pooled URL | Yes |
| `COMPOSE_DB_PORT` | No | `55432` | Shared Compose PostgreSQL host port | No |
| `COMPOSE_DB_NAME` | No | `fernleaf_a` | Initial database created by Compose | No |
| `ALLOW_REMOTE_TEST_DB` | No | `1` | Explicitly permit integration tests to create databases on a non-local server | No |
| `VALIDATE_RESPONSES` | No | `true` | Validate API responses against contracts during tests | No |
| `PORT` | No | `3001` | API listen port | No |
| `COOKIE_SECURE` | No | `false` | Enable secure session cookies behind HTTPS | No |
| `TRUST_PROXY` | No | `true` | Honor reverse proxy headers | No |
| `KITCHEN_TIMEZONE` | No | `America/New_York` | Kitchen local date and time zone | No |
| `SENTRY_DSN` | No | empty | Enable Sentry when configured | Yes |

The shared package exports TypeScript source. The Docker API image runs through `tsx` so it can load those exports.

## Scope

This platform session provides auth, staff admin, shared contracts, database plumbing, and scaffolding. Domain modules and the web app belong to later sessions. Portions and sizes, CSV employee import, invoice adjustments and credit notes, multi-select option groups, an admin-managed packaging list, and client-brief section 5 are skipped under `docs/decisions.md` section 1.
