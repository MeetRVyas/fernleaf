import { AUTH_PERM } from './auth.js';
import { STAFF_PERM } from './staff.js';
export const PERM = { auth: AUTH_PERM, staff: STAFF_PERM } as const;
export type Permission = (typeof AUTH_PERM)[keyof typeof AUTH_PERM] | (typeof STAFF_PERM)[keyof typeof STAFF_PERM];
export const ROLES = ['ADMIN', 'KITCHEN', 'DISPATCH', 'DRIVER'] as const;
export type Role = (typeof ROLES)[number];
const ALL = [...Object.values(AUTH_PERM), ...Object.values(STAFF_PERM)];
const BASE = [AUTH_PERM.me, AUTH_PERM.logout];
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = { ADMIN: ALL, KITCHEN: BASE, DISPATCH: BASE, DRIVER: BASE };
export function can(user: { role: Role }, permission: string): boolean { return ROLE_PERMISSIONS[user.role].includes(permission); }
