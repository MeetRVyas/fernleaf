# Module spec: reference

- **Session:** S1
- **Brief sections:** §4.1
- **Decision ids:** C4, G4
- **Tier:** 1

## 1. Purpose

Provides the reference capabilities described in §4.1 for authorized staff.

## 2. Owned tables

allergens, dietary_tags, kitchen_stations. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/reference.ts`. Multi-value query filters use repeated keys when a route defines one.

| Id | Method and path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `reference.listAllergens` | `GET /allergens` | `reference:read` | shared zod input | shared zod response | 501 until session implementation |
| `reference.createAllergen` | `POST /allergens` | `reference:manage` | shared zod input | shared zod response | 501 until session implementation |
| `reference.updateAllergen` | `PATCH /allergens/:id` | `reference:manage` | shared zod input | shared zod response | 501 until session implementation |
| `reference.listDietaryTags` | `GET /dietary-tags` | `reference:read` | shared zod input | shared zod response | 501 until session implementation |
| `reference.createDietaryTag` | `POST /dietary-tags` | `reference:manage` | shared zod input | shared zod response | 501 until session implementation |
| `reference.updateDietaryTag` | `PATCH /dietary-tags/:id` | `reference:manage` | shared zod input | shared zod response | 501 until session implementation |
| `reference.listStations` | `GET /kitchen-stations` | `reference:read` | shared zod input | shared zod response | 501 until session implementation |
| `reference.createStation` | `POST /kitchen-stations` | `reference:manage` | shared zod input | shared zod response | 501 until session implementation |
| `reference.updateStation` | `PATCH /kitchen-stations/:id` | `reference:manage` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. Names are unique per reference table. Test: two allergens named Milk conflict. Constraints: allergens_name_key, dietary_tags_name_key, kitchen_stations_name_key unique.
2. A dish without a station is assigned to Unassigned by the kitchen read model. Test: stationId null. Constraint: dishes_station_id_fkey allows null; service maps it to Unassigned.

## 5. Use cases (service methods)

Each route above becomes one service use case in S1. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** none. The stub is deterministic and exported from `index.ts`.

**Requires:** none. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The reference feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Open /allergens as a permitted staff user after S1 is merged; verify reference.listAllergens returns the contract response.
2. Open /allergens as a permitted staff user after S1 is merged; verify reference.createAllergen returns the contract response.
3. Open /allergens/:id as a permitted staff user after S1 is merged; verify reference.updateAllergen returns the contract response.

## 11. Out of scope

Business implementation and UI remain assigned to S1; this session delivers contracts, ports, 501 shells and specifications. Tier 2 features follow decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/reference/**`, `apps/web/src/features/reference/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S1 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

`@Route(contract)` binds method, path and permission. The global interceptor validates request input; the shell throws `NOT_IMPLEMENTED` (501). S1 replaces it with a thin service call, transaction, repository query and pure domain rule.
