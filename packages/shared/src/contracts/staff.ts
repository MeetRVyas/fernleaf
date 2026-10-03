import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM, ROLES } from '../permissions/roles.js';
import { staffPublic } from './auth.js';
import { pageResponse, paginationQuery } from '../helpers/pagination.js';

const id = z.object({ id: z.string().uuid() });
export const listStaff = defineRoute({ id: 'staff.list', method: 'GET', path: '/staff', permission: PERM.staff.list, query: paginationQuery, response: pageResponse(staffPublic), errors: ['UNAUTHENTICATED', 'FORBIDDEN'] });
export const createStaff = defineRoute({ id: 'staff.create', method: 'POST', path: '/staff', permission: PERM.staff.create, body: z.object({ name: z.string().min(1), email: z.email(), role: z.enum(ROLES), password: z.string().min(8) }), response: staffPublic, errors: ['VALIDATION_ERROR', 'CONFLICT'] });
export const changeRole = defineRoute({ id: 'staff.role', method: 'PATCH', path: '/staff/:id/role', permission: PERM.staff.role, params: id, body: z.object({ role: z.enum(ROLES) }), response: staffPublic, errors: ['NOT_FOUND'] });
export const deactivateStaff = defineRoute({ id: 'staff.deactivate', method: 'POST', path: '/staff/:id/deactivate', permission: PERM.staff.deactivate, params: id, response: staffPublic, errors: ['NOT_FOUND'] });
export const resetStaffPassword = defineRoute({ id: 'staff.resetPassword', method: 'POST', path: '/staff/:id/reset-password', permission: PERM.staff.resetPassword, params: id, body: z.object({ password: z.string().min(8) }), response: z.object({ ok: z.literal(true) }), errors: ['NOT_FOUND'] });
export const staffRoutes = [listStaff, createStaff, changeRole, deactivateStaff, resetStaffPassword] as const;
