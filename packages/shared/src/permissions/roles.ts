import { AUTH_PERM, AUTH_GRANTS } from './auth.js';
import { STAFF_PERM, STAFF_GRANTS } from './staff.js';
import { REFERENCE_PERM, REFERENCE_GRANTS } from './reference.js';
import { CATALOGUE_PERM, CATALOGUE_GRANTS } from './catalogue.js';
import { PRICING_PERM, PRICING_GRANTS } from './pricing.js';
import { COMPANIES_PERM, COMPANIES_GRANTS } from './companies.js';
import { EMPLOYEES_PERM, EMPLOYEES_GRANTS } from './employees.js';
import { MENU_PERM, MENU_GRANTS } from './menu.js';
import { ORDERS_PERM, ORDERS_GRANTS } from './orders.js';
import { KITCHEN_PERM, KITCHEN_GRANTS } from './kitchen.js';
import { DISPATCH_PERM, DISPATCH_GRANTS } from './dispatch.js';
import { SETTINGS_PERM, SETTINGS_GRANTS } from './settings.js';
import { BILLING_PERM, BILLING_GRANTS } from './billing.js';
import { DASHBOARDS_PERM, DASHBOARDS_GRANTS } from './dashboards.js';

export const PERM = {
  auth: AUTH_PERM,
  staff: STAFF_PERM,
  reference: REFERENCE_PERM,
  catalogue: CATALOGUE_PERM,
  pricing: PRICING_PERM,
  companies: COMPANIES_PERM,
  employees: EMPLOYEES_PERM,
  menu: MENU_PERM,
  orders: ORDERS_PERM,
  kitchen: KITCHEN_PERM,
  dispatch: DISPATCH_PERM,
  settings: SETTINGS_PERM,
  billing: BILLING_PERM,
  dashboards: DASHBOARDS_PERM,
} as const;
export type Permission = {
  [M in keyof typeof PERM]: (typeof PERM)[M][keyof (typeof PERM)[M]];
}[keyof typeof PERM];
export const ROLES = ['ADMIN', 'KITCHEN', 'DISPATCH', 'DRIVER'] as const;
export type Role = (typeof ROLES)[number];
const GRANTS = [
  AUTH_GRANTS,
  STAFF_GRANTS,
  REFERENCE_GRANTS,
  CATALOGUE_GRANTS,
  PRICING_GRANTS,
  COMPANIES_GRANTS,
  EMPLOYEES_GRANTS,
  MENU_GRANTS,
  ORDERS_GRANTS,
  KITCHEN_GRANTS,
  DISPATCH_GRANTS,
  SETTINGS_GRANTS,
  BILLING_GRANTS,
  DASHBOARDS_GRANTS,
];
export const ALL: readonly Permission[] = Object.values(PERM).flatMap(
  (module) => Object.values(module),
);
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: GRANTS.flatMap((module) => module.ADMIN),
  KITCHEN: GRANTS.flatMap((module) => module.KITCHEN),
  DISPATCH: GRANTS.flatMap((module) => module.DISPATCH),
  DRIVER: GRANTS.flatMap((module) => module.DRIVER),
};
export function can(user: { role: Role }, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.role].includes(permission);
}
export function isAdmin(user: { role: Role }): boolean {
  return can(user, STAFF_PERM.create);
}
