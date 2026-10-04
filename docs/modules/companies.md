# Module spec: companies

- **Session:** S2
- **Brief sections:** §4.4
- **Decision ids:** Co1–Co5
- **Tier:** 1

## 1. Purpose

Provides the companies capabilities described in §4.4 for authorized staff.

## 2. Owned tables

companies, company_domains, company_addresses, company_holidays. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/companies.ts`. Multi-value query filters use repeated keys when a route defines one.

| Id | Method and path | Permission | Request | Response | Errors |
|---|---|---|---|---|---|
| `companies.list` | `GET /companies` | `companies:read` | shared zod input | shared zod response | 501 until session implementation |
| `companies.get` | `GET /companies/:id` | `companies:read` | shared zod input | shared zod response | 501 until session implementation |
| `companies.create` | `POST /companies` | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |
| `companies.update` | `PATCH /companies/:id` | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |
| `companies.createAddress` | `POST /companies/:id/addresses` | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |
| `companies.updateAddress` | `PATCH /company-addresses/:id` | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |
| `companies.listHolidays` | `GET /companies/:id/holidays` | `companies:read` | shared zod input | shared zod response | 501 until session implementation |
| `companies.createHoliday` | `POST /companies/:id/holidays` | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |
| `companies.deleteHoliday` | `DELETE /company-holidays/:id` | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. Names and domains are unique; domains and billing emails are lowercase; public domains are rejected. Test: Gmail.com fails. Constraints: companies_name_key, company_domains_domain_key, company_domains_domain_lowercase, companies_billing_email_lowercase.
2. Each company has an address and exactly one default. Test: second default conflicts. Constraint: company_addresses_one_default_per_company_idx; service enforces existence.
3. Working days are nonempty, distinct integers 1–7. Test: [1,1] fails. Constraints: companies_working_days_required and companies_working_days_valid.
4. A company cannot receive a delivery on a holiday or closed weekday. Test: Monday holiday rejects Monday delivery. Constraint: company_holidays_company_id_date_key unique; service enforces eligibility.
5. Default delivery time is HH:mm and lead minutes are nonnegative. Test: 24:00 fails. Constraint: companies_delivery_time_hhmm and companies_delivery_lead_minutes_nonnegative.

## 5. Use cases (service methods)

Each route above becomes one service use case in S2. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** CompanyPort.get, getAddress and allowsDelivery. The stub is deterministic and exported from `index.ts`.

**Requires:** PricingPort, staff permission lookup. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The companies feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Open /companies as a permitted staff user after S2 is merged; verify companies.list returns the contract response.
2. Open /companies/:id as a permitted staff user after S2 is merged; verify companies.get returns the contract response.
3. Open /companies as a permitted staff user after S2 is merged; verify companies.create returns the contract response.

## 11. Out of scope

Business implementation and UI remain assigned to S2; this session delivers contracts, ports, 501 shells and specifications. Tier 2 features follow decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/companies/**`, `apps/web/src/features/companies/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S2 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

`@Route(contract)` binds method, path and permission. The global interceptor validates request input; the shell throws `NOT_IMPLEMENTED` (501). S2 replaces it with a thin service call, transaction, repository query and pure domain rule.
