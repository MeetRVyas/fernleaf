# Module spec: dispatch

- **Session:** S5
- **Brief sections:** §4.8
- **Decision ids:** D1–D4
- **Tier:** 1

## 1. Purpose

Provides the dispatch capabilities described in §4.8 for authorized staff.

## 2. Owned tables

drops, order_dispatch_state. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/dispatch.ts`. Multi-value query filters use repeated keys when a route defines one.

| Id | Method and path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `dispatch.listDrops` | `GET /drops` | `dispatch:read` | shared zod input | shared zod response | 501 until session implementation |
| `dispatch.getDrop` | `GET /drops/:id` | `dispatch:read` | shared zod input | shared zod response | 501 until session implementation |
| `dispatch.assignDriver` | `PATCH /drops/:id/driver` | `dispatch:assign` | shared zod input | shared zod response | 501 until session implementation |
| `dispatch.ready` | `POST /orders/:id/dispatch-ready` | `dispatch:ready` | shared zod input | shared zod response | 501 until session implementation |
| `dispatch.out` | `POST /orders/:id/out-for-delivery` | `dispatch:out` | shared zod input | shared zod response | 501 until session implementation |
| `dispatch.readyDrop` | `POST /drops/:id/dispatch-ready` | `dispatch:ready` | shared zod input | shared zod response | 501 until session implementation |
| `dispatch.outDrop` | `POST /drops/:id/out-for-delivery` | `dispatch:out` | shared zod input | shared zod response | 501 until session implementation |
| `dispatch.deliver` | `POST /drops/:id/deliver` | `dispatch:deliver` | shared zod input | shared zod response | 501 until session implementation |
| `dispatch.myDrops` | `GET /driver/drops` | `drops:own-read` | shared zod input | shared zod response | 501 until session implementation |
| `dispatch.deliverMine` | `POST /driver/drops/:id/deliver` | `drops:own-deliver` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. Orders sharing date/company/address/exact time use one drop. Test: changing time splits a drop. Constraint: drops_delivery_date_company_id_address_id_delivery_time_key unique.
2. Dispatch ready precedes out for delivery; out requires a driver. Test: out before ready is 409. Constraints: order_dispatch_state_out_requires_ready, order_dispatch_state_out_after_ready.
3. Delivery follows out and may happen once; note is optional. Test: second delivery is 409. Constraints: order_dispatch_state_delivered_requires_out, order_dispatch_state_delivered_after_out, drops_delivered_actor_matches_time.
4. onTime compares deliveredAt with delivery instant plus grace minutes. Test: delivered exactly at grace boundary is on time. Constraint: drops_on_time_matches_delivery.
5. Driver reads only assigned drops for Clock.today(). Test: another driver sees zero rows. Constraint: drops_delivery_date_driver_id_idx index; query applies row scope.

## 5. Use cases (service methods)

Each route above becomes one service use case in S5. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** DispatchPort.getDrop and getDropsForOrder. The stub is deterministic and exported from `index.ts`.

**Requires:** OrdersPort, KitchenPort, CompanyPort, Clock. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The dispatch feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Open /drops as a permitted staff user after S5 is merged; verify dispatch.listDrops returns the contract response.
2. Open /drops/:id as a permitted staff user after S5 is merged; verify dispatch.getDrop returns the contract response.
3. Open /drops/:id/driver as a permitted staff user after S5 is merged; verify dispatch.assignDriver returns the contract response.

## 11. Out of scope

Business implementation and UI remain assigned to S5; this session delivers contracts, ports, 501 shells and specifications. Tier 2 features follow decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/dispatch/**`, `apps/web/src/features/dispatch/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S5 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

`@Route(contract)` binds method, path and permission. The global interceptor validates request input; the shell throws `NOT_IMPLEMENTED` (501). S5 replaces it with a thin service call, transaction, repository query and pure domain rule.
