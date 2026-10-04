import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import { cents, notImplemented } from './common.js';

export const dashboardMetric = z.object({
  label: z.string(),
  value: z.union([z.number(), z.string()]).nullable(),
});
export const adminDashboard = defineRoute({
  id: 'dashboards.admin',
  method: 'GET',
  path: '/dashboards/admin',
  permission: PERM.dashboards.admin,
  response: z.object({
    ordersByStatus: z.array(dashboardMetric),
    uninvoicedByCompany: z.array(
      z.object({ companyId: z.uuid(), totalCents: cents }),
    ),
    missingPricesByTier: z.array(dashboardMetric),
    lateOrders: z.array(z.uuid()),
  }),
  errors: notImplemented,
});
export const kitchenDashboard = defineRoute({
  id: 'dashboards.kitchen',
  method: 'GET',
  path: '/dashboards/kitchen',
  permission: PERM.dashboards.kitchen,
  response: z.object({
    unitsByStation: z.array(dashboardMetric),
    lateOrderIds: z.array(z.uuid()),
    atRiskOrderIds: z.array(z.uuid()),
  }),
  errors: notImplemented,
});
export const dispatchDashboard = defineRoute({
  id: 'dashboards.dispatch',
  method: 'GET',
  path: '/dashboards/dispatch',
  permission: PERM.dashboards.dispatch,
  response: z.object({
    dropsByStage: z.array(dashboardMetric),
    unassignedDropIds: z.array(z.uuid()),
    lateDropIds: z.array(z.uuid()),
  }),
  errors: notImplemented,
});
export const driverDashboard = defineRoute({
  id: 'dashboards.driver',
  method: 'GET',
  path: '/dashboards/driver',
  permission: PERM.dashboards.driver,
  response: z.object({ myDropIds: z.array(z.uuid()) }),
  errors: notImplemented,
});
export const dashboardsRoutes = [
  adminDashboard,
  kitchenDashboard,
  dispatchDashboard,
  driverDashboard,
] as const;
