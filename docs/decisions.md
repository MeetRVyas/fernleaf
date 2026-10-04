# Decisions and interpretations

Status: binding for every session.

- If this file and the client brief (`docs/client-brief.md`) disagree on a business rule, the brief wins. On engineering choices, this file wins.
- Do not re-decide anything here. If you find a gap, add a "Proposed decision" in section 9, pick the simplest assumption, and keep going.
- The total time budget is 24 to 30 hours. Everything below is sized for that.

---

## 1. Scope cut line

**Tier 1 (must work end to end with seeded data):** staff auth and RBAC, reference data, catalogue (dishes, options, option groups), menu with company hiding and preview, price tiers (default tier, company tier, derived tiers, missing-price handling, tier editor), companies, employees, orders (create, draft, place, edit, cancel, list, detail with timeline, admin overrides), cut-off processing (scheduled and manual), kitchen board, dispatch board, driver view, company invoicing, settings, one dashboard per role.

**Tier 2 (only after Tier 1 is verified):** dish image upload to object storage, delivery photo upload, allergy conflict badges on the menu preview, kitchen totals by dish variant.

**Skipped on purpose (each must be listed in the README with the reason):** portions and sizes [Should], CSV employee import [Should], invoice adjustments and credit notes, multi-select option groups, admin-managed packaging list, everything in brief section 5.

Dish images are a URL text field in Tier 1 (seed data uses stock image URLs). The driver's delivery note is Tier 1. The photo is Tier 2.

---

## 2. Global rules

- **G1 Time zone.** The setting `kitchen.timezone` holds an IANA zone. Default `America/New_York` (assumption: the brief uses `$`). The README must state it. Instants are `timestamptz` in UTC. A delivery date is a calendar date (`date`, `YYYY-MM-DD`) in the kitchen zone. A delivery time is `HH:mm` in the kitchen zone. "Today" always comes from `Clock.today()`. Never call `new Date("YYYY-MM-DD")`. Containers run with `TZ=UTC`. Use Luxon for all zone math. Assume company deliveries are in the kitchen's zone.
- **G2 Money.** Integer cents, USD only. Never use floats or Decimal. Multipliers are integers: `factorMilli` (2400 means x2.4) and `percentBp` (1500 means +15%).
- **G3 IDs.** UUID strings. Humans also see `orderNumber` (autoincrement integer, unique) and invoice numbers like `INV-000123`.
- **G4 Deactivate, never delete.** Dishes, options, categories, tiers, companies, employees and staff use `isActive`. Deactivated items are never offered for new orders and remain visible in history.
- **G5 Single language and currency.** English, USD.

---

## 3. Catalogue, menu, pricing

**Catalogue**
- **C1** A dish has name, description, `imageUrl`, `sku` (unique), `temperature` (HOT or COLD), `costCents`, allergens, dietary tags, `stationId` (nullable), `minOrderQty` (integer, at least 1, default 1), `isActive`.
- **C2** An option has name, `costCents`, allergens, dietary tags, `isActive`. Options are reusable across groups.
- **C3** An option group belongs to one dish. It has name, `isRequired`, `sortOrder`, and an ordered list of options (`OptionGroupOption`, unique per group and option). Groups are single-choice: a combination picks at most one option per group, and exactly one if the group is required.
- **C4** Allergens, dietary tags and kitchen stations are admin-managed lists. A dish with no station is routed to "Unassigned".

**Menu**
- **M1** `MenuCategory` has name, `sortOrder`, `isActive`, `isSecret`. `MenuItem` links a category to a dish (unique per category and dish) with `sortOrder` and `isActive`. A dish can appear in several categories.
- **M2** Hiding is per company, at category level (`CompanyHiddenCategory`) and at menu-item level (`CompanyHiddenItem`).
- **M3** An employee's menu contains: active categories that are not hidden for their company and not secret, containing active menu items that are not hidden, whose dish is active, priced on the employee's tier, and has at least one offered option in every required group. Options shown are active and priced on the tier. An optional group with no offered options is dropped.
- **M4** A secret category is omitted from the listing but can be opened by id if it is active and not hidden for the company. Orders may include its dishes.
- **M5** Staff preview uses the same code path as the employee menu (`MenuPort.getMenuFor(employeeId)`). The preview has an "open category by id" box for secret categories.

