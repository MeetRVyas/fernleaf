# Conventions

Every session follows these. Where a rule needs a decision, `decisions.md` has it.

## 1. Language and tooling

- TypeScript `strict: true` in every package. No `any` (lint-enforced). Use `unknown` and narrow. A `@ts-expect-error` needs a comment saying why.
- Prefer types inferred from zod (`z.infer`) and Prisma. Hand-written types are for domain concepts only.
- The owner is new to TypeScript and must explain every line. Prefer plain, readable code over clever types. Comment non-obvious patterns. Keep `docs/typescript-notes.md` current when you introduce a pattern a beginner would not recognise.
- Vitest for tests (api and web). ESLint and `tsc --noEmit` must pass cleanly in every package. Prettier for formatting.
- **Toolchain pins (exact versions in `package.json`; never install `latest` or `next` tags).** Verified together: pnpm 10.34.6, Node 22 LTS, `typescript` 5.9.3, `prisma`, `@prisma/client` and `@prisma/adapter-pg` 7.10.0, `pg` 8.23.1. Rules behind them:
  - pnpm: pin the 10.x line in the `packageManager` field (corepack then uses the same version everywhere). Newer majors exist (12.x) but these docs were verified against 10. pnpm blocks dependency build scripts by default; allow only what is needed (`esbuild`, `prisma`, `@prisma/engines`, and similar) through `pnpm.onlyBuiltDependencies`. Prefer packages without install scripts: use `@node-rs/argon2` for password hashing.
  - TypeScript 5.9.x (6.0.x is acceptable). Not 7.x: it ships no compiler JS API, so typescript-eslint (peer range below 6.1) and ts-jest break.
  - Prisma 7.x only. Not 8: it is a release candidate, and `prisma@latest` installs a CLI with no `generate` or `migrate dev`. Always `pnpm exec prisma`, never unpinned `npx prisma`.
  - NestJS 11, Next.js, Mantine, ESLint, Vitest: the latest stable majors at the time Session A or W pins them, as exact versions.
- Scripts (seed, tools) run through `tsx`. Do not rely on Node's built-in TypeScript stripping.
- Every constructor parameter in Nest classes needs `@Inject(Token)`, because tsx and Vitest do not emit decorator metadata.
- Shared exports TypeScript source, and the Docker API image runs through `tsx`.

## 2. Naming and files

- Files: kebab-case (`order-line.repository.ts`). Classes: PascalCase. Functions and variables: camelCase. Constants: UPPER_SNAKE_CASE.
- Backend module layout:

```
modules/orders/
  orders.controller.ts      orders.service.ts      orders.repository.ts
  domain/                   (pure functions, one file per rule, with .test.ts beside it)
  ports.ts                  events.ts
  orders.module.ts          index.ts   (public API only)
```

- Prisma models PascalCase singular. Tables snake_case plural (`@@map`). Columns snake_case (`@map`).
- Contract ids: `module.action` (`orders.place`). Routes are REST: plural nouns, actions as sub-paths for commands (`POST /orders/:id/place`).

## 3. API conventions

- Prefix `/api`. JSON only.
- Errors always use `{ code, message, details?: { [field]: string }, requestId }`.
  - 400 malformed request, 401 unauthenticated, 403 forbidden
  - 404 not found
  - 409 concurrency or state conflict (`CONFLICT` for a stale `version`, `INVALID_TRANSITION` for a repeated step)
  - 422 validation (`VALIDATION_ERROR`, with `details`) or a business-rule violation (a specific code such as `CUTOFF_PASSED`, `ORDER_INVOICED`, `NO_PRICE_ON_TIER`, `COMBO_QTY_MISMATCH`, `REQUIRED_GROUP_MISSING`, `DOMAIN_TAKEN`, `PUBLIC_DOMAIN_NOT_ALLOWED`, `CUTOFF_NOT_REACHED`)
  - New codes go in `packages/shared` and are documented in the route's `errors`.
- Lists: `?page=1&pageSize=25&sort=field:asc` and filters as named query params. Response `{ items, total, page, pageSize }`. Default page size 25, max 100. Sort fields are whitelisted per route.
- Money is integer cents. Dates are `YYYY-MM-DD` strings. Instants are ISO-8601 UTC. Times of day are `HH:mm`.
- Never return password hashes, session ids or internal stack traces.

## 4. Money and time

- All money math is integer. Use the shared helpers (`roundUpTo5Cents`, `ceilDiv`, `formatMoney`).
- All kitchen-time math goes through shared Luxon-based helpers and the `Clock` port. Domain functions take `now` as a parameter. Do not call `Date.now()` or `new Date()` inside domain code or services except through `Clock`.
- Do not construct dates from `"YYYY-MM-DD"` with `new Date()`.
- UI shows kitchen times in the kitchen zone (from settings), never in the browser's zone.

## 5. Database and Prisma

