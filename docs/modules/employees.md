# Module spec: employees

- **Session:** S2
- **Brief sections:** §4.5
- **Decision ids:** E1–E4
- **Tier:** 1

## 1. Purpose

Provides the employees capabilities described in §4.5 for authorized staff.

## 2. Owned tables

employees, employee_allergens, employee_dietary_tags. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/employees.ts`. Multi-value query filters use repeated keys when a route defines one.

| Id                 | Method and path        | Permission         | Request          | Response            | Errors                           |
| ------------------ | ---------------------- | ------------------ | ---------------- | ------------------- | -------------------------------- |
| `employees.list`   | `GET /employees`       | `employees:read`   | shared zod input | shared zod response | 501 until session implementation |
| `employees.get`    | `GET /employees/:id`   | `employees:read`   | shared zod input | shared zod response | 501 until session implementation |
| `employees.create` | `POST /employees`      | `employees:manage` | shared zod input | shared zod response | 501 until session implementation |
| `employees.update` | `PATCH /employees/:id` | `employees:manage` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. Email is lowercase and unique. Test: A@corp.test then a@corp.test conflicts. Constraints: employees_email_key unique and employees_email_lowercase.
2. Create or email change requires a claimed company domain; company moves do not recheck. Test: move an existing employee with old domain. Constraint: company_domains_domain_key unique; service enforces match.
3. Delivery-choice flags default false and server order validation respects them. Test: address change by a flagged-off employee fails. Constraint: employees_pkey anchors the row; this flag rule is enforced by the order service.
4. Moving an employee does not rewrite order companyId. Test: existing order remains with original company. Constraint: orders_company_id_fkey.

## 5. Use cases (service methods)

Each route above becomes one service use case in S2. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** EmployeePort.get. The stub is deterministic and exported from `index.ts`.

**Requires:** CompanyPort, reference lookup. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The employees feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Sign in as an admin and open Employees after route wiring. Create an employee with an email on a claimed company domain.
2. Search for the employee, open it, and change the delivery-choice flags.
3. Try changing the email to another domain and confirm the server rejects it. Move the employee to another company and confirm the existing email is preserved.
4. Sign in without `employees:manage` and confirm the list and read-only detail remain available when `employees:read` is granted.

## 11. Out of scope

- Allergy and dietary link writes work in the API, but the screen cannot present pickers until the Reference UI and read routes are integrated.
- App Router page and navigation registration are owned by the web session; this session supplies `EmployeesScreen`.
- CSV import is a [Should] item intentionally skipped in decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/employees/**`, `apps/web/src/features/employees/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S2 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

The controller uses the shared contract for all four routes. The service checks new or changed emails against domains returned by `CompanyPort`, normalizes emails to lowercase, and keeps the existing email when changing company. The repository writes the employee and its allergy and dietary links in one transaction. `EmployeePort.get` returns the contract shape to ordering modules. The feature screen uses the typed API client for paginated search, create and edit forms, and permission states.
