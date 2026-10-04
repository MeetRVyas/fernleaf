import { authRoutes } from './auth.js';
import { staffRoutes } from './staff.js';
import { coreRoutes } from './core.js';
import { settingsRoutes } from './settings.js';
import { referenceRoutes } from './reference.js';
import { catalogueRoutes } from './catalogue.js';
import { pricingRoutes } from './pricing.js';
import { companiesRoutes } from './companies.js';
import { employeesRoutes } from './employees.js';
import { menuRoutes } from './menu.js';
import { ordersRoutes } from './orders.js';
import { kitchenRoutes } from './kitchen.js';
import { dispatchRoutes } from './dispatch.js';
import { billingRoutes } from './billing.js';
import { dashboardsRoutes } from './dashboards.js';
export * from './auth.js';
export * from './staff.js';
export * from './core.js';
export * from './settings.js';
export * from './reference.js';
export * from './catalogue.js';
export * from './pricing.js';
export * from './companies.js';
export * from './employees.js';
export * from './menu.js';
export * from './orders.js';
export * from './kitchen.js';
export * from './dispatch.js';
export * from './billing.js';
export * from './dashboards.js';
export const allRoutes = [
  ...coreRoutes,
  ...authRoutes,
  ...staffRoutes,
  ...settingsRoutes,
  ...referenceRoutes,
  ...catalogueRoutes,
  ...pricingRoutes,
  ...companiesRoutes,
  ...employeesRoutes,
  ...menuRoutes,
  ...ordersRoutes,
  ...kitchenRoutes,
  ...dispatchRoutes,
  ...billingRoutes,
  ...dashboardsRoutes,
] as const;
