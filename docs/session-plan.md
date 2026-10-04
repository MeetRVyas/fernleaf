# Tier 1 session plan

Contracts, permission grants, shared value schemas and 501 route shells merge before feature sessions. Each feature session owns only its module folders and screens; contract shape changes use a small contract PR first. The branch order is S1 → S2 → S3 → S4 → S5. Run lint, typecheck, unit tests, database tests and drift after each milestone and before each Conventional Commit.

| Session | Scope | Runs against until dependencies merge | Merge after |
|---|---|---|---|
| Session 1 | Reference, catalogue, pricing, menu | Stub `CompanyPort`, `EmployeePort`; real reference/catalogue/pricing/menu replace their own stubs in dependency order | Contracts and platform; merge reference → catalogue → pricing → menu |
| Session 2 | Companies, employees, settings, staff admin UI | Stub `PricingPort` until S1; stub `CompanyPort` while employees start; `Clock` from core | S1 for end-to-end menu preview; settings → companies → employees → staff UI |
| Session 3 | Orders, order lines, cut-off and scheduler | Stub `MenuPort`, `PricingPort`, `EmployeePort`, `CompanyPort`, `SettingsPort` during local implementation; real ports after S1 and S2 | S1 and S2 |
| Session 4 | Kitchen board and prep state | Stub `OrdersPort`, `SettingsPort`, `CataloguePort`; real orders after S3 | S3 |
| Session 5 | Dispatch board and driver view | Stub `OrdersPort`, `KitchenPort`, `CompanyPort`; real kitchen after S4 | S4 |
| Phase 2 | Billing, role dashboards, demo-data refresher | Stub `OrdersPort` and read models until S5; invoice work uses real orders | S5, then billing → dashboards → demo refresher |

Stubs are deterministic scaffolding. They do not fulfill business acceptance. The implementing session replaces each token's provider with a real adapter and runs port conformance, contract response, permission matrix and integration tests. `@Route` shells stay 501 until that replacement. Do not change `schema.prisma` or merged migrations in a feature session; propose any gap in `docs/schema-requests.md`.
