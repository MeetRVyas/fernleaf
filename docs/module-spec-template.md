# Module spec: <module name>

Copy this file to `docs/modules/<module>.md` and fill every section. Keep rules numbered and testable. A session should be able to build the module from this file, `architecture.md`, `conventions.md`, `decisions.md` and `data-model.md` alone.

- **Session:** S<N>
- **Brief sections:** <for example §4.3, §4.4>
- **Decision ids:** <for example P1 to P7, Co1 to Co5>
- **Tier:** 1 or 2

## 1. Purpose

One or two sentences: who uses this module and what for.

## 2. Owned tables

List the tables this module reads and writes. It reads no other module's tables.

## 3. Contract

| Id | Method and path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `module.action` | `GET /things` | `things:read` | query: page, sort, filters | `Page<Thing>` | none |

Link to the contract file: `packages/shared/src/contracts/<module>.ts`.

## 4. Domain rules

Numbered, testable, one per line. Each names its test vector or edge case.

1. Example: "A combination's unit price equals the dish price plus the sum of its chosen option prices." Test: dish 1000 and options 150 and 0 gives 1150.
2. Example: "A required group with no offered option hides the dish." Test: fixture dish `bowl-paneer`, tier Partner.

## 5. Use cases (service methods)

| Method | Does | Transaction | Locks | Emits |
|---|---|---|---|---|
| `create(input, actor)` | one line of behavior | yes | none | none |

## 6. Ports

**Provides** (exported from `index.ts`): signatures and a one-line meaning for each.

**Requires** (from other modules): which port, which method, and what the stub returns until the real module is merged.

## 7. Hooks and events

Events emitted or subscribed to, with payload and what the subscriber must do.

## 8. Frontend

| Route | Screen | Permission | Notes |
|---|---|---|---|
| `/things` | list with filters and paging | `things:read` | uses `ServerTable` |

For each screen: the states to build (loading, empty, error, forbidden), forms and their zod schemas, and polling if any.

## 9. Test plan

- Domain unit tests: list each rule number with its vectors.
- Integration tests: invariants (for example "totals reconcile").
- Concurrency tests: which two actions race and what must happen.
- Permission matrix: expected allow list by role.
- Web: smoke tests.

## 10. Acceptance (demo script)

Numbered steps a reviewer can click through on the live app, with the expected result of each.

## 11. Out of scope

What is deliberately not built, with the reason.

## 12. Files and boundaries

- May create or edit: `apps/api/src/modules/<module>/**`, `apps/web/src/features/<module>/**`, tests, this doc.
- Must not edit: other modules, `schema.prisma` (use `docs/schema-requests.md`), shared contracts outside a contract PR.

## 13. Dependencies and merge order

Which sessions or modules must merge first, and which stubs it can run against meanwhile.

## 14. Risks and notes

Anything a reviewer should double-check.

## 15. How it works (filled in at the end by the implementing session)

A short walkthrough of the flow through controller, service, repository and domain, written so a TypeScript beginner can follow it.