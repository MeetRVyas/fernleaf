# Module spec: menu

- **Session:** S1
- **Brief sections:** §4.2
- **Decision ids:** M1–M5
- **Tier:** 1

## 1. Purpose

Provides the menu capabilities described in §4.2 for authorized staff.

## 2. Owned tables

menu_categories, menu_items, company_hidden_categories, company_hidden_items. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/menu.ts`. Multi-value query filters use repeated keys when a route defines one.

| Id                     | Method and path                                  | Permission     | Request          | Response            | Errors                           |
| ---------------------- | ------------------------------------------------ | -------------- | ---------------- | ------------------- | -------------------------------- |
| `menu.listCategories`  | `GET /menu-categories`                           | `menu:read`    | shared zod input | shared zod response | 501 until session implementation |
| `menu.createCategory`  | `POST /menu-categories`                          | `menu:manage`  | shared zod input | shared zod response | 501 until session implementation |
| `menu.updateCategory`  | `PATCH /menu-categories/:id`                     | `menu:manage`  | shared zod input | shared zod response | 501 until session implementation |
| `menu.createItem`      | `POST /menu-items`                               | `menu:manage`  | shared zod input | shared zod response | 501 until session implementation |
| `menu.updateItem`      | `PATCH /menu-items/:id`                          | `menu:manage`  | shared zod input | shared zod response | 501 until session implementation |
| `menu.setHiding`       | `PUT /companies/:id/menu-hiding`                 | `menu:manage`  | shared zod input | shared zod response | 501 until session implementation |
| `menu.preview`         | `GET /employees/:id/menu`                        | `menu:preview` | shared zod input | shared zod response | 501 until session implementation |
| `menu.previewCategory` | `GET /employees/:id/menu/categories/:categoryId` | `menu:preview` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. Listed categories and items are active, ordered, and visible to the company. Test: hidden category absent. Constraints: menu_items_category_id_sort_order_idx, company_hidden_categories_pkey.
2. A secret category is absent from listing but reachable by id when active and visible. Test: secret fixture category. Constraint: menu_categories_sort_order_idx index; service enforces secrecy.
3. A dish without price or a required group without a priced active option is hidden. Test: Partner tier missing price. Constraints: price_entries_tier_id_subject_type_subject_id_key and option_group_options_group_id_option_id_key; service enforces visibility.
4. Preview and order validation use the same MenuPort path. Test: preview dish set equals orderable dish set. Constraint: menu_items_category_id_dish_id_key unique.

## 5. Use cases (service methods)

Each route above becomes one service use case in S1. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** MenuPort.getMenuFor and getOrderableDish. The stub is deterministic and exported from `index.ts`.

**Requires:** CataloguePort, PricingPort, CompanyPort, EmployeePort. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The menu feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Sign in as an admin and create an active category with `POST /api/menu-categories`.
2. Add a dish with `POST /api/menu-items`, then preview an employee through `GET /api/employees/:id/menu`.
3. Hide that item for the employee's company. Refresh the preview: the dish is absent, and `MenuPort.getOrderableDish` returns null.
4. Create a secret category and open it by ID with `GET /api/employees/:id/menu/categories/:categoryId`; it stays out of the ordinary listing.
5. Open `MenuScreen` once the web shell mounts it. Create a category and item, set hiding, and preview an employee.

## 11. Out of scope

- Required and optional option-group filtering cannot be completed through the current `CataloguePort`, which exposes only `getDish` and `getOptions`. The preview currently returns dishes with an empty `groups` array. Add a group-and-membership read method to the catalogue public port, then resolve active option prices before using MenuPort for order placement.
- The web shell's App Router pages and navigation registry are outside this session's allowed folders. `MenuScreen` is implemented in the feature folder but needs a thin route and nav entry from the shell owner.
- End-to-end preview for stored company and employee records awaits their real port providers. This branch tests against deterministic stubs.

## 12. Files and boundaries

May edit `apps/api/src/modules/menu/**`, `apps/web/src/features/menu/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S1 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

The controller binds all eight shared routes to `MenuService`. Category, item, and company-hiding writes run in `TxRunner` transactions; the repository touches only menu-owned tables. The service validates dish, company, and employee references through their public ports. Employee preview resolves the company's effective tier through `PricingPort`, excludes hidden and secret categories from the listing, and applies the pure visibility predicates. Direct category preview permits a visible secret category. `getOrderableDish` uses the same preview path, including direct secret-category access. The screen uses the shared typed client and TanStack Query with permission, loading, empty, and error states.