**Pricing**
- **P1** `PriceTier` has a unique name, `isDefault` and a derivation rule. Exactly one tier is the default (partial unique index). The default tier cannot be deactivated.
- **P2** `PriceEntry` holds manual prices only: `tierId`, `subjectType` (DISH or OPTION), `subjectId`, `priceCents`, unique per tier and subject. A dish price must be above 0. An option price may be 0.
- **P3** A tier's derivation is one of: `NONE`; `COST_MULTIPLIER {factorMilli}`; `PERCENT_OVER_TIER {baseTierId, percentBp}`. Cycles are rejected on save and chains are limited to 5. Derived prices are computed on read by a pure function and never stored.
- **P4** `resolvePrice(subject, tier)`: (1) a manual entry wins; (2) otherwise derive; (3) otherwise MISSING. A derived dish price of 0 counts as MISSING.
  - `COST_MULTIPLIER`: `ceilDiv(cost * factorMilli, 5000) * 5`
  - `PERCENT_OVER_TIER`: `ceilDiv(basePrice * (10000 + percentBp), 50000) * 5`, where `basePrice` is the resolved price on the base tier.
  - Exact multiples of 5 cents are unchanged.
- **P5** The effective tier is `company.tierId ?? defaultTier`. There is no fallback to the default tier when the assigned tier lacks a price: the dish is hidden.
- **P6** The tier editor shows one tier at a time: rows for dishes and options with value, source (MANUAL, DERIVED, MISSING), and a `missingOnly` filter. Editing sets or clears a manual entry.
- **P7** Prices are snapshotted into the order and never recomputed afterwards (see O5).

**Test vectors (pricing)**
- `roundUpTo5(211)=215`, `(210)=210`, `(1)=5`, `(0)=0`, `(214)=215`, `(216)=220`
- Cost 88, `factorMilli` 2400 gives 211.2 exact, so **215**
- Base 333, `percentBp` 1500 gives 382.95 exact, so **385**
- Base 1000, `percentBp` 1500 gives **1150**

---

## 4. Companies and employees

- **Co1** A company has: name (unique), `tierId` (nullable), `defaultDeliveryTime` (HH:mm), `deliveryLeadMinutes` (default 60), `defaultPackaging`, `driverInstructions`, `defaultDriverId` (nullable, a staff user with the driver role), billing name, email, phone and address, `ownerEmployeeId` (nullable, must be an employee of the company), `isActive`.
- **Co2** `CompanyDomain`: stored lowercase without `@`, unique across all companies, syntax-checked, and rejected if it is in `PUBLIC_EMAIL_DOMAINS` (a shared constant: gmail.com, yahoo.com, outlook.com, hotmail.com, live.com, msn.com, icloud.com, me.com, aol.com, proton.me, protonmail.com, gmx.com, yandex.com, zoho.com).
- **Co3** `CompanyAddress`: label, line1, line2, city, region, postal code, country, `isDefault`. At least one address per company, exactly one default (partial unique index).
- **Co4** Calendar: `workingDays` (integers 1 to 7, 1 is Monday, default 1 to 5) and `CompanyHoliday` (date, name). A company cannot receive deliveries on non-working days or holidays. The company calendar never affects the cut-off.
- **Co5** Packaging is an enum: `STANDARD | ECO | INSULATED` (assumption, the brief names no types).
- **E1** An employee has company, name, email (lowercase, unique), optional phone, `canChooseAddress`, `canChangeDeliveryTime`, `canChangePackaging` (all default false), allergies, dietary preferences and `isActive`.
- **E2** The email domain must match one of the company's domains on create and on email change. Moving an employee to another company does not re-check it.
- **E3** Employees never log in. Only staff have accounts.
- **E4** Orders copy `companyId` at creation. Moving an employee does not change past orders.

---

