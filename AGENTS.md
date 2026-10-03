# Agent instructions

Project: Fernleaf Kitchen admin panel (Next.js, NestJS, Prisma, PostgreSQL). pnpm monorepo.

## Read first

Before doing anything, read `docs/architecture.md`, `docs/conventions.md` and `docs/decisions.md`.
The client brief (`docs/client-brief.md`) is reference only. If it conflicts with `decisions.md` on a
business rule, the brief wins. On engineering choices, `decisions.md` and `conventions.md` win.

## Hard rules

- Stay inside your session's folders. Do not edit other modules, `schema.prisma`, or shared contracts
  outside a small contract PR.
- Contract first: `packages/shared/src/contracts` is the source of truth for routes.
- Money is integer cents. Kitchen time goes through `Clock` and the shared helpers. No `any`.
- Check permissions with `can()`; never check role names.
- Small commits (Conventional Commits). Lint, typecheck and tests must pass before each commit.
- If blocked, pick the simplest assumption, record it in `docs/decisions.md` section 9, and continue.
- Never claim a check passed without running it.

## Environment (local)

- One git worktree per session, on its own branch `s<N>/<topic>`, with its own `.env` and its own
  database name in `DATABASE_URL`.
- Use the pinned versions in `docs/conventions.md` section 1. Never install `latest` or `next` tags.
  Use `pnpm exec`, not `npx`.
- Create migrations with real Prisma Migrate (`prisma migrate dev --create-only`), then edit the SQL
  for partial unique indexes and CHECK constraints. Never edit a migration that has been merged.
- Work in milestones. After each: `pnpm lint && pnpm typecheck && pnpm test` (and `pnpm test:db` when
  the database is involved), fix failures, then commit.
- Tests create their own uniquely named database, so parallel worktrees do not clash.

## Commands

- `pnpm install`: install pinned workspace dependencies.
- `pnpm db:up` / `pnpm db:down`: start or stop the local PostgreSQL Compose service.
- `pnpm db:migrate`: create/apply local Prisma migrations using `DATABASE_URL`.
- `pnpm db:seed`: idempotently seed four staff accounts.
- `pnpm dev`: run the API in watch mode.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:db`: required checks.
- `pnpm gen:module <name>`: create the API layer files and module spec stub.

## Done means

See `docs/conventions.md` section 12.
