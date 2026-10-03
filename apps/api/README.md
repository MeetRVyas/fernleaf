# API development

From the repo root, run `pnpm dev` for watch mode, `pnpm db:migrate` for Prisma Migrate, `pnpm db:seed` for idempotent staff seed data, and `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db` before a database milestone commit. Run `pnpm db:drift` to compare migration SQL with the schema. Use `pnpm --filter @fernleaf/api exec prisma generate` after schema changes. Use `pnpm --filter @fernleaf/api exec prisma migrate deploy` to apply committed migrations. The process handles SIGTERM through Nest shutdown hooks.

## Add a module

Run `pnpm gen:module <name>`, then complete the contract in `packages/shared/src/contracts`, add a permission file and map it in `roles.ts`, bind each handler with `@Route(contract)`, and fill the generated module spec. Other modules import only the new module's `index.ts`. Start schema changes with `docs/schema-requests.md` after Phase 0. The module owner writes domain tests and database integration tests.

## Troubleshooting

Prisma 7 uses ESM and the generated client in `src/generated/prisma`. Import that client rather than `@prisma/client` in core or repositories; run tools through `pnpm exec` or the workspace scripts. Prisma CLI loads the root `.env` from `prisma.config.ts`. A connection failure during `migrate dev` usually means the Compose service is stopped; start Docker Desktop, then run `pnpm db:up`. With Neon, a sleeping database may need a first connection attempt to wake it; use a direct URL for migrations, then retry after the database reports ready.