## 5. Orders and cut-off

**Who and what**
- **O0** Only ADMIN creates and edits orders. Kitchen, dispatch and driver have read or action permissions only.
- **O1** Statuses: `DRAFT, PLACED, CONFIRMED, DELIVERED, CANCELLED, REJECTED`. Allowed transitions:
  - DRAFT to PLACED (admin, before cut-off) or to CANCELLED
  - PLACED to CANCELLED (before cut-off)
  - PLACED to CONFIRMED (cut-off processing only)
  - CONFIRMED to DELIVERED (when the drop is delivered)
  - After cut-off, admin only: PLACED or CONFIRMED to REJECTED (reason required), CONFIRMED to CANCELLED (reason required)
  - REJECTED is an admin decision with a reason. It is treated like CANCELLED for billing and for the kitchen.
  - DELIVERED, CANCELLED and REJECTED are terminal.
- **O2** After cut-off, admin may change delivery time, address and packaging (overrides). Admin may not replace lines. To change lines, cancel and recreate. New orders cannot be created for a date whose cut-off has passed (`CUTOFF_PASSED`), for anyone.
- **O3** The `orders` table: `orderNumber`, `employeeId`, `companyId`, `status`, `deliveryDate`, `deliveryTime`, `addressId` plus `addressSnapshot` (JSON), `packaging`, `totalCents`, `version`, `priceTierId` (informational), `invoiceId` (nullable), `createdByStaffId`, `placedAt`, `confirmedAt`, `cancelledAt`, `rejectedAt`, `reason`.
- **O4** Lines are snapshots:
  - `OrderLine`: `dishId`, `dishSnapshot` (name, sku, temperature, allergens), `quantity`, `lineTotalCents`.
  - `OrderLineCombo`: `quantity`, `dishPriceCents`, `unitPriceCents` (dish price plus chosen options), `optionsSnapshot` (JSON array of `{groupId, groupName, optionId, name, priceCents}`), `comboKey` (dishId plus sorted option ids).
  - `lineTotal = sum(combo.unitPrice * combo.quantity)`. `orderTotal = sum(lineTotal)`. These must reconcile exactly, and a test asserts it.
- **O5** Validation runs on the server at place time. Drafts only need an employee and a delivery date. For saves and place, the server:
  - checks the employee is active, the date is not in the past, the company calendar allows it, and the cut-off has not passed
  - uses only dishes reachable through `MenuPort.getOrderableDish`
  - enforces `lineQty >= dish.minOrderQty` and that combo quantities sum exactly to the line quantity
  - enforces required groups, and that options belong to the group, are active, and are priced on the employee's tier
  - merges duplicate combos
  - enforces the employee flags for address, time and packaging. This applies to admin too. Admin can change the employee's flags or use overrides after confirmation.
  - re-prices every line at current prices on every save of lines and on place.
- **O6** Edits: `PUT /orders/:id/lines` replaces all lines (re-priced). `PATCH /orders/:id/delivery` changes delivery details and never touches lines. Both require the current `version` (409 on mismatch). Every mutation is one transaction that locks the order row (`FOR UPDATE`), re-checks status and cut-off, applies the change, bumps `version`, and writes an `OrderEvent`.
- **O7** `OrderEvent` (type, at, actor, meta JSON) powers the order timeline. Types: CREATED, PLACED, EDITED, CONFIRMED, KITCHEN_STARTED, KITCHEN_READY, DISPATCH_READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REJECTED, OVERRIDE. This is not an audit log.
- **O8** The order list supports filters on delivery date range, status (multi), company, `invoiced` (yes, no, any), free text (order number, employee name or email, company name), sort and server-side paging.

