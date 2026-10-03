# Session A platform setup: issues and fixes

This records the problems encountered while setting up the Fernleaf Kitchen platform on the `s0/platform` Windows worktree. It describes what failed, what we changed, and how we checked the result. The durable local choices are also in [decisions.md](decisions.md), section 9.

## Tooling and workspace

| Issue | Diagnosis and fix | Verification |
|---|---|---|
| Package registry access failed inside the sandbox | Node 22 and corepack were installed, but corepack could not resolve `registry.npmjs.org` from the sandbox. We retried the pinned pnpm install with network approval. We kept exact dependency versions and `pnpm@10.34.6` in `package.json`. | `corepack pnpm install` completed and produced `pnpm-lock.yaml`. |
| The first root typecheck had no input files | The root `tsconfig.json` initially included only `tools/**/*.ts`, before any tool files existed. We temporarily checked the packages directly, then added the scaffold tool and restored the root `tsc --noEmit` gate. | The final `pnpm typecheck` checked the root, shared package, and API. |
| Prisma's PostgreSQL types disagreed | `@prisma/adapter-pg` expected the newer `@types/pg`; our first API pin used an older one. We aligned `@types/pg` to `8.23.1`. | API typecheck passed without a cast or suppressed error. |

## Local PostgreSQL and Prisma

| Issue | Diagnosis and fix | Verification |
|---|---|---|
| Docker Desktop's Linux engine was initially unavailable | `docker compose ps` could not reach the Docker API. Once the engine was running, we used the project's defined `pnpm db:up` command. | The `db` service became healthy. |
| Port 5432 reached another PostgreSQL server | The first Compose container was healthy internally but had no usable host binding; a direct `pg` connection to `localhost:5432` failed authentication against a different server. We bound this worktree's container to host port `55432` and updated `.env.example` and the local `.env`. | Compose showed `0.0.0.0:55432->5432/tcp`, and `pg` connected to `fernleaf_a`. |
| Prisma Migrate could not connect through `localhost` | The `pg` driver could connect, but Prisma's schema engine returned `P1001` through `localhost:55432` on this host. We used `127.0.0.1` in the local `DATABASE_URL`. | `prisma migrate dev --create-only` created the initial migration; `pnpm db:migrate` applied it. |
| Prisma CLI did not find the root `.env` | Prisma runs from `apps/api`, while the worktree's `.env` is at the root. We made `prisma.config.ts` load that path using `fileURLToPath(new URL(..., import.meta.url))`. Environment variables supplied by CI or deployment still take precedence. | `prisma generate`, migration creation, migration application, and seed ran from the API workspace. |
| The migration drift check needed a shadow database | Prisma 7's `migrate diff --from-migrations` rejected the first CI command without `datasource.shadowDatabaseUrl`. We added `pnpm db:drift`, which creates a uniquely named temporary shadow database, runs `migrate diff --exit-code`, and drops it. | `pnpm db:drift` reported “No difference detected.” |
| A failed early test run left a template database | The first database test harness cleaned up only after successful setup. We added cleanup on migration setup failure and removed the one orphaned test template created during development. | Later `pnpm test:db` runs created and dropped their template and worker databases. |

The initial migration was made with real Prisma Migrate, then its SQL was edited to add the lowercase email `CHECK` constraint. It was applied before any commit; no merged migration was changed.

## API and tests

| Issue | Diagnosis and fix | Verification |
|---|---|---|
| Vitest collected dependency tests | The first broad test glob traversed `node_modules` and ran Zod's own tests. We restricted unit tests to workspace source and tools, and explicitly excluded `node_modules` and database tests. | `pnpm test` ran only the intended project tests. |
| Nest dependency injection failed under the fast transpiler | Typecheck passed, but API requests returned 500 because `tsx` and Vitest did not emit constructor metadata for Nest. We added explicit `@Inject(...)` tokens to injected constructors. | The API integration suite started Nest and exercised real HTTP requests. |
| Permission-matrix tests revoked their own sessions | The matrix exercised `auth.logout` before other routes, so later role requests became 401 instead of the expected 403 or allowed response. Each test now restores its role sessions before making its request. | The generated matrix and auth integration suite passed all 41 cases. |
| The database test runner initially invoked `corepack` as a child executable | On Windows, the child process could not find an executable named `corepack`. The harness now invokes pnpm through Node using `npm_execpath`, which is set by `pnpm test:db`. | The template received migrations once, worker databases were cloned, and the database suite passed. |

## Docker image

| Issue | Diagnosis and fix | Verification |
|---|---|---|
| Image builds have no project `.env` | `.dockerignore` correctly excludes the local secret file, but Prisma Client generation still needs a URL string while loading its config. The Dockerfile supplies a harmless build-only placeholder URL for `prisma generate`; runtime receives its real `DATABASE_URL` from the environment. | The image generated Prisma Client during `docker build`. |
| Prisma warned that the slim Node image lacked OpenSSL | We installed the image's OpenSSL package before dependency installation and Prisma generation. | The rebuilt image generated Prisma Client without that warning and compiled the API. |
| The first image exited on a decorator transform error | Launching `tsx` from the repository root did not apply the API's decorator settings. The final image launches `tsx` through the API workspace, where its `tsconfig.json` is selected. | A disposable container returned HTTP 200 from both `/api/health` and `/api/health/ready`. |
| An attempted Docker layer optimization broke the Prisma CLI link | Installing workspace dependencies before copying the full source left the Prisma executable link unusable in the image (`MODULE_NOT_FOUND`). We restored the proven copy-then-install order. | The final `docker build` passed, and the container smoke test passed. |

## Final checks and remaining limit

The final local run passed `pnpm lint`, `pnpm typecheck`, `pnpm test` (7 tests), `pnpm test:db` (41 tests), the API build, `pnpm db:drift`, and the Docker image smoke check. We verified that `.env` is ignored by Git. The GitHub Actions workflow was authored but was not run on GitHub during this session.
