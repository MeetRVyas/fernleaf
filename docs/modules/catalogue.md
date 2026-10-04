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

1. Sign in as admin and call `POST /api/dishes` with a unique uppercase SKU, cost in cents, minimum quantity one, and any existing reference IDs. `GET /api/dishes` shows the normalized lowercase SKU.
2. Call `POST /api/options` to add a reusable option, then `POST /api/dishes/:id/option-groups` with its ID. `GET /api/dishes/:id` shows the group and ordered membership.
3. Repeat the same option ID twice in one group request to see a validation error. Repeat the SKU in another dish request to see 409.
4. Update the dish to inactive and verify `GET /api/dishes?active=false` includes it. Delete the group and verify the detail no longer includes it.

## 11. Out of scope

UI route wiring and navigation are outside this session's owned folders. Tier 2 image upload and multi-select groups remain out of scope under decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/catalogue/**`, `apps/web/src/features/catalogue/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S1 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

The controller binds the shared contracts and delegates to CatalogueService. The service normalizes SKUs, checks references through ReferencePort, validates group membership, and wraps writes in TxRunner transactions. The repository owns all Prisma queries and replaces label and group links atomically. PostgreSQL enforces unique SKUs and one membership per group and option. The real CataloguePort serves dishes and reusable options to dependent modules. Reads return paged dishes and options, and ordered groups on dish detail.
