import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM, ROLES } from '../permissions/roles.js';

export const staffPublic = z.object({ id: z.string().uuid(), name: z.string(), email: z.email(), role: z.enum(ROLES), isActive: z.boolean() });
export const login = defineRoute({ id: 'auth.login', method: 'POST', path: '/auth/login', permission: null, body: z.object({ email: z.email(), password: z.string().min(1) }), response: staffPublic, errors: ['VALIDATION_ERROR', 'UNAUTHENTICATED', 'THROTTLED'] });
export const logout = defineRoute({ id: 'auth.logout', method: 'POST', path: '/auth/logout', permission: PERM.auth.logout, response: z.object({ ok: z.literal(true) }), errors: ['UNAUTHENTICATED'] });
export const me = defineRoute({ id: 'auth.me', method: 'GET', path: '/auth/me', permission: PERM.auth.me, response: staffPublic.extend({ permissions: z.array(z.enum([...Object.values(PERM.auth), ...Object.values(PERM.staff)])) }), errors: ['UNAUTHENTICATED'] });
export const authRoutes = [login, logout, me] as const;
