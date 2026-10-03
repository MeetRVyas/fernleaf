# Architecture

Read together with `docs/conventions.md` and `docs/decisions.md`.

## 1. What we are building

An internal admin panel for a commercial kitchen. Four staff roles (admin, kitchen, dispatch, driver). Scale: about 10 reviewers, a peak of about 400 orders a day, under 1 GB of data. Two ground rules from the brief: the frontend talks to the backend only over HTTP, and every business rule is enforced on the server.

## 2. Runtime topology

Browser to Next.js (Vercel) to `/api/*` rewrite to NestJS API (Railway or Render, always on) to PostgreSQL (Neon). Object storage (Cloudflare R2, S3 API) is Tier 2.

- The browser only calls same-origin `/api/*`. A Next.js rewrite proxies to the API. This avoids cross-site cookie problems and CORS.
- The API runs the scheduler in-process (see decisions K5). No Redis, no queue, no WebSockets. Boards poll.
- Nothing in code is host-specific. Hosts differ only by env vars, the rewrite target and the scheduler mode.
- Portability rules: listen on `$PORT`, trust the proxy header, cookie flags and origins from env, JSON logs to stdout, a DB-free `/api/health`, DB-backed `/api/health/ready`, transaction-level advisory locks only, small pool plus an error handler on idle connections, migrations on a direct connection URL.

## 3. Repository layout

```
apps/
  api/
    prisma/                  schema, migrations (hand-edited SQL where needed), seed
    src/
      core/                  config, prisma, tx, clock, hooks, logging, errors, auth, guard, settings cache
      modules/<name>/        one folder per feature (section 4)
      main.ts, app.module.ts
  web/
    src/
      app/                   Next.js routes (thin: they import from features)
      features/<name>/       screens, components, hooks for one module (mirrors the API module)
      lib/                   api client, ServerTable, form helpers, formatters, nav registry
packages/
  shared/
    src/
      contracts/<module>.ts  zod schemas plus route descriptors
      permissions/<module>.ts permission names; roles.ts maps roles to permissions
      helpers/               money, time (Luxon), errors, pagination
docs/                        these documents, module specs, data-model.md
```

## 4. Backend layering and dependency rules

```
contract (shared) ──────────────┐
controller → service → repository → Prisma
                 │
                 ├→ domain (pure functions)
                 └→ other modules' ports (via their index.ts)
```

| Layer | Does | Must not |
|---|---|---|
| Contract (`packages/shared`) | zod schemas, route descriptors, permission names | import Nest or Prisma |
| Controller | Binds a contract with `@Route(contract)`, extracts typed input, calls one service method | contain business rules, touch Prisma |
| Service | One method per use case. Owns the transaction (`TxRunner.run`). Orchestrates repositories, domain functions, other modules' ports, and hook emission | import `@prisma/client` except the `Tx` type, know about HTTP |
| Repository | Prisma queries only. Takes `tx` as an optional first argument. Returns plain data | make business decisions |
| Domain (`domain/`) | Pure TypeScript: cut-off math, price resolution, combo validation, order state machine, fulfilment transitions, totals | import Nest, Prisma, `Date.now()` or any IO. Take times as parameters |
| Core | Config, Prisma client, `TxRunner`, `Clock`, `HookBus`, logging, errors, session auth, permission guard, settings cache | contain feature logic |

Rules for modules:

1. Other modules may import only `modules/<m>/index.ts`, which exports ports, types, events and the Nest module. No deep imports. No circular module dependencies. Lint enforces this (`eslint-plugin-boundaries` or `dependency-cruiser`; Session A chooses one and documents it).
2. A module reads and writes only its own tables. Anything else goes through a port. Dashboards may use a documented read-model repository that reads other modules' tables.
3. Pragmatic exception: pure lookup modules (reference data, settings) may skip the repository layer and have the service call Prisma through a tiny repository file. Do not wrap every trivial CRUD table in extra interfaces.
4. Interfaces (ports) only where there is a real seam: cross-module access, `Clock`, object storage, scheduler trigger. Not for every class.

## 5. Contracts

The contract is the single source of truth for method, path, permission, params, query, body and response. One file per module in `packages/shared/src/contracts/`.

```ts
export const placeOrder = defineRoute({
  id: 'orders.place',
  method: 'POST',
  path: '/orders/:id/place',
  permission: PERM.orders.place,
  params: z.object({ id: z.string().uuid() }),
  body: PlaceOrderBody,        // optional
  query: undefined,            // optional
  response: OrderDetail,
  errors: ['CUTOFF_PASSED', 'VALIDATION_ERROR'],
});
export type OrderDetail = z.infer<typeof OrderDetail>;
```

Constraints for the implementation (Session A decides the mechanism):

- Backend: `@Route(contract)` applies method, path and permission metadata and validates params, query and body with the contract schemas. The handler gets typed input (for example `@Input() input: InputOf<typeof placeOrder>`). In tests, responses are validated against `contract.response`.
- Frontend: a typed client built from the same descriptors (`api.call(placeOrder, { params, body })`) plus thin TanStack Query wrappers.
- Generated artifacts: OpenAPI at `/api/docs`, the typed client, and the permission-matrix test (every contract by every role).
- Changing a shape starts as a small contract change merged first. Then both sides adapt.

## 6. Modules, ownership and ports

