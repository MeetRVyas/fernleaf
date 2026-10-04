# Dashboard figures for Phase 2

Every date is a kitchen-zone calendar date from `Clock.today()`. An absent value is `null` in the API and “–” in the UI. A measured count of zero is shown as `0`. The dashboard endpoints and permissions are in `packages/shared/src/contracts/dashboards.ts`.

| Role | Figure | Calculation and exclusions | Why |
|---|---|---|---|
| Admin | Orders by status, today and tomorrow | Count orders by `deliveryDate` and each status. Show DRAFT, CANCELLED and REJECTED as separate counts; do not add them to active counts. | Exposes work and decisions due now. |
| Admin | Uninvoiced total per company | Sum `totalCents` for CONFIRMED or DELIVERED orders whose `invoiceId` is null, grouped by order `companyId`; DRAFT, PLACED, CANCELLED and REJECTED are excluded. | Finds company balances needing invoices. |
| Admin | Missing prices per tier | Count active dishes whose resolved tier price is missing or zero, per active tier. | Finds menu gaps before orders are placed. |
| Admin | Late orders | Confirmed orders for today with kitchen `readyAt` null and `Clock.now()` after planned kitchen-ready; delivered, cancelled and rejected orders are excluded. | Shows orders needing intervention. |
| Kitchen | Units by station | For confirmed orders today, count prep units and separately count those with `startedAt` and `doneAt`; a null station is Unassigned. | Shows station load and progress. |
| Kitchen | Late and at-risk orders | `readyAt` null and now respectively after planned kitchen-ready, or within `kitchen.atRiskMinutes` before it. Cancelled and rejected orders are excluded. | Prioritizes preparation. |
| Dispatch | Drops by stage | Count today’s drops by the least advanced non-cancelled order state. A drop with no active orders is omitted. | Shows what can leave the kitchen. |
| Dispatch | Unassigned and late drops | Unassigned means `driverId` null. Late means an undelivered drop past delivery instant; cancelled/rejected orders do not count. | Finds routing and delivery problems. |
| Driver | My drops today | Count and list drops whose `driverId` is the current staff id and `deliveryDate` is `Clock.today()`, ordered by delivery time. | Gives the driver a short action list. |

No sales chart, average delivery time or percent on-time is shown until the underlying statuses and timestamps are fully implemented and verified. Tests should distinguish no data from a real zero and check the daylight-saving cut-off vectors in `decisions.md`.
