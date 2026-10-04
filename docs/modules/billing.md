# Module spec: billing

- **Session:** Phase 2
- **Brief sections:** §4.9
- **Decision ids:** B1–B5
- **Tier:** 1

## 1. Purpose

Provides the billing capabilities described in §4.9 for authorized staff.

## 2. Owned tables

invoices. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/billing.ts`. Multi-value query filters use repeated keys when a route defines one.

| Id | Method and path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `billing.listBillable` | `GET /companies/:id/billable-orders` | `billing:read` | shared zod input | shared zod response | 501 until session implementation |
| `billing.list` | `GET /invoices` | `billing:read` | shared zod input | shared zod response | 501 until session implementation |
| `billing.get` | `GET /invoices/:id` | `billing:read` | shared zod input | shared zod response | 501 until session implementation |
| `billing.create` | `POST /invoices` | `billing:manage` | shared zod input | shared zod response | 501 until session implementation |
| `billing.markPaid` | `POST /invoices/:id/paid` | `billing:manage` | shared zod input | shared zod response | 501 until session implementation |
| `billing.void` | `POST /invoices/:id/void` | `billing:manage` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. Only uninvoiced confirmed or delivered orders are billable. Test: draft excluded. Constraint: orders_invoice_billable_status.
2. Invoice total equals attached order totals; attach count must match requested count. Test: two racing invoices, one wins. Constraint: orders_invoice_id_fkey.
3. Paid invoices cannot be voided. Test: PAID→VOID fails. Constraints: invoices_paid_time_matches_status, invoices_void_time_matches_status.

## 5. Use cases (service methods)

Each route above becomes one service use case in Phase 2. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** none. The stub is deterministic and exported from `index.ts`.

**Requires:** OrdersPort, CompanyPort. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The billing feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Open /companies/:id/billable-orders as a permitted staff user after Phase 2 is merged; verify billing.listBillable returns the contract response.
2. Open /invoices as a permitted staff user after Phase 2 is merged; verify billing.list returns the contract response.
3. Open /invoices/:id as a permitted staff user after Phase 2 is merged; verify billing.get returns the contract response.

## 11. Out of scope

Business implementation and UI remain assigned to Phase 2; this session delivers contracts, ports, 501 shells and specifications. Tier 2 features follow decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/billing/**`, `apps/web/src/features/billing/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

Phase 2 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

`@Route(contract)` binds method, path and permission. The global interceptor validates request input; the shell throws `NOT_IMPLEMENTED` (501). Phase 2 replaces it with a thin service call, transaction, repository query and pure domain rule.