| Module | Owns tables | Provides | Depends on |
|---|---|---|---|
| core | none | Clock, TxRunner, HookBus, CurrentUser | none |
| auth | staff_users, sessions | staff admin | core |
| settings | settings, kitchen_holidays | SettingsPort | core |
| reference | allergens, dietary_tags, kitchen_stations | none | core |
| catalogue | dishes, options, option_groups, option_group_options, dish and option allergen and tag links | CataloguePort | reference |
| pricing | price_tiers, price_entries | PricingPort | catalogue |
| companies | companies, company_domains, company_addresses, company_holidays | CompanyPort | pricing, auth |
| employees | employees and allergy and diet links | EmployeePort | companies, reference |
| menu | menu_categories, menu_items, company_hidden_categories, company_hidden_items | MenuPort | catalogue, pricing, companies, employees |
| orders | orders, order_lines, order_line_combos, order_events, cutoff_runs | OrdersPort, order events | menu, pricing, employees, companies, settings |
| kitchen | prep_units, order_kitchen_state | KitchenPort | orders, settings, catalogue |
| dispatch | drops, order_dispatch_state | DispatchPort | orders, kitchen, companies |
| billing | invoices | none | orders, companies |
| dashboards | none (read models) | none | all, read-only |
| demo | none | seed refresher (Phase 2) | all |

Port sketches (Session B2 writes the real signatures in `modules/<m>/ports.ts`):

```ts
interface Clock { now(): Date; today(): string /* YYYY-MM-DD in kitchen zone */ }
interface SettingsPort { get(): Promise<Settings>; isKitchenWorkingDay(date: string): Promise<boolean> }
interface PricingPort { effectiveTierId(companyId: string): Promise<string>; resolve(tierId: string, subjects: SubjectRef[]): Promise<Map<string, number | null>> }
interface MenuPort { getMenuFor(employeeId: string): Promise<EmployeeMenu>; getOrderableDish(employeeId: string, dishId: string): Promise<OrderableDish | null> }
interface OrdersPort {
  get(ids: string[]): Promise<OrderSummary[]>
  lockOrder(tx: Tx, id: string): Promise<void>                 // SELECT ... FOR UPDATE
  recordEvent(tx: Tx, orderId: string, type: OrderEventType, actorId: string | null, meta?: object): Promise<void>
  markDelivered(tx: Tx, orderIds: string[]): Promise<void>
  attachToInvoice(tx: Tx, orderIds: string[], invoiceId: string): Promise<number>
  detachFromInvoice(tx: Tx, invoiceId: string): Promise<void>
}
```

### Hooks (inversion of dependencies)

`orders` must not depend on `kitchen` or `dispatch`, which depend on it. So `core/HookBus` offers typed, synchronous, in-transaction events:

- `order.confirmed`, `order.delivery-changed`, `order.cancelled` (event types exported from `modules/orders/index.ts`)
- `emit(tx, event, payload)` awaits subscribers one by one inside the caller's transaction. An exception rolls everything back.
- `kitchen` and `dispatch` subscribe to create their state rows and drops. Adding a new reaction (open/closed) never edits `orders`.

## 7. Transactions and concurrency

- Services open one transaction per use case: `txRunner.run(async (tx) => ...)`. Repositories receive `tx`.
- Every mutation of an order, a prep unit or a drop first locks the order row via `OrdersPort.lockOrder`, then re-reads and re-validates. This serialises concurrent actions on the same order, including "last two units finishing at the same moment".
- State changes use conditional updates (`updateMany({ where: { id, status: X } })` and check the count) or `WHERE started_at IS NULL`. Zero rows updated means 409.
- Cut-off processing takes `pg_advisory_xact_lock` keyed by delivery date. Never use session-level advisory locks.
- Stale edits are caught with `Order.version` (409 `CONFLICT`).

## 8. Example flows

**Place an order.** `POST /orders/:id/place` goes to the controller (permission `orders:place`), then `OrdersService.place` opens a transaction, locks the order row, loads the employee and company through ports, validates every line through `MenuPort.getOrderableDish`, runs the pure `validateCombos` and `computeTotals`, writes lines, combos, status, version and an event, then commits.

**Cut-off.** The scheduler tick (or the manual endpoint) calls `CutoffService.process(date)`. It takes the advisory lock, runs the pure `cutoffInstant`, cancels drafts, confirms placed orders, emits `order.confirmed` for each, and records the run. `kitchen` and `dispatch` create prep units and drops inside the same transaction.

**Finish a prep unit.** `KitchenService.finishUnit` opens a transaction, locks the parent order, runs a conditional update on the unit, counts unfinished units, sets `readyAt` if none remain, records the `KITCHEN_READY` event through `OrdersPort.recordEvent`, and commits.

## 9. Frontend architecture

- Next.js App Router, TypeScript strict, Mantine, TanStack Query, `@mantine/form` with the shared zod schemas.
- `features/<module>/` mirrors the backend module: pages, components, hooks. `app/` files are thin and import from features.
- Navigation is a registry: each feature registers `{ label, path, permission }`. The shell renders what `can()` allows. Hiding is UX only. The server decides.
- Query keys: `[module, resource, params]`. Invalidate after mutations. Boards use `refetchInterval` (15 s). Filters and paging live in the URL.
- A single `ServerTable` (Mantine `Table` plus `Pagination`) handles page, page size, sort and filters via URL state. API field errors map onto form fields. No business logic and no Next.js server actions with logic.

## 10. SOLID in this codebase

| Principle | Where |
|---|---|
| Single responsibility | The controller, service, repository and domain split; one module per feature |
| Open/closed | Permission registry, price derivation kinds (a new kind adds one case and one test), order status table, hooks for new reactions |
| Liskov | A stub port and the real one must pass the same contract tests |
| Interface segregation | Small ports (`PricingPort.resolve`), never one giant facade |
| Dependency inversion | Services depend on ports, `Clock`, `TxRunner` and `HookBus`, not on other modules' internals |

SOLID is a guide here. Prefer the simplest design that keeps the dependency rules in section 4.

## 11. Non-goals

Redis, queues, WebSockets, caching layers, email, exports, audit logs, payments, IaC. See `decisions.md` section 1 for scope.