- Prisma 7 (the GA line) with the `pg` driver adapter. If ESM tooling blocks you for over 30 minutes, pin Prisma 6 instead and record why in `docs/decisions.md` section 9. Never Prisma 8 (release candidate).
- Integration tests create their own uniquely named database from `DATABASE_URL`: migrations are applied once to a template database (the migration SQL files in order), cloned per worker, and dropped afterwards. Parallel worktrees and workers never clash. `prisma generate` runs before tests.
- Migrations: `prisma migrate dev --create-only`, then edit the SQL for anything Prisma cannot express (partial unique indexes, CHECK constraints). Never edit a migration that has been merged. Add a new one.
- CI proves that `schema.prisma` and the migration SQL agree (`prisma migrate diff` with an exit code; check `--help` for the pinned version) and that `prisma migrate deploy` works on an empty database.
- Run migrations on the direct connection URL. The runtime pool is small (max 5) and has an error handler on idle clients.
- Only repositories (and `core/`) use the Prisma client. Services pass `tx`.
- Locks: `SELECT ... FOR UPDATE` through a repository method. Advisory locks are transaction-level only (`pg_advisory_xact_lock`).
- A schema change after Phase 0 goes through `docs/schema-requests.md`. One owner applies it, locally or with Codex using real Prisma Migrate. Do not edit `schema.prisma` in a feature session.

## 6. Authorization

- Permissions come from the contract (`permission: PERM.x.y`). The global guard denies by default. A route without a permission fails at boot.
- Never check `user.role === 'ADMIN'` outside `packages/shared/permissions`. Ask `can(user, permission)`.
- Row scope (for example, a driver's own drops) is applied in the repository query using the current user, not in the controller.
- The UI hides what `can()` disallows, but the server is the authority.

## 7. Testing

| Level | What | Rules |
|---|---|---|
| Domain unit tests | Pure functions (cut-off, pricing, combos, state machine, totals) | No mocks. Use the test vectors in `decisions.md`. Cover edge cases |
| Integration tests | Service plus real PostgreSQL | No DB mocks. Fixed `Clock`. Truncate between suites |
| Contract conformance | Real responses parsed with `contract.response` | One check per implemented route |
| Permission matrix | Every contract by every role, generated | Asserts 401 and 403 and allowed paths |
| Concurrency | Two parallel calls on the same unit, order or invoice | Exactly one succeeds, the other gets 409 |
| Web | Smoke tests for login and role redirect; component tests for forms with rules | Not for styling |

A bug fix starts with a failing test.

## 8. Logging and errors

- pino JSON to stdout, with `requestId` on every line. Redact passwords, cookies and tokens.
- Throw typed domain errors (with a code). One exception filter turns them into the error shape above. Do not catch an error just to rethrow it.
- Sentry is initialised only when a DSN is set.
- `/api/health` has no database access. `/api/health/ready` checks the database.

## 9. Frontend rules

- Mantine for UI. No Tailwind. A little plain CSS (CSS modules) is fine for bespoke layouts such as the boards.
- All data through the typed client and TanStack Query. No `fetch` in components. No server actions with logic.
- Forms: `@mantine/form` with the shared zod schema. Show server `details` on the right fields. Show a toast for errors that have no field.
- Every list has loading, empty and error states. Every route is permission-gated through the nav registry.
- The driver screens are mobile-first.

## 10. Git and pull requests

- Each agent works in its own git worktree with its own `.env` and its own database name.
- One branch per session: `s<N>/<topic>`. Small commits (Conventional Commits: `feat(orders): ...`). Rebase on `main` often.
- A PR is one module slice and passes CI. PR description: what, why, how to try it, what was left out.
- Do not edit another session's module folder, the Prisma schema, or shared contracts outside a contract PR (small, merged first).

## 11. How to add things

- **A module:** run `pnpm gen:module <name>`, then fill in `docs/modules/<name>.md` from the template.
- **A permission:** add it to `packages/shared/src/permissions/<module>.ts`, map it in `roles.ts`, and use it in a contract. The matrix test picks it up.
- **A role:** add one entry in `roles.ts`. No other file should change.
- **An endpoint:** add the descriptor to the module's contract file, bind it with `@Route`, implement service and repository, add tests.
- **A setting:** add it to the shared settings registry (key, zod type, default), then use `SettingsPort`.

## 12. Definition of done (per module)

1. Contract implemented and in OpenAPI. Responses conform.
2. Domain rules have unit tests with the vectors from the spec.
3. Integration tests cover invariants and concurrency. Permission matrix is green.
4. Web screens work against the real API with loading, empty and error states.
5. Lint, typecheck and tests pass. No boundary violations.
6. `docs/modules/<name>.md` has a "How it works" section and a demo script (steps a reviewer can click through).
7. Anything skipped is listed under "Out of scope" with a reason.

## 13. When blocked

Pick the simplest assumption consistent with `decisions.md`, write it under decisions section 9 (Proposed decisions), and continue. Do not stop to ask unless the choice would break a Tier 1 rule from the brief.
