# Module spec: pricing

- **Session:** S1
- **Brief sections:** §4.3
- **Decision ids:** P1–P7
- **Tier:** 1

## 1. Purpose

Provides the pricing capabilities described in §4.3 for authorized staff.

## 2. Owned tables

price_tiers, price_entries. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/pricing.ts`. Multi-value query filters use repeated keys when a route defines one.

| Id | Method and path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `pricing.listTiers` | `GET /price-tiers` | `pricing:read` | shared zod input | shared zod response | 501 until session implementation |
| `pricing.createTier` | `POST /price-tiers` | `pricing:manage` | shared zod input | shared zod response | 501 until session implementation |
| `pricing.updateTier` | `PATCH /price-tiers/:id` | `pricing:manage` | shared zod input | shared zod response | 501 until session implementation |
| `pricing.getTierPrices` | `GET /price-tiers/:id/prices` | `pricing:read` | shared zod input | shared zod response | 501 until session implementation |
| `pricing.setManualPrice` | `PUT /price-tiers/:id/prices` | `pricing:manage` | shared zod input | shared zod response | 501 until session implementation |
| `pricing.clearManualPrice` | `DELETE /price-tiers/:id/prices/:subjectType/:subjectId` | `pricing:manage` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. Exactly one active tier is default. Test: a second default conflicts and deactivation fails. Constraints: price_tiers_one_default_idx, price_tiers_default_active.
2. Manual entries win over derivation; dish prices are positive, option prices may be zero. Test: manual 210 overrides derived 215. Constraint: price_entries_tier_id_subject_type_subject_id_key unique.
3. Derived prices round upward to 5 cents. Test: 211→215, 210→210, 1→5, 0→0, 214→215, 216→220; cost 88 × 2400 milli→215; base 333 + 1500 bp→385; base 1000 + 1500 bp→1150. Constraints: price_tiers_cost_multiplier_fields, price_tiers_percent_over_tier_fields.
4. Derivation cycles and chains longer than five fail on save. Test: A→B→A and six levels fail. Constraint: price_tiers_base_tier_id_fkey; service enforces graph.
5. An assigned tier with missing dish price hides the dish; no default fallback. Test: Partner missing dish. Constraint: price_entries_tier_id_subject_type_subject_id_key; service enforces visibility.

## 5. Use cases (service methods)

Each route above becomes one service use case in S1. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** PricingPort.effectiveTierId and resolve. The stub is deterministic and exported from `index.ts`.

**Requires:** CataloguePort. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The pricing feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Open /price-tiers as a permitted staff user after S1 is merged; verify pricing.listTiers returns the contract response.
2. Open /price-tiers as a permitted staff user after S1 is merged; verify pricing.createTier returns the contract response.
3. Open /price-tiers/:id as a permitted staff user after S1 is merged; verify pricing.updateTier returns the contract response.

## 11. Out of scope

Business implementation and UI remain assigned to S1; this session delivers contracts, ports, 501 shells and specifications. Tier 2 features follow decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/pricing/**`, `apps/web/src/features/pricing/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S1 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

`@Route(contract)` binds method, path and permission. The global interceptor validates request input; the shell throws `NOT_IMPLEMENTED` (501). S1 replaces it with a thin service call, transaction, repository query and pure domain rule.
