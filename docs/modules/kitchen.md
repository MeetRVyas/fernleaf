# Module spec: kitchen

- **Session:** S4
- **Brief sections:** §4.7
- **Decision ids:** Ki1–Ki7
- **Tier:** 1

## 1. Purpose

Provides the kitchen capabilities described in §4.7 for authorized staff.

## 2. Owned tables

prep_units, order_kitchen_state. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/kitchen.ts`. Multi-value query filters use repeated keys when a route defines one.

| Id | Method and path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `kitchen.board` | `GET /kitchen/board` | `kitchen:read` | shared zod input | shared zod response | 501 until session implementation |
| `kitchen.start` | `POST /prep-units/:id/start` | `kitchen:start` | shared zod input | shared zod response | 501 until session implementation |
| `kitchen.finish` | `POST /prep-units/:id/finish` | `kitchen:finish` | shared zod input | shared zod response | 501 until session implementation |
| `kitchen.forceComplete` | `POST /orders/:id/force-complete-kitchen` | `kitchen:force-complete` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. One prep unit is created per combo on confirmation. Test: 6+4 combos produce two units. Constraint: prep_units_combo_id_key unique.
2. Start and finish are one-time actions; finish may create start at the same instant. Test: second finish is 409. Constraints: prep_units_done_requires_start, prep_units_start_actor_matches_time, prep_units_done_actor_matches_time, prep_units_done_after_start.
3. Order readyAt is set only after every unit finishes. Test: final two concurrent finishes set it once. Constraints: order_kitchen_state_ready_requires_start, order_kitchen_state_ready_after_start.
4. Planned times subtract lead and prep buffer; late means now past planned kitchen-ready. Test: 12:00 delivery, lead 60, buffer 30→10:30 ready. Constraint: companies_delivery_lead_minutes_nonnegative; service computes the times.

## 5. Use cases (service methods)

Each route above becomes one service use case in S4. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** KitchenPort.getReadyAt and getUnits. The stub is deterministic and exported from `index.ts`.

**Requires:** OrdersPort, SettingsPort, CataloguePort, Clock. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The kitchen feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Open /kitchen/board as a permitted staff user after S4 is merged; verify kitchen.board returns the contract response.
2. Open /prep-units/:id/start as a permitted staff user after S4 is merged; verify kitchen.start returns the contract response.
3. Open /prep-units/:id/finish as a permitted staff user after S4 is merged; verify kitchen.finish returns the contract response.

## 11. Out of scope

Business implementation and UI remain assigned to S4; this session delivers contracts, ports, 501 shells and specifications. Tier 2 features follow decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/kitchen/**`, `apps/web/src/features/kitchen/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S4 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

`@Route(contract)` binds method, path and permission. The global interceptor validates request input; the shell throws `NOT_IMPLEMENTED` (501). S4 replaces it with a thin service call, transaction, repository query and pure domain rule.
