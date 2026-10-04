# Module spec: catalogue

- **Session:** S1
- **Brief sections:** §4.1
- **Decision ids:** C1–C4, G4
- **Tier:** 1

## 1. Purpose

Provides the catalogue capabilities described in §4.1 for authorized staff.

## 2. Owned tables

dishes, options, option_groups, option_group_options, dish_allergens, dish_dietary_tags, option_allergens, option_dietary_tags. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/catalogue.ts`. Multi-value query filters use repeated keys when a route defines one.

| Id | Method and path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `catalogue.listDishes` | `GET /dishes` | `dishes:read` | shared zod input | shared zod response | 501 until session implementation |
| `catalogue.getDish` | `GET /dishes/:id` | `dishes:read` | shared zod input | shared zod response | 501 until session implementation |
| `catalogue.createDish` | `POST /dishes` | `catalogue:manage` | shared zod input | shared zod response | 501 until session implementation |
| `catalogue.updateDish` | `PATCH /dishes/:id` | `catalogue:manage` | shared zod input | shared zod response | 501 until session implementation |
| `catalogue.listOptions` | `GET /options` | `dishes:read` | shared zod input | shared zod response | 501 until session implementation |
| `catalogue.createOption` | `POST /options` | `catalogue:manage` | shared zod input | shared zod response | 501 until session implementation |
| `catalogue.updateOption` | `PATCH /options/:id` | `catalogue:manage` | shared zod input | shared zod response | 501 until session implementation |
| `catalogue.listGroups` | `GET /dishes/:id/option-groups` | `dishes:read` | shared zod input | shared zod response | 501 until session implementation |
| `catalogue.createGroup` | `POST /dishes/:id/option-groups` | `catalogue:manage` | shared zod input | shared zod response | 501 until session implementation |
| `catalogue.updateGroup` | `PATCH /option-groups/:id` | `catalogue:manage` | shared zod input | shared zod response | 501 until session implementation |
| `catalogue.deleteGroup` | `DELETE /option-groups/:id` | `catalogue:manage` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. Dish SKUs are normalized to lowercase and unique. Test: ABC and abc conflict. Constraints: dishes_sku_key unique, dishes_sku_lowercase.
2. Dish minimum quantity is at least one and costs are nonnegative cents. Test: minOrderQty zero fails. Constraints: dishes_min_order_qty_positive and dishes_cost_cents_nonnegative.
3. A group belongs to one dish; each option occurs at most once in a group. Test: duplicate option membership conflicts. Constraint: option_group_options_group_id_option_id_key unique.
4. Required groups are single-choice. Test: two option ids from the same group fail combo validation. Constraint: option_group_options_group_id_option_id_key; service enforces choice count.

## 5. Use cases (service methods)

Each route above becomes one service use case in S1. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** CataloguePort.getDish and getOptions. The stub is deterministic and exported from `index.ts`.

**Requires:** reference lookup. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The catalogue feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Open /dishes as a permitted staff user after S1 is merged; verify catalogue.listDishes returns the contract response.
2. Open /dishes/:id as a permitted staff user after S1 is merged; verify catalogue.getDish returns the contract response.
3. Open /dishes as a permitted staff user after S1 is merged; verify catalogue.createDish returns the contract response.

## 11. Out of scope

Business implementation and UI remain assigned to S1; this session delivers contracts, ports, 501 shells and specifications. Tier 2 features follow decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/catalogue/**`, `apps/web/src/features/catalogue/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S1 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

`@Route(contract)` binds method, path and permission. The global interceptor validates request input; the shell throws `NOT_IMPLEMENTED` (501). S1 replaces it with a thin service call, transaction, repository query and pure domain rule.
