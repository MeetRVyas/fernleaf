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

| Id                        | Method and path                 | Permission         | Request          | Response            | Errors                           |
| ------------------------- | ------------------------------- | ------------------ | ---------------- | ------------------- | -------------------------------- |
| `companies.list`          | `GET /companies`                | `companies:read`   | shared zod input | shared zod response | 501 until session implementation |
| `companies.get`           | `GET /companies/:id`            | `companies:read`   | shared zod input | shared zod response | 501 until session implementation |
| `companies.create`        | `POST /companies`               | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |
| `companies.update`        | `PATCH /companies/:id`          | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |
| `companies.createAddress` | `POST /companies/:id/addresses` | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |
| `companies.updateAddress` | `PATCH /company-addresses/:id`  | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |
| `companies.listHolidays`  | `GET /companies/:id/holidays`   | `companies:read`   | shared zod input | shared zod response | 501 until session implementation |
| `companies.createHoliday` | `POST /companies/:id/holidays`  | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |
| `companies.deleteHoliday` | `DELETE /company-holidays/:id`  | `companies:manage` | shared zod input | shared zod response | 501 until session implementation |

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

1. Sign in as an admin and open Companies after route wiring. Create a company with a private domain and one default address.
2. Search for the company, open it, edit its billing details, add a second address and make it the default.
3. Add a company holiday and confirm the calendar port excludes that date. Delete the holiday.
4. Try a public or already claimed domain and confirm the form shows the server error. View the list with read-only permission and confirm mutation controls are hidden.

## 11. Out of scope

- Company owner and default driver assignment need Employee and Auth lookup ports. This session cannot add those ports under its ownership boundary, so new non-null assignments return validation errors. See decisions.md section 9.
- App Router page and navigation registration are owned by the web session; this session supplies `CompaniesScreen`.
- Tier 2 features remain deferred by decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/companies/**`, `apps/web/src/features/companies/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S2 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

The controller binds the shared routes to one service method each. The repository reads and writes the four company-owned tables. Creation and updates normalize domains, reject public and duplicate domains, require distinct working days and exactly one default address, and run in transactions. Address default changes unset the old default and set the new one in the same transaction. `CompanyPort` returns company and address details and applies working days plus holidays for delivery eligibility. The feature screen uses the typed API client for paging, edit forms, addresses and holidays.
