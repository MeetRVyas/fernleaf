# Module spec: orders

- **Session:** S3
- **Brief sections:** §4.6
- **Decision ids:** O0–O8, K1–K5
- **Tier:** 1

## 1. Purpose

Provides the orders capabilities described in §4.6 for authorized staff.

## 2. Owned tables

orders, order_lines, order_line_combos, order_events, cutoff_runs. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/orders.ts`. Arrays in query strings use repeated keys, such as `status=PLACED&status=CONFIRMED`.

| Id | Method and path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `orders.list` | `GET /orders` | `orders:read` | shared zod input | shared zod response | 501 until session implementation |
| `orders.get` | `GET /orders/:id` | `orders:read` | shared zod input | shared zod response | 501 until session implementation |
| `orders.create` | `POST /orders` | `orders:create` | shared zod input | shared zod response | 501 until session implementation |
| `orders.replaceLines` | `PUT /orders/:id/lines` | `orders:edit` | shared zod input | shared zod response | 501 until session implementation |
| `orders.updateDelivery` | `PATCH /orders/:id/delivery` | `orders:edit` | shared zod input | shared zod response | 501 until session implementation |
| `orders.place` | `POST /orders/:id/place` | `orders:place` | shared zod input | shared zod response | 501 until session implementation |
| `orders.cancel` | `POST /orders/:id/cancel` | `orders:cancel` | shared zod input | shared zod response | 501 until session implementation |
| `orders.reject` | `POST /orders/:id/reject` | `orders:reject` | shared zod input | shared zod response | 501 until session implementation |
| `orders.processCutoff` | `POST /cutoff-runs/:date/process` | `orders:process-cutoff` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. Only allowed O1 transitions occur and terminal orders cannot change. Test: DELIVERED→PLACED fails. Constraints: orders_confirmed_has_time, orders_placed_has_time, orders_cancelled_has_time, orders_rejected_has_time_and_reason.
2. Active orders have an address and snapshot. Test: placing a draft without address fails. Constraint: orders_active_has_address.
3. Combo quantities sum to line quantity and totals reconcile in cents. Test: quantity 10 split 6+4; dish 1000 and options 150,0. Constraints: order_line_combos_unit_covers_dish_price and order_line_combos_order_line_id_combo_key_key unique; service enforces sums.
4. Edits lock the order, require current version, and reject invoiced money edits. Test: two simultaneous line edits yield one 409. Constraints: orders_invoice_id_idx index, orders_invoice_billable_status; service enforces version.
5. Cut-off counts kitchen working days and locks at now≥instant. Tests: Wed 2026-10-07→Mon 2026-10-05 16:00; Mon 2026-10-12→Thu 2026-10-08; Monday holiday→Fri 2026-10-02; Tue 2026-11-03→2026-10-30T20:00:00Z; Wed 2026-11-04→2026-11-02T21:00:00Z; N=0→delivery-day 16:00. Constraint: kitchen_holidays_date_key; domain enforces date math.
6. Cut-off processing is idempotent: drafts cancel, placed confirm, second run returns saved counts. Test: run twice. Constraint: cutoff_runs_delivery_date_key unique.
7. List filters include date range, repeated status keys, company, invoiced yes/no/any, free text and paging. Test: status=PLACED&status=CONFIRMED. Constraints: orders_delivery_date_status_idx, orders_company_id_delivery_date_idx, orders_invoice_id_idx.

## 5. Use cases (service methods)

Each route above becomes one service use case in S3. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** OrdersPort.get, lockOrder, recordEvent, markDelivered, attachToInvoice, detachFromInvoice. The stub is deterministic and exported from `index.ts`.

**Requires:** MenuPort, PricingPort, EmployeePort, CompanyPort, SettingsPort, Clock, HookBus. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The orders feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Open /orders as a permitted staff user after S3 is merged; verify orders.list returns the contract response.
2. Open /orders/:id as a permitted staff user after S3 is merged; verify orders.get returns the contract response.
3. Open /orders as a permitted staff user after S3 is merged; verify orders.create returns the contract response.

## 11. Out of scope

Business implementation and UI remain assigned to S3; this session delivers contracts, ports, 501 shells and specifications. Tier 2 features follow decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/orders/**`, `apps/web/src/features/orders/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S3 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

`@Route(contract)` binds method, path and permission. The global interceptor validates request input; the shell throws `NOT_IMPLEMENTED` (501). S3 replaces it with a thin service call, transaction, repository query and pure domain rule.