**Cut-off**
- **K1** Settings: `cutoff.time` (HH:mm, default 16:00), `cutoff.workingDaysBefore` (default 2), `kitchen.workingDays` (default Mon to Fri), kitchen holidays (a table), `cutoff.autoProcess` (default true).
- **K2** `cutoffInstant(deliveryDate)`: start at the delivery date. Step back one day at a time, counting a day only if it is a kitchen working day (not a holiday). Stop after `N` counted days. The cut-off is that date at `cutoff.time` in the kitchen zone, converted to UTC. An order is locked when `now >= cutoffInstant`. The delivery date itself does not need to be a kitchen working day. With `N = 0` the cut-off is the delivery date itself.
- **K3** `processCutoff(date)` is idempotent and transactional. It fails with `CUTOFF_NOT_REACHED` if the cut-off has not passed. It takes `pg_advisory_xact_lock` for the date, cancels all DRAFT orders for the date (reason "Cut-off"), confirms all PLACED orders, emits `order.confirmed` per order, and records `CutoffRun(deliveryDate unique, processedAt, draftsCancelled, ordersConfirmed)`. A second run returns the stored counts with `alreadyProcessed: true`. Confirmation does not re-validate the menu.
- **K4** Manual trigger: `POST /cutoff-runs/:date/process` (ADMIN). The `cutoff.autoProcess` setting lets a reviewer turn the scheduler off to try the manual path.
- **K5** Scheduler: an in-process tick every minute (`SCHEDULER_MODE=internal`) that does not query the database on ticks where nothing newly became due. Compute in memory the latest delivery date whose cut-off has passed. Query the database only when that date changes, on boot (catch-up), and after a settings change. Also expose a secret-protected endpoint (`CRON_SECRET`) so an external cron can trigger it. This keeps a scale-to-zero database asleep.

**Test vectors (cut-off, default settings, `America/New_York`)**
- Wed 2026-10-07 gives Mon 2026-10-05 16:00 local
- Mon 2026-10-12 gives Thu 2026-10-08 16:00 local
- Wed 2026-10-07 with Mon 2026-10-05 as a holiday gives Fri 2026-10-02 16:00 local
- Tue 2026-11-03 gives Fri 2026-10-30 16:00 EDT = `2026-10-30T20:00:00Z`
- Wed 2026-11-04 gives Mon 2026-11-02 16:00 EST = `2026-11-02T21:00:00Z`
- `N = 0`, Wed 2026-10-07 gives Wed 2026-10-07 16:00 local

---

## 6. Kitchen, dispatch, driver

- **Ki1** The board shows prep units (one per `OrderLineCombo`) for CONFIRMED orders of a chosen date. The station is the dish's current `stationId` (live join). A null station is "Unassigned".
- **Ki2** Tables: `prep_units(comboId unique, startedAt, startedBy, doneAt, doneBy)` and `order_kitchen_state(orderId PK, startedAt, readyAt)`, created when `order.confirmed` fires.
- **Ki3** Start is allowed only on a CONFIRMED order and only if `startedAt` is null. Finish is allowed only if `doneAt` is null, and sets `startedAt` too if it was never started. Repeating either returns 409 `INVALID_TRANSITION`. Each action locks the order row (`FOR UPDATE`) first.
- **Ki4** Order `startedAt` is the first unit start. `readyAt` is set only when every unit is done, inside the same transaction.
- **Ki5** Planned times are computed on read: `dispatchReadyPlanned = deliveryInstant - company.deliveryLeadMinutes`; `kitchenReadyPlanned = dispatchReadyPlanned - kitchen.prepBufferMinutes` (default 30). `LATE` means not ready and `now > kitchenReadyPlanned`. `AT_RISK` means not ready and within `kitchen.atRiskMinutes` (default 30) before `kitchenReadyPlanned`.
- **Ki6** Admin force-complete starts and finishes every unfinished unit of an order and sets `readyAt`.
- **Ki7** The board is one aggregated query by date and optional station, sorted by planned kitchen-ready time. It must stay responsive at 400 orders.
- **D1** Tables: `drops(deliveryDate, companyId, addressId, deliveryTime, driverId, deliveredAt, deliveredBy, note, onTime)`, unique on (`deliveryDate`, `companyId`, `addressId`, `deliveryTime`); `order_dispatch_state(orderId PK, dropId, dispatchReadyAt, outForDeliveryAt, deliveredAt)`. Both are created or updated by the `order.confirmed` and `order.delivery-changed` hooks. A drop's driver defaults to the company default driver.
- **D2** Per-order steps: kitchen ready, dispatch ready, out for delivery (needs a driver on the drop), delivered. Each step needs the previous one and cannot repeat (conditional updates). Drop-level batch endpoints apply a step to every order in the drop atomically and return 409 listing the blocking orders if any order is not in the required previous state.
- **D3** The driver marks a drop delivered (note optional). It requires every non-cancelled order in the drop to be out for delivery. It sets `deliveredAt` on each order and drop, calls `OrdersPort.markDelivered`, and sets `onTime = deliveredAt <= deliveryInstant + delivery.onTimeGraceMinutes` (default 0).
- **D4** A driver sees only drops where `driverId = me` and `deliveryDate = today`. Admin and dispatch see all.

