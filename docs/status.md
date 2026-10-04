# Session F status

Updated 2026-10-04. Branch `s6/finish`; isolated database `fernleaf_finish` on the existing PostgreSQL server at `127.0.0.1:55432`.

## M0 audit

OpenAPI at `/api/docs` advertises 96 operations. A controller search for `NOT_IMPLEMENTED` confirms that 85 are 501 shells. The other 11 are three core routes, three authentication routes, and five staff routes. The docs describe planned behavior, not implemented behavior. There are no feature API integration tests beyond auth and database constraints.

| Module | Backend | Web | Tests | Known defects / empty behavior |
| --- | --- | --- | --- | --- |
| Core | Health, readiness, OpenAPI real (3) | Login, shell, error pages | Route and helper unit tests | None found in audit |
| Auth and staff | Login/logout/me (3), staff list/create/role/deactivate/reset (5) real | Login and Staff management real | Auth database tests, login redirect unit test | No remaining known integration defect |
| Settings | 5 routes return 501 | None | Settings value schema tests only | No settings or holidays UI |
| Reference | 9 routes return 501 | None | None | No allergens, tags, stations UI |
| Catalogue | 11 routes return 501 | None | None | No dishes, options, groups UI |
| Pricing | 6 routes return 501 | None | Money helper tests only | No tier editor or missing-price view |
| Companies | 9 routes return 501 | None | Database constraint tests only | No companies, addresses, holidays UI |
| Employees | 4 routes return 501 | None | None | No employee administration UI |
| Menu | 8 routes return 501 | None | None | No menu editor or employee preview |
| Orders | 9 routes return 501 | None | Contract shape tests only | No order form, list, detail, cut-off flow |
| Kitchen | 4 routes return 501 | Placeholder role page | None | No prep units or board |
| Dispatch and driver | 10 routes return 501 | Placeholder role pages | None | No drops, assignment, delivery flow |
| Billing | 6 routes return 501 | None | None | No invoices UI or business service |
| Dashboards | 4 routes return 501 | Four placeholder role pages | None | Each page says dashboard is coming |
| Demo | Module absent | None | None | No realistic data; only four staff accounts seeded |

At M0, the Next.js route files were `/`, `/login`, `/403`, `/admin`, `/kitchen`, `/dispatch`, and `/driver` plus error/loading/not-found states. Login redirects each role to its respective role page. At M0, `featureNavigation` registered Home only. M1 added the admin-only `/staff` route to the nav. The four role pages remain placeholders and make no feature API calls.

### Running walkthrough

Created `.env` from `.env.example`, with `fernleaf_finish`, then ran `pnpm db:create` and applied the three existing migrations. Initial `pnpm db:seed` failed because the generated Prisma client was absent; after `pnpm typecheck` generated it, `pnpm db:seed` succeeded. Starting the web app without `API_INTERNAL_URL` failed; setting it to `http://127.0.0.1:3001` started the app. With the API and web running, each of the four specified accounts returned HTTP 200 from login and `/api/auth/me`, its landing URL returned HTTP 200, and its dashboard API returned HTTP 501. The role workflows stop at the placeholder landing pages. There are no orders, drops, or invoices to click through.

## Ordered work list

1. M1: Repair setup scripts and web environment, then expose existing staff management and any implemented features through navigation. Add a failing test before each existing-code defect fix.
2. M2: Implement idempotent, kitchen-date-aware demo data, the reset action, CLI, boot/daily refresh, and reconciliation tests.
3. M3: Implement the stubbed reference, catalogue, pricing, companies, employees, menu, orders, settings, kitchen, dispatch, billing routes and their usable screens. Complete contracts, authorization and concurrency tests.
4. M4: Define dashboard formulas in `docs/dashboards.md`, then implement four role dashboards and tests against demo data.
5. M5: Run the full permission matrix, domain vectors, 400-order kitchen benchmark, pagination checks, and four-role HTTP smoke script.
6. M6: Verify setup from a fresh clone, write the required README and deployment steps, update AGENTS.md, remove obsolete shells/TODOs, run all required gates, and commit.

## Milestone ledger

| Milestone | State | Evidence | Commit |
| --- | --- | --- | --- |
| M0 audit | Complete | Lint passed; typecheck passed; unit tests 24/24; database tests 511/511; drift: no difference. Runtime role audit above. | `docs(audit): record initial route and role inventory` |
| M1 integration | Complete | Two setup regression tests failed before fixes and passed afterward. Seed now generates Prisma and was run successfully; local web rewrite has a default and documented env var; Staff UI and permission-gated nav added. Lint and typecheck passed; unit tests 26/26; database tests 511/511; drift: no difference; web build passed with `/staff`. | `feat(staff): expose management and repair local setup` |
