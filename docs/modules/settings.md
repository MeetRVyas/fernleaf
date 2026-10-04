# Module spec: settings

- **Session:** S2
- **Brief sections:** §4.10
- **Decision ids:** G1, K1, S1
- **Tier:** 1

## 1. Purpose

Provides the settings capabilities described in §4.10 for authorized staff.

## 2. Owned tables

settings, kitchen_holidays. Other modules are accessed through ports.

## 3. Contract

Source: `packages/shared/src/contracts/settings.ts`. Multi-value query filters use repeated keys when a route defines one.

| Id                       | Method and path                | Permission        | Request          | Response            | Errors                           |
| ------------------------ | ------------------------------ | ----------------- | ---------------- | ------------------- | -------------------------------- |
| `settings.list`          | `GET /settings`                | `settings:read`   | shared zod input | shared zod response | 501 until session implementation |
| `settings.update`        | `PUT /settings/:key`           | `settings:manage` | shared zod input | shared zod response | 501 until session implementation |
| `settings.listHolidays`  | `GET /kitchen-holidays`        | `settings:read`   | shared zod input | shared zod response | 501 until session implementation |
| `settings.createHoliday` | `POST /kitchen-holidays`       | `settings:manage` | shared zod input | shared zod response | 501 until session implementation |
| `settings.deleteHoliday` | `DELETE /kitchen-holidays/:id` | `settings:manage` | shared zod input | shared zod response | 501 until session implementation |

## 4. Domain rules

1. The key registry accepts only the eight S1 keys; unknown keys fail validation. Test: cutoff.time accepted, cutoff.unknown rejected. Constraint: settings_pkey.
2. Setting.value is a JSON-encoded string validated by its key schema. Test: cutoff.time stores `"16:00"`; duplicate working days fail. Constraint: settings_pkey.
3. A holiday date is unique. Test: inserting the same date twice fails. Constraint: kitchen_holidays_date_key.

## 5. Use cases (service methods)

Each route above becomes one service use case in S2. Reads use scoped repository queries; writes run in one `TxRunner.run` transaction. Order, unit and drop mutations lock the parent order first. Hooks are emitted in the same transaction. The current controller intentionally returns 501.

## 6. Ports

**Provides:** SettingsPort.get and isKitchenWorkingDay. The stub is deterministic and exported from `index.ts`.

**Requires:** Clock. Until those implementations merge, consume the exported stub token.

## 7. Hooks and events

Orders emits `order.confirmed`, `order.delivery-changed` and `order.cancelled` inside transactions. Kitchen and dispatch subscribe to create or update state rows. Other modules do not emit hooks in the shell.

## 8. Frontend

The settings feature screens follow the contract paths, use typed-client calls and URL filters, and provide loading, empty, error and forbidden states. Forms use the request zod schemas. Kitchen and dispatch boards poll every 15 seconds.

## 9. Test plan

- Domain unit tests: each numbered rule and its stated vector.
- Integration tests: owned-table constraints and port conformance using the deterministic fixture set.
- Concurrency tests: two simultaneous actions on the same order or owned state where the rules require it.
- Permission matrix: every contract route by all four roles; deny by default.
- Web: permitted and forbidden navigation smoke tests.

## 10. Acceptance (demo script)

1. Sign in as an admin and open the Settings screen after the web route is wired. Confirm eight settings appear with defaults.
2. Change `cutoff.time` to `15:45`, save, reload, and confirm the value persists.
3. Add a kitchen holiday, confirm it appears, then delete it. Repeating the same date returns a conflict.
4. Sign in without `settings:manage` and confirm edit controls are hidden. The API guard remains authoritative.

## 11. Out of scope

- App Router page and navigation registration are owned by the web session; this session supplies `SettingsScreen` in its feature folder.
- Tier 2 features remain deferred by decisions.md section 1.

## 12. Files and boundaries

May edit `apps/api/src/modules/settings/**`, `apps/web/src/features/settings/**`, this spec, and a small contract PR. Do not edit other module folders or `schema.prisma`; request schema changes in `docs/schema-requests.md`.

## 13. Dependencies and merge order

S2 merges per `docs/session-plan.md`. It can boot against the required stub ports listed in section 6.

## 14. Risks and notes

Recheck response conformance and the named database constraints when replacing a stub. A 501 shell is not a working use case.

## 15. How it works

`@Route(contract)` validates input and permissions. The service reads the eight shared registry keys, filling absent database rows with defaults. Updates validate the key-specific zod schema, write a JSON-encoded string in one transaction, and invalidate the settings cache. The `SettingsPort` uses the shared date helper and stored holidays to answer whether a kitchen date is a working day. Holiday create and delete run in transactions; dates are unique. The feature screen uses the typed API client and shows loading, empty, error and permission states.