---

## 7. Billing, settings, staff, dashboards

- **B1** Billable orders are CONFIRMED or DELIVERED and not on an invoice (`orders.invoiceId` is null). An order is on at most one invoice because the pointer is a single nullable foreign key.
- **B2** `Invoice(number, companyId, status OPEN|PAID|VOID, totalCents, createdAt, paidAt, voidedAt)`. An invoice's items are the orders pointing to it. `totalCents` is the sum of their totals at creation, and a test asserts it stays equal.
- **B3** Creating an invoice (company plus chosen orders, default all billable up to a chosen delivery date) is one transaction. It calls `OrdersPort.attachToInvoice`, which uses a conditional update. If the updated count differs from the requested count, the whole thing fails and rolls back.
- **B4** Invoiced orders have locked money. Cancel, reject and line edits return 422 `ORDER_INVOICED`. Time, address and packaging overrides are still allowed. To change money, void an OPEN invoice (this detaches its orders), then change. A PAID invoice cannot be voided (adjustments are listed as "next" in the README).
- **B5** Mark paid is OPEN to PAID, conflict-safe. Cancelled and rejected orders are never billable.
- **S1** Settings keys and types live in a shared registry (zod): `kitchen.timezone`, `kitchen.workingDays`, `kitchen.prepBufferMinutes`, `kitchen.atRiskMinutes`, `cutoff.time`, `cutoff.workingDaysBefore`, `cutoff.autoProcess`, `delivery.onTimeGraceMinutes`. Kitchen holidays have their own CRUD. ADMIN only. Settings are cached in memory and invalidated on write.
- **R1** Roles: `ADMIN, KITCHEN, DISPATCH, DRIVER`. One role per staff user, stored as text validated against the registry. Admins create staff, set roles, deactivate and reset passwords.
- **R2** Permissions are `<resource>:<action>`. The default is deny. A driver's row scope comes from the query, not from a permission string.
- **R3** Starting map (Session B2 finalizes): KITCHEN gets kitchen read and unit actions, orders read, dishes read. DISPATCH gets orders read, dispatch actions, drops, companies read. DRIVER gets own-drop read and own-drop deliver. ADMIN gets everything.
- **Dash** Every dashboard figure is defined in `docs/dashboards.md` (what counts, grouping date in kitchen zone, treatment of DRAFT, CANCELLED, REJECTED, and missing data shown as "-", never 0). Starter content: Admin (orders by status for today and tomorrow, uninvoiced total per company, dishes missing a price per tier, late orders). Kitchen (units by station with started and done counts, late and at-risk list). Dispatch (drops by stage, unassigned drops, late drops). Driver (my drops today).

---

## 8. Data-model rules the schema must encode

1. Postgres types: `timestamptz` for instants, `date` for delivery dates, `Int` for cents. Do not use Prisma `Float` anywhere.
2. Enums: `OrderStatus`, `InvoiceStatus`, `Temperature`, `PackagingType`, `PriceSubjectType`, `DerivationKind`, `OrderEventType`. Roles are text.
3. Partial unique indexes and CHECK constraints go in hand-edited migration SQL: one default price tier, one default address per company, `quantity > 0`, `cents >= 0`, and lowercase checks (`email = lower(email)`, same for domain and sku). Invoice exclusivity needs no partial index because `orders.invoice_id` is a single nullable foreign key.
4. Names: tables snake_case plural via `@@map`, columns snake_case via `@map`.
5. Foreign keys use `onDelete: Restrict`, except pure child rows (option group options).
6. Every table has `createdAt` and `updatedAt`. `Order` has `version`.
7. JSON only for snapshots (`dishSnapshot`, `optionsSnapshot`, `addressSnapshot`, event meta). Relational facts are never JSON.
8. Indexes: `orders(delivery_date, status)`, `orders(company_id, delivery_date)`, `orders(invoice_id)`, `order_line_combos(order_line_id)`, `prep_units(combo_id)`, `drops(delivery_date, driver_id)`, `employees(company_id)`.
9. Test fixtures: a small deterministic dataset (3 companies, 6 employees, 12 dishes, 3 tiers including one derived, menu with one secret category, one hidden item) used by integration tests. The demo-data refresher is separate and built in Phase 2.

---

## 9. Proposed and open decisions

Add proposals here. Defaults already assumed: the kitchen and all companies share one time zone; packaging values are STANDARD, ECO, INSULATED; the order form disables fields the employee may not change.

- **Proposed decision (Session A):** Use ESLint `no-restricted-imports` for cross-module public API boundaries, allowing only `modules/<name>/index.js` from outside a module. This is the simplest rule compatible with the ESM source layout; verify the rule with a deliberately invalid import before the platform milestone is committed.
- **Proposed decision (Session A):** The single-instance API throttles login after five failed attempts per normalized email for 15 minutes in memory. If the deployment later runs more than one API instance, move this limit to a shared store or database.
- **Proposed decision (Session A):** Keep the Prisma runtime pool at five connections and apply migrations on the direct `DATABASE_URL`. Each test run creates a unique template database, migrates it once, clones it by worker, and drops the clones afterwards.
- **Proposed decision (Session A):** Bind local Compose PostgreSQL to host port 55432. Another local PostgreSQL server occupies port 5432, so this keeps the worktree's `fernleaf_a` database isolated. CI keeps its own port 5432 service.
- **Proposed decision (Session A):** Use `127.0.0.1` in the local database URL. The pinned Prisma schema engine could not connect through `localhost` on this Windows host, while the `pg` driver could; explicit IPv4 fixed migration creation.
- **Proposed decision (Session B1):** A partial unique index enforces *at most one* default tier and default address per company; the tier/company services must enforce existence during create, reassignment and deactivation because a row-local CHECK or partial unique index cannot enforce *at least one* across rows. Draft orders may leave address and address snapshot null until placement.
- **Proposed decision (Session B1):** Store settings values as strings validated by the shared settings registry, and company working days as a PostgreSQL integer array (nonempty, values 1–7). These are typed data rather than snapshot JSON. Services reject duplicate weekdays. `PriceEntry.subjectId` is polymorphic by `subjectType`, so the pricing service validates the referenced dish or option; PostgreSQL cannot attach one ordinary foreign key to two tables.
- **Proposed decision (Session A follow-up):** Login throttling uses client IP plus normalized email, with five failures in a sliding five-minute window. The in-memory map removes expired entries and caps at 10,000 keys; a deployment with multiple API instances needs a shared store.
- **Proposed decision (Session A follow-up):** Staff role changes and deactivations take a transaction-level advisory lock before checking whether another active admin remains. This serializes concurrent admin removal attempts.
- **Proposed decision (Session A follow-up):** The API uses 201 only for resource creation and 200 for other successful commands, matching OpenAPI. A malformed JSON body gets 400 `MALFORMED_JSON`; valid JSON that fails a contract gets 422 `VALIDATION_ERROR`.
- **Proposed decision (Session W):** Until feature permissions and settings contracts arrive, the web navigation registers only the shared `auth:me` Home item. Role landing pages are placeholders and the kitchen-time formatters require an explicit zone supplied by future settings data. This avoids inventing feature permissions or a browser-time-zone fallback.